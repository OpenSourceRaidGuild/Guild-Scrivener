import {
  buildRaidStats,
  buildRepository,
  buildRepositoryEvent,
} from '../testUtils/dataFactory';
import { firestore } from '../testUtils/firebaseUtils';
import { collections } from '../firebase';
import runOctokitWebhook from '../testUtils/runOctokitWebhook';
import { rest, server } from '../testUtils/msw';
import completeRaid from './completeRaid';

it(`does not complete a raid if repository is not a fork`, async () => {
  const repositoryArchivedEvent = buildRepositoryEvent({
    eventType: 'archived',
    isFork: false,
  });
  const result = await runOctokitWebhook(() =>
    completeRaid(repositoryArchivedEvent)
  );

  const raidDocsSnapshot = await firestore
    .collection(collections.raidStats)
    .get();
  expect(raidDocsSnapshot.docs).toHaveLength(0);

  const sanitizedStdOut = result.stdOut.replace(
    new RegExp(repositoryArchivedEvent.id, 'g'),
    'EVENT_ID'
  );
  expect(sanitizedStdOut).toMatchInlineSnapshot(`
    "- Processing repository archived event 'EVENT_ID'
    ✖ Event 'EVENT_ID' did not meet criteria for Raid creation: Repository was not a fork"
  `);
});

it(`does not complete a raid if no active raid exists for the dungeon`, async () => {
  const repositoryArchivedEvent = buildRepositoryEvent({
    eventType: 'archived',
  });
  const result = await runOctokitWebhook(() =>
    completeRaid(repositoryArchivedEvent)
  );

  const raidDocsSnapshot = await firestore
    .collection(collections.raidStats)
    .get();
  expect(raidDocsSnapshot.docs).toHaveLength(0);

  const sanitizedStdOut = result.stdOut
    .replace(new RegExp(repositoryArchivedEvent.id, 'g'), 'EVENT_ID')
    .replace(/(\w+|\w+\.\w+)\/((\w+(-\w+)+)|\w+)/g, 'OWNER/REPO');
  expect(sanitizedStdOut).toMatchInlineSnapshot(`
    "- Processing repository archived event 'EVENT_ID'
    ✖ No active Raid exists for OWNER/REPO associated with event 'EVENT_ID'"
  `);
});

it(`does not complete a raid if more than one active raid exists for the dungeon`, async () => {
  // Setup an existing raid
  const raidRepo = buildRepository();
  const raidStats = buildRaidStats({
    dungeon: String(raidRepo.parent?.full_name),
    title: 'Migrate to Ecklston',
  });
  await firestore.collection(collections.raidStats).add(raidStats);
  await firestore.collection(collections.raidStats).add(raidStats);

  server.use(
    rest.get('https://api.github.com/repos/:owner/:repo', (req, res, ctx) => {
      return res(ctx.json(raidRepo));
    })
  );

  const repositoryArchivedEvent = buildRepositoryEvent({
    eventType: 'archived',
  });
  const result = await runOctokitWebhook(() =>
    completeRaid(repositoryArchivedEvent)
  );

  const raidDocsSnapshot = await firestore
    .collection(collections.raidStats)
    .get();
  expect(raidDocsSnapshot.docs).toHaveLength(2);
  expect(raidDocsSnapshot.docs.map((d) => d.data())).toStrictEqual([
    raidStats,
    raidStats,
  ]);

  const sanitizedStdOut = result.stdOut
    .replace(new RegExp(repositoryArchivedEvent.id, 'g'), 'EVENT_ID')
    .replace(/(\w+|\w+\.\w+)\/((\w+(-\w+)+)|\w+)/g, 'OWNER/REPO');
  expect(sanitizedStdOut).toMatchInlineSnapshot(`
    "- Processing repository archived event 'EVENT_ID'
    ✖ Found more than one active Raid for OWNER/REPO associated with event 'EVENT_ID':  [\\"Migrate to Ecklston\\",\\"Migrate to Ecklston\\"]"
  `);
});

it(`completes a raid when called`, async () => {
  // Setup an existing raid
  const raidRepo = buildRepository();
  const raidStats = buildRaidStats({
    dungeon: String(raidRepo.parent?.full_name),
  });
  const _ = await firestore.collection(collections.raidStats).add(raidStats);

  server.use(
    rest.get('https://api.github.com/repos/:owner/:repo', (req, res, ctx) => {
      return res(ctx.json(raidRepo));
    })
  );

  const repositoryArchivedEvent = buildRepositoryEvent({
    eventType: 'archived',
  });
  const result = await runOctokitWebhook(() =>
    completeRaid(repositoryArchivedEvent)
  );

  const raidDocsSnapshot = await firestore
    .collection(collections.raidStats)
    .get();
  expect(raidDocsSnapshot.docs).toHaveLength(1);
  expect(raidDocsSnapshot.docs.map((d) => d.data())).toStrictEqual([
    { ...raidStats, status: 'completed' },
  ]);

  const sanitizedStdOut = result.stdOut
    .replace(new RegExp(repositoryArchivedEvent.id, 'g'), 'EVENT_ID')
    .replace(/(\w+|\w+\.\w+)\/((\w+(-\w+)+)|\w+)/g, 'OWNER/REPO');
  expect(sanitizedStdOut).toMatchInlineSnapshot(`
    "- Processing repository archived event 'EVENT_ID'
    ✔ Completed Raid OWNER/REPO"
  `);
});
