import {
  buildCommit,
  buildPushEvent,
  buildRaidStats,
  buildRepository,
} from '../testUtils/dataFactory';
import { firestore } from '../testUtils/firebaseUtils';
import { collections } from '../firebase';
import runOctokitWebhook from '../testUtils/runOctokitWebhook';
import { rest, server } from '../testUtils/msw';
import statCompactor, {
  fetchAndFilterCommitData,
  compactStatsFromCommitData,
  getUpdatesFromCompactedStats,
} from './statCompactor';
import { RaidStats } from './types/raidStats';

const raidStats = buildRaidStats({});

it('does not update stats for a raid if repository is not a fork', async () => {
  await firestore.collection(collections.raidStats).add(raidStats);

  const pushEvent = buildPushEvent({
    isFork: false,
  });
  const result = await runOctokitWebhook(() => statCompactor(pushEvent));

  const raidDocsSnapshot = await firestore
    .collection(collections.raidStats)
    .get();
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
  await firestore.collection(collections.raidStats).add(raidStats);

  const pushEvent = buildPushEvent({
    isDefaultBranch: false,
  });
  const result = await runOctokitWebhook(() => statCompactor(pushEvent));

  const raidDocsSnapshot = await firestore
    .collection(collections.raidStats)
    .get();
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
  await firestore.collection(collections.raidStats).add(raidStats);

  const pushEvent = buildPushEvent({
    isArchived: true,
  });
  const result = await runOctokitWebhook(() => statCompactor(pushEvent));

  const raidDocsSnapshot = await firestore
    .collection(collections.raidStats)
    .get();
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
  await firestore.collection(collections.raidStats).add(raidStats);

  const pushEvent = buildPushEvent({
    commits: 0,
  });
  const result = await runOctokitWebhook(() => statCompactor(pushEvent));

  const raidDocsSnapshot = await firestore
    .collection(collections.raidStats)
    .get();
  expect(raidDocsSnapshot.docs.map((d) => d.data())).toStrictEqual([raidStats]);

  const sanitizedStdOut = result.stdOut
    .replace(new RegExp(pushEvent.id, 'g'), 'EVENT_ID')
    .replace(/(\w+|\w+\.\w+)\/((\w+(-\w+)+)|\w+)/g, 'OWNER/REPO');
  expect(sanitizedStdOut).toMatchInlineSnapshot(`
    "- Processing push event 'EVENT_ID'
    ✖ Event 'EVENT_ID' had no commits that affect stats"
  `);
});

it(`does not update stats for a raid if more than one active raid exists for the dungeon`, async () => {
  // Setup an existing raid
  await firestore.collection(collections.raidStats).add(raidStats);

  const owner = raidStats.dungeon.split('/')[0];
  const repo = raidStats.dungeon.split('/')[1];
  const raidRepo = buildRepository({
    parentOwnerName: owner,
    parentRepoName: repo,
  });
  const commit = buildCommit({
    ownerName: owner,
    repoName: repo,
    changedFiles: 1,
  });
  await firestore.collection(collections.raidStats).add(raidStats);

  server.use(
    rest.get('https://api.github.com/repos/:owner/:repo', (req, res, ctx) => {
      return res(ctx.json(raidRepo));
    }),
    rest.get(
      'https://api.github.com/repos/:owner/:repo/commits/:ref',
      (req, res, ctx) => {
        return res(ctx.json(commit));
      }
    )
  );

  const repositoryArchivedEvent = buildPushEvent();
  const result = await runOctokitWebhook(() =>
    statCompactor(repositoryArchivedEvent)
  );

  const raidDocsSnapshot = await firestore
    .collection(collections.raidStats)
    .get();
  expect(raidDocsSnapshot.docs.map((d) => d.data())).toStrictEqual([
    raidStats,
    raidStats,
  ]);

  const sanitizedStdOut = result.stdOut
    .replace(new RegExp(repositoryArchivedEvent.id, 'g'), 'EVENT_ID')
    .replace(/(\w+|\w+\.\w+)\/((\w+(-\w+)+)|\w+)/g, 'OWNER/REPO')
    .replace(new RegExp(raidStats.title, 'g'), 'RAID_TITLE');
  expect(sanitizedStdOut).toMatchInlineSnapshot(`
    "- Processing push event 'EVENT_ID'
    ✖ Found more than one active Raid for OWNER/REPO associated with event 'EVENT_ID': [\\"RAID_TITLE\\",\\"RAID_TITLE\\"]"
  `);
});

