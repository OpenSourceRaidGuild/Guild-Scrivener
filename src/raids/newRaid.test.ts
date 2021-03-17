import {
  buildRaidStats,
  buildRepository,
  buildRepositoryEvent,
} from '../testUtils/dataFactory';
import runOctokitWebhook from '../testUtils/runOctokitWebhook';
import { firestore } from '../testUtils/firebaseUtils';
import { collections } from '../utils/firebase';
import { server, rest } from '../testUtils/msw';
import createNewRaid from './newRaid';
import { RaidStats } from './types/raidStats';

it(`does not create a raid if repository is not a fork`, async () => {
  const repositoryCreatedEvent = buildRepositoryEvent({
    action: 'created',
    isFork: false,
  });
  const result = await runOctokitWebhook(() =>
    createNewRaid(repositoryCreatedEvent)
  );

  const raidDocsSnapshot = await firestore
    .collection(collections.raidStats)
    .get();
  expect(raidDocsSnapshot.docs).toStrictEqual([]);

  const sanitizedStdOut = result.stdOut.replace(
    new RegExp(repositoryCreatedEvent.id, 'g'),
    'EVENT_ID'
  );
  expect(sanitizedStdOut).toMatchInlineSnapshot(`
    "- Processing repository created event 'EVENT_ID'
    ✖ Event 'EVENT_ID' did not meet criteria for Raid creation: Repository was not a fork"
  `);
});

it(`does not create a raid if an active raid already exists for the dungeon`, async () => {
  // Setup an existing raid
  const raidRepo = buildRepository();
  const raidStats = buildRaidStats({
    dungeon: raidRepo.parent!.full_name,
  });
  await firestore.collection(collections.raidStats).add(raidStats);

  server.use(
    rest.get('https://api.github.com/repos/:owner/:repo', (req, res, ctx) => {
      return res(ctx.json(raidRepo));
    })
  );

  const repositoryCreatedEvent = buildRepositoryEvent({
    action: 'created',
  });
  const result = await runOctokitWebhook(() =>
    createNewRaid(repositoryCreatedEvent)
  );

  const raidDocsSnapshot = await firestore
    .collection(collections.raidStats)
    .get();
  expect(raidDocsSnapshot.docs.map((d) => d.data())).toStrictEqual([raidStats]);

  const sanitizedStdOut = result.stdOut
    .replace(new RegExp(repositoryCreatedEvent.id, 'g'), 'EVENT_ID')
    .replace(/(\w+|\w+\.\w+)\/((\w+(-\w+)+)|\w+)/g, 'OWNER/REPO');
  expect(sanitizedStdOut).toMatchInlineSnapshot(`
    "- Processing repository created event 'EVENT_ID'
    ✖ An active Raid already exists for OWNER/REPO"
  `);
});

it(`creates a raid when called`, async () => {
  const mockCreatedAt = Date.now();
  jest.spyOn(Date, 'now').mockReturnValue(mockCreatedAt);

  const raidRepo = buildRepository();
  server.use(
    rest.get('https://api.github.com/repos/:owner/:repo', (req, res, ctx) => {
      return res(ctx.json(raidRepo));
    })
  );

  const repositoryCreatedEvent = buildRepositoryEvent({
    action: 'created',
  });
  const result = await runOctokitWebhook(() =>
    createNewRaid(repositoryCreatedEvent)
  );

  const raidDocsSnapshot = await firestore
    .collection(collections.raidStats)
    .get();
  const expectedRaidStats: RaidStats[] = [
    {
      additions: 0,
      changedFiles: 0,
      files: {},
      commits: 0,
      contributors: {},
      deletions: 0,
      dungeon: raidRepo.parent!.full_name,
      status: 'active',
      title: '[PLEASE RENAME ME]',
      createdAt: mockCreatedAt,
    },
  ];
  expect(raidDocsSnapshot.docs.map((d) => d.data())).toStrictEqual(
    expectedRaidStats
  );

  const sanitizedStdOut = result.stdOut
    .replace(new RegExp(repositoryCreatedEvent.id, 'g'), 'EVENT_ID')
    .replace(/(\w+|\w+\.\w+)\/((\w+(-\w+)+)|\w+)/g, 'OWNER/REPO');
  expect(sanitizedStdOut).toMatchInlineSnapshot(`
    "- Processing repository created event 'EVENT_ID'
    ✔ Created new Raid for OWNER/REPO"
  `);
});
