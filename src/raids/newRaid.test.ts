import {
  buildRepository,
  buildRepositoryEvent,
} from '../testUtils/dataFactory';
import { RaidStats } from './types/raidStats';
import runOctokitWebhook from '../testUtils/runOctokitWebhook';
import { firestore } from '../testUtils/firebaseUtils';
import { collections } from '../firebase';
import { server, rest } from '../testUtils/msw';
import createNewRaid from './newRaid';

it(`does not create a raid if repository is not a fork`, async () => {
  const repositoryCreatedEvent = buildRepositoryEvent({
    eventType: 'created',
    isFork: false,
  });
  const result = await runOctokitWebhook(() =>
    createNewRaid(repositoryCreatedEvent)
  );

  const raidDocsSnapshot = await firestore
    .collection(collections.raidStats)
    .get();
  expect(raidDocsSnapshot.docs).toHaveLength(0);

  const sanitizedStdOut = result.stdOut.replace(
    new RegExp(repositoryCreatedEvent.id, 'g'),
    'EVENT_ID'
  );
  expect(sanitizedStdOut).toMatchInlineSnapshot(`
    "[96m- Processing repository created event 'EVENT_ID'[39m
    [91m✖ Event 'EVENT_ID' did not meet criteria for Raid creation: Repository was not a fork[39m"
  `);
});

it(`does not create a raid if an active raid already exists for the dungeon`, async () => {
  // Setup an existing raid
  const raidRepo = buildRepository();
  const raidStats: RaidStats = {
    additions: 0,
    changedFiles: 0,
    commits: 0,
    contributors: {},
    deletions: 0,
    dungeon: String(raidRepo.parent?.full_name),
    status: 'active',
    title: 'Potato',
  };
  await firestore.collection(collections.raidStats).add(raidStats);

  server.use(
    rest.get('https://api.github.com/repos/:owner/:repo', (req, res, ctx) => {
      return res(ctx.json(raidRepo));
    })
  );

  const repositoryCreatedEvent = buildRepositoryEvent({
    eventType: 'created',
  });
  const result = await runOctokitWebhook(() =>
    createNewRaid(repositoryCreatedEvent)
  );

  const raidDocsSnapshot = await firestore
    .collection(collections.raidStats)
    .get();
  // Only have the one document we setup earlier
  expect(raidDocsSnapshot.docs).toHaveLength(1);
  expect(raidDocsSnapshot.docs.map((d) => d.data())).toStrictEqual([raidStats]);

  const sanitizedStdOut = result.stdOut
    .replace(new RegExp(repositoryCreatedEvent.id, 'g'), 'EVENT_ID')
    .replace(/(\w+|\w+\.\w+)\/((\w+(-\w+)+)|\w+)/g, 'OWNER/REPO');
  expect(sanitizedStdOut).toMatchInlineSnapshot(`
    "[96m- Processing repository created event 'EVENT_ID'[39m
    [91m✖ An active Raid already exists for OWNER/REPO[39m"
  `);
});

it(`creates a raid when called`, async () => {
  const raidRepo = buildRepository();
  server.use(
    rest.get('https://api.github.com/repos/:owner/:repo', (req, res, ctx) => {
      return res(ctx.json(raidRepo));
    })
  );

  const repositoryCreatedEvent = buildRepositoryEvent({
    eventType: 'created',
  });
  const result = await runOctokitWebhook(() =>
    createNewRaid(repositoryCreatedEvent)
  );

  const raidDocsSnapshot = await firestore
    .collection(collections.raidStats)
    .get();
  expect(raidDocsSnapshot.docs).toHaveLength(1);
  expect(raidDocsSnapshot.docs.map((d) => d.data())).toStrictEqual([
    {
      additions: 0,
      changedFiles: 0,
      commits: 0,
      contributors: {},
      deletions: 0,
      dungeon: raidRepo.parent?.full_name,
      status: 'active',
      title: '[PLEASE RENAME ME]',
    },
  ]);

  const sanitizedStdOut = result.stdOut
    .replace(new RegExp(repositoryCreatedEvent.id, 'g'), 'EVENT_ID')
    .replace(/(\w+|\w+\.\w+)\/((\w+(-\w+)+)|\w+)/g, 'OWNER/REPO');
  expect(sanitizedStdOut).toMatchInlineSnapshot(`
    "[96m- Processing repository created event 'EVENT_ID'[39m
    [92m✔ Created new Raid for OWNER/REPO[39m"
  `);
});
