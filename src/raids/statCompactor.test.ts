import {
  buildCommit,
  buildPushEvent,
  buildRaidStats,
  buildRepository,
  buildRepositoryEvent,
} from '../testUtils/dataFactory';
import { firestore } from '../testUtils/firebaseUtils';
import { collections } from '../firebase';
import runOctokitWebhook from '../testUtils/runOctokitWebhook';
import { rest, server } from '../testUtils/msw';
import statCompactor from './statCompactor';

const raidStats = buildRaidStats({});

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

it('does not update stats for a raid if commits were not on the default branch', async () => {
  const pushEvent = buildPushEvent({
    isDefaultBranch: false,
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
    ✖ Event 'EVENT_ID' did not meet criteria for stat compacting: Was not a push event for the default branch"
  `);
});

it('does not update stats for a raid if repository is archived', async () => {
  const pushEvent = buildPushEvent({
    isArchived: true,
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
    ✖ Event 'EVENT_ID' did not meet criteria for stat compacting: Repository is archived"
  `);
});

it('does not update stats for a raid if there were no stat related commits', async () => {
  const pushEvent = buildPushEvent({
    commits: [],
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
    ✖ Event 'EVENT_ID' had no commits that affect stats"
  `);
});

it('updates raid stats when called', async () => {
  const owner = raidStats.dungeon.split('/')[0];
  const repo = raidStats.dungeon.split('/')[1];
  const raidRepo = buildRepository({
    parentOwnerName: owner,
    parentRepoName: repo,
  });
  const commit = buildCommit({
    ownerName: owner,
    repoName: repo,
  });

  server.use(
    rest.get('https://api.github.com/repos/:owner/:repo', (req, res, ctx) => {
      return res(ctx.json(raidRepo));
    }),
    rest.get(
      'https://api.github.com/repos/:owner/:repo/commits/:ref',
      (req, res, ctx) => {
        return res(ctx.json(commit));
      }
    ),
    rest.get(
      'https://github.com/:owner/:repo/branch_commits/:ref',
      (req, res, ctx) => {
        return res(
          ctx.text(
            `<svg class="octicon octicon-git-branch" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true"><path fill-rule="evenodd" d="M11.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122V6A2.5 2.5 0 0110 8.5H6a1 1 0 00-1 1v1.128a2.251 2.251 0 11-1.5 0V5.372a2.25 2.25 0 111.5 0v1.836A2.492 2.492 0 016 7h4a1 1 0 001-1v-.628A2.25 2.25 0 019.5 3.25zM4.25 12a.75.75 0 100 1.5.75.75 0 000-1.5zM3.5 3.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0z"></path></svg><ul class="js-branches-list"><li class="branch">This commit does not belong to any branch on this repository.</li></ul>`
          )
        );
      }
    )
  );

  const pushEvent = buildPushEvent({
    ownerName: owner,
    repoName: repo,
    commits: [
      {
        id: '123',
        tree_id: '456',
        url: '',
        distinct: true,
        timestamp: '',
        message: 'feat: did stuff',
        author: {
          name: 'Bob',
          email: 'bob@example.com',
          username: 'bob',
        },
        committer: {
          name: 'Bob',
          email: 'bob@example.com',
          username: 'bob',
        },
        added: ['src/raids/statCompactor.test.ts'],
        modified: [],
        removed: [],
      },
    ],
  });
  const result = await runOctokitWebhook(() => statCompactor(pushEvent));

  const raidDocsSnapshot = await firestore
    .collection(collections.raidStats)
    .get();
  expect(raidDocsSnapshot.docs).toHaveLength(1);
  expect(raidDocsSnapshot.docs.map((d) => d.data())).toStrictEqual([
    {
      ...raidStats,
      additions: commit.stats.additions,
      deletions: commit.stats.deletions,
      commits: 1,
      contributors: {
        [commit.author.id]: {
          userId: commit.author.id,
          user: commit.author.login,
          avatarUrl: commit.author.avatar_url,
          additions: commit.stats.additions,
          deletions: commit.stats.deletions,
          commits: 1,
        },
      },
    },
  ]);

  const sanitizedStdOut = result.stdOut
    .replace(new RegExp(pushEvent.id, 'g'), 'EVENT_ID')
    .replace(/(\w+|\w+\.\w+)\/((\w+(-\w+)+)|\w+)/g, 'OWNER/REPO');
  expect(sanitizedStdOut).toMatchInlineSnapshot(`
    "- Processing push event 'EVENT_ID'
    ✔ Successfully updated OWNER/REPO Raid stats on event 'EVENT_ID'!"
  `);
});