it(`does not update stats for a raid if no active raid exists for the dungeon`, async () => {
  const owner = raidStats.dungeon.split('/')[0];
  const repo = raidStats.dungeon.split('/')[1];
  const raidRepo = buildRepository({
    parentOwnerName: owner,
    parentRepoName: repo,
  });
  const commit = buildCommit({
    ownerName: owner,
    repoName: repo,
    changedFiles: 1,
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
    )
  );

  const repositoryArchivedEvent = buildPushEvent();
  const result = await runOctokitWebhook(() =>
    statCompactor(repositoryArchivedEvent)
  );

  const raidDocsSnapshot = await firestore
    .collection(collections.raidStats)
    .get();
  expect(raidDocsSnapshot.docs).toStrictEqual([]);

  const sanitizedStdOut = result.stdOut
    .replace(new RegExp(repositoryArchivedEvent.id, 'g'), 'EVENT_ID')
    .replace(/(\w+|\w+\.\w+)\/((\w+(-\w+)+)|\w+)/g, 'OWNER/REPO');
  expect(sanitizedStdOut).toMatchInlineSnapshot(`
    "- Processing push event 'EVENT_ID'
    ✖ No active Raid for OWNER/REPO associated with event 'EVENT_ID'"
  `);
});

it('updates raid stats when called', async () => {
  await firestore.collection(collections.raidStats).add(raidStats);

  const owner = raidStats.dungeon.split('/')[0];
  const repo = raidStats.dungeon.split('/')[1];
  const raidRepo = buildRepository({
    parentOwnerName: owner,
    parentRepoName: repo,
  });
  const commit = buildCommit({
    ownerName: owner,
    repoName: repo,
    changedFiles: 1,
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
    )
  );

  const pushEvent = buildPushEvent({
    ownerName: owner,
    repoName: repo,
    commits: 1,
  });
  const result = await runOctokitWebhook(() => statCompactor(pushEvent));

  const raidDocsSnapshot = await firestore
    .collection(collections.raidStats)
    .get();
  const expectedRaidStats: RaidStats[] = [
    {
      ...raidStats,
      additions: commit.stats.additions,
      deletions: commit.stats.deletions,
      changedFiles: commit.files.length,
      files: {
        [commit.files[0].filename]: {
          url: commit.files[0].blob_url,
          filename: commit.files[0].filename,
          contributors: [commit.author.id!],
        },
      },
      commits: 1,
      contributors: {
        [commit.author.id!]: {
          userId: commit.author.id!,
          user: commit.author.login!,
          avatarUrl: commit.author.avatar_url!,
          additions: commit.stats.additions,
          deletions: commit.stats.deletions,
          commits: 1,
        },
      },
    },
  ];
  expect(raidDocsSnapshot.docs.map((d) => d.data())).toStrictEqual(
    expectedRaidStats
  );

  const sanitizedStdOut = result.stdOut
    .replace(new RegExp(pushEvent.id, 'g'), 'EVENT_ID')
    .replace(/(\w+|\w+\.\w+)\/((\w+(-\w+)+)|\w+)/g, 'OWNER/REPO');
  expect(sanitizedStdOut).toMatchInlineSnapshot(`
    "- Processing push event 'EVENT_ID'
    ✔ Successfully updated OWNER/REPO Raid stats on event 'EVENT_ID'!"
  `);
});

