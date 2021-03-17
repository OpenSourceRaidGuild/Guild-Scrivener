import {
  buildRaidStats,
  buildRepository,
  buildRepositoryEvent,
} from '../testUtils/dataFactory';
import { firestore } from '../testUtils/firebaseUtils';
import { collections } from '../utils/firebase';
import runOctokitWebhook from '../testUtils/runOctokitWebhook';
import { rest, server } from '../testUtils/msw';
import completeRaid from './completeRaid';

it(`does not complete a raid if repository is not a fork`, async () => {
  const repositoryArchivedEvent = buildRepositoryEvent({
    action: 'archived',
    isFork: false,
  });
  const result = await runOctokitWebhook(() =>
    completeRaid(repositoryArchivedEvent)
  );

  const raidDocsSnapshot = await firestore
    .collection(collections.raidStats)
    .get();
  expect(raidDocsSnapshot.docs).toStrictEqual([]);

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
    action: 'archived',
  });
  const result = await runOctokitWebhook(() =>
    completeRaid(repositoryArchivedEvent)
  );

  const raidDocsSnapshot = await firestore
    .collection(collections.raidStats)
    .get();
  expect(raidDocsSnapshot.docs).toStrictEqual([]);

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
    dungeon: raidRepo.parent!.full_name,
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
    action: 'archived',
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
    // Use set hours to stabilize results
    createdAt: new Date().setHours(0, 0, 0, 0) - 259200000, // 3 days ago
    dungeon: raidRepo.parent!.full_name,
  });
  await firestore.collection(collections.raidStats).add(raidStats);

  server.use(
    rest.get('https://api.github.com/repos/:owner/:repo', (req, res, ctx) => {
      return res(ctx.json(raidRepo));
    }),
    rest.delete(
      'https://discord.com/api/webhooks/:webhookId/:token/messages/:messageId',
      (req, res, ctx) => {
        return res();
      }
    ),
    rest.post(
      'https://discord.com/api/webhooks/:id/:token',
      (req, res, ctx) => {
        return res(
          ctx.json({
            content: (req.body as any).content,
            id: '67890',
          })
        );
      }
    )
  );

  const repositoryArchivedEvent = buildRepositoryEvent({
    action: 'archived',
  });
  const result = await runOctokitWebhook(() =>
    completeRaid(repositoryArchivedEvent)
  );

  const sanitizedStdOut = result.stdOut
    .replace(new RegExp(repositoryArchivedEvent.id, 'g'), 'EVENT_ID')
    .replace(/(\w+|\w+\.\w+)\/((\w+(-\w+)+)|\w+)/g, 'OWNER/REPO');
  expect(sanitizedStdOut).toMatchInlineSnapshot(`
  "- Processing repository archived event 'EVENT_ID'
  ✔ Completed Raid OWNER/REPO"
  `);

  const raidDocsSnapshot = await firestore
    .collection(collections.raidStats)
    .get();
  expect(raidDocsSnapshot.docs.map((d) => d.data())).toStrictEqual([
    {
      ...raidStats,
      status: 'completed',
      duration: 4,
      discordMessageId: '67890',
    },
  ]);
});
