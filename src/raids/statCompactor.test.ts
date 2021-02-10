import { buildPushEvent, buildRaidStats } from '../testUtils/dataFactory';
import { firestore } from '../testUtils/firebaseUtils';
import { collections } from '../firebase';
import runOctokitWebhook from '../testUtils/runOctokitWebhook';
import statCompactor from './statCompactor';

const raidStats = buildRaidStats({
  dungeon: 'ecleptic-lizard/fly-catcher',
});

beforeEach(async () => {
  await firestore.collection(collections.raidStats).add(raidStats);
});

it('does not update stats for a raid if repository is not a fork', async () => {
  const pushEvent = buildPushEvent({
    isFork: false,
  });
  const result = await runOctokitWebhook(() => statCompactor(pushEvent));

  const raidDocsSnapshot = await firestore
    .collection(collections.raidStats)
    .get();
  expect(raidDocsSnapshot.docs).toHaveLength(1);
  expect(raidDocsSnapshot.docs.map((d) => d.data())).toStrictEqual([raidStats]);

  const sanitizedStdOut = result.stdOut
    .replace(new RegExp(pushEvent.id, 'g'), 'EVENT_ID')
    .replace(/(\w+|\w+\.\w+)\/((\w+(-\w+)+)|\w+)/g, 'OWNER/REPO');
  expect(sanitizedStdOut).toMatchInlineSnapshot(`
    "- Processing push event 'EVENT_ID'
    ✖ Event 'EVENT_ID' did not meet criteria for stat compacting: Repository was not a fork"
  `);
});