describe('helpers', () => {
  describe('fetchAndFilterCommitData', () => {
    it('uses defaults if data is missing from fetched commit', async () => {
      server.use(
        rest.get(
          'https://api.github.com/repos/:owner/:repo/commits/123',
          (req, res, ctx) => {
            return res(
              ctx.json({
                parents: [{}],
              })
            );
          }
        )
      );

      const result = await fetchAndFilterCommitData('a', 'b', 'c/d', ['123']);

      expect(result).toMatchObject([
        {
          user: undefined,
          userId: undefined,
          avatarUrl: undefined,
          additions: 0,
          deletions: 0,
          changedFiles: [],
        },
      ]);
    });
  });

  describe('compactStatsFromCommitData', () => {
    it(`skips over commits with an undefined author`, () => {
      const nullAuthorCommit = {
        user: undefined,
        userId: undefined,
        avatarUrl: undefined,
        additions: 0,
        deletions: 0,
        parentCount: 1,
        isRaidCommit: true,
        changedFiles: [],
      };

      const result = compactStatsFromCommitData([nullAuthorCommit]);

      expect(result).toStrictEqual({});
    });

    it(`skips over commits that aren't raid commits`, () => {
      const nullAuthorCommit = {
        user: 'user',
        userId: 1,
        avatarUrl: 'https://github.com/octokit.png',
        additions: 0,
        deletions: 0,
        parentCount: 1,
        isRaidCommit: false,
        changedFiles: [],
      };

      const result = compactStatsFromCommitData([nullAuthorCommit]);

      expect(result).toStrictEqual({});
    });

    it(`skips over commits with more than one parent`, () => {
      const nullAuthorCommit = {
        user: 'user',
        userId: 1,
        avatarUrl: 'https://github.com/octokit.png',
        additions: 0,
        deletions: 0,
        parentCount: 2,
        isRaidCommit: true,
        changedFiles: [],
      };

      const result = compactStatsFromCommitData([nullAuthorCommit]);

      expect(result).toStrictEqual({});
    });

    it('compacts multiple commits by one user into one value', () => {
      const commitA = {
        user: 'bob',
        userId: 1,
        avatarUrl: 'https://github.com/octocat.png',
        additions: 1,
        deletions: 1,
        parentCount: 1,
        isRaidCommit: true,
        changedFiles: [
          {
            url: 'https://github.com/octocat/Hello-World/blob/master/README.md',
            filename: 'README.md',
          },
        ],
      };
      const commitB = {
        ...commitA,
        additions: 2,
        deletions: 2,
      };

      const result = compactStatsFromCommitData([commitA, commitB]);

      expect(result).toStrictEqual({
        [commitA.userId]: {
          userId: commitA.userId,
          user: commitA.user,
          avatarUrl: commitA.avatarUrl,
          additions: commitA.additions + commitB.additions,
          deletions: commitA.deletions + commitB.deletions,
          commits: 2,
          changedFiles: [...commitA.changedFiles, ...commitB.changedFiles],
        },
      });
    });
  });

  describe('getUpdatesFromCompactedStats', () => {
    it('merges new stats onto old stats', () => {
      const raidData: RaidStats = {
        additions: 1,
        deletions: 1,
        changedFiles: 1,
        commits: 1,
        createdAt: Date.now(),
        dungeon: 'octocat/Hello-World',
        status: 'active',
        title: 'Hello the worlds!',
        files: {
          'README.md': {
            url: 'https://github.com/octocat/Hello-World/blob/master/README.md',
            filename: 'README.md',
            contributors: [123],
          },
        },
        contributors: {
          123: {
            user: 'octocat',
            userId: 123,
            avatarUrl: 'https://github.com/octocat.png',
            additions: 1,
            deletions: 1,
            commits: 1,
          },
        },
      };
      const compactedStatsToAdd = {
        123: {
          user: 'octocat',
          userId: 123,
          avatarUrl: 'https://github.com/octocat.png',
          additions: 1,
          deletions: 1,
          commits: 1,
          changedFiles: [
            {
              url:
                'https://github.com/octocat/Hello-World/blob/master/NEWFILE.md',
              filename: 'NEWFILE.md',
            },
          ],
        },
      };

      const result = getUpdatesFromCompactedStats(
        raidData,
        compactedStatsToAdd
      );

      const statsToAdd = compactedStatsToAdd[123];
      expect(result).toStrictEqual({
        commits: raidData.commits + statsToAdd.commits,
        additions: raidData.additions + statsToAdd.additions,
        deletions: raidData.deletions + statsToAdd.deletions,
        changedFiles: raidData.changedFiles + statsToAdd.changedFiles.length,
        files: {
          ...raidData.files,
          [statsToAdd.changedFiles[0].filename]: {
            filename: statsToAdd.changedFiles[0].filename,
            url: statsToAdd.changedFiles[0].url,
            contributors: [statsToAdd.userId],
          },
        },
        contributors: {
          [statsToAdd.userId]: {
            user: statsToAdd.user,
            userId: statsToAdd.userId,
            avatarUrl: raidData.contributors[123].avatarUrl,
            additions:
              raidData.contributors[123].additions + statsToAdd.additions,
            deletions:
              raidData.contributors[123].deletions + statsToAdd.deletions,
            commits: raidData.contributors[123].commits + statsToAdd.commits,
          },
        },
      });
    });

    it('adds new users to a files contributor list', () => {
      const raidData: RaidStats = {
        additions: 1,
        deletions: 1,
        changedFiles: 1,
        commits: 1,
        createdAt: Date.now(),
        dungeon: 'octocat/Hello-World',
        status: 'active',
        title: 'Hello the worlds!',
        files: {
          'README.md': {
            url: 'https://github.com/octocat/Hello-World/blob/master/README.md',
            filename: 'README.md',
            contributors: [123],
          },
        },
        contributors: {
          123: {
            user: 'octocat',
            userId: 123,
            avatarUrl: 'https://github.com/octocat.png',
            additions: 1,
            deletions: 1,
            commits: 1,
          },
        },
      };
      const compactedStatsToAdd = {
        321: {
          user: 'tacooct',
          userId: 321,
          avatarUrl: 'https://github.com/octocat.png',
          additions: 1,
          deletions: 1,
          commits: 1,
          changedFiles: [
            {
              url:
                'https://github.com/octocat/Hello-World/blob/master/README.md',
              filename: 'README.md',
            },
          ],
        },
      };

      const result = getUpdatesFromCompactedStats(
        raidData,
        compactedStatsToAdd
      );

      expect(result).toMatchObject({
        files: {
          'README.md': {
            url: 'https://github.com/octocat/Hello-World/blob/master/README.md',
            filename: 'README.md',
            contributors: [123, 321],
          },
        },
      });
    });
  });
});
