import chalk from 'chalk';
import got from 'got';
import { octokit } from '../octokit';
import { db as firestore } from '../firebase';
import { EventPayloads, WebhookEvent } from '@octokit/webhooks';

/*
 * Steps:
 * - Check flags to either ignore or proceed
 * - Fetch and filter commit data
 * - Compact stats from filtered commit data
 * - Write stats to firestore
 */
async function statCompactor({
  id,
  payload,
}: WebhookEvent<EventPayloads.WebhookPayloadPush>) {
  console.log(chalk.cyanBright(`- Processing push event '${id}'`));

  try {
    const { ref, repository, commits } = payload;
    const {
      fork: isFork,
      archived: isArchived,
      owner: { login: raidRepoOwner },
      name: raidRepoName,
    } = repository;
    const isDefaultBranch =
      ref.replace(/^refs\/heads\//, '') === repository.default_branch;

    /*
     * Step 1 - Check flags
     */
    const checkFlags = [
      {
        // If the commits are not on a fork, then it isn't a raid repo
        check: isFork === true,
        message: 'Repository was not a fork',
      },
      {
        // If the commits aren't on the default branch, they don't count towards the raid yet
        check: isDefaultBranch === true,
        message: 'Was not a push event for the default branch',
      },
      {
        // If the commits are on an archived repository, then it is no longer an active raid
        check: isArchived === false,
        message: 'Repository is archived',
      },
    ];

    checkFlags.forEach((flag) => {
      // Throw if check was not successful
      if (!flag.check) {
        throw `Event '${id}' did not meet criteria for stat compacting: ${flag.message}`;
      }
    });

    // Get parent repo name with owner so we can check if the commit exists upstream
    const parentRepository = await octokit.repos
      .get({
        owner: raidRepoOwner,
        repo: raidRepoName,
      })
      .then((r) => r.data.parent);
    const dungeonRepoNameWithOwner = parentRepository
      ? parentRepository.full_name
      : /* istanbul ignore next */ '';

    /*
     * Step 2 - Fetch and filter commit data
     */
    const commitIds: string[] = commits.map((c) => c.id);
    const filteredCommitData = await fetchAndFilterCommitData(
      raidRepoOwner,
      raidRepoName,
      dungeonRepoNameWithOwner,
      commitIds
    );

    /*
     * Step 3 - Compact stats
     */
    const compactedStatsToAdd = compactStatsFromCommitData(filteredCommitData);

    if (Object.keys(compactedStatsToAdd).length === 0) {
      throw `Event '${id}' had no commits that affect stats`;
    }

    /*
     * Step 4 - Write stats to firestore
     */
    await updateRaidStats(compactedStatsToAdd, dungeonRepoNameWithOwner);

    console.log(
      chalk.greenBright(
        `✔ Successfully updated ${dungeonRepoNameWithOwner} Raid stats on event '${id}'!`
      )
    );
  } catch (error: unknown) {
    console.log(
      chalk.redBright(
        String('✖ ' + error).replace('$$event$$', `event '${id}'`)
      )
    );
  }
}
export default statCompactor;

/*
 * HELPERS
 */
async function fetchAndFilterCommitData(
  raidRepoOwner: string,
  raidRepoName: string,
  dungeonRepoNameWithOwner: string,
  commitIds: string[]
): Promise<FetchedCommitData[]> {
  const results: FetchedCommitData[] = [];

  for (const commitId of commitIds) {
    const commitData = await octokit.repos
      .getCommit({
        owner: raidRepoOwner,
        repo: raidRepoName,
        ref: commitId,
      })
      .then((r) => r.data);

    /*
     * TODO: Find a better way to do this with the API, as it is subject to breaking at some point in the future
     */
    const isRaidCommit = !new RegExp(dungeonRepoNameWithOwner).test(
      await got(
        `https://github.com/${dungeonRepoNameWithOwner}/branch_commits/${commitId}`
      ).text()
    );

    const additions = commitData.stats?.additions ?? 0;
    const deletions = commitData.stats?.deletions ?? 0;
    const parents = commitData.parents;
    const user = commitData.author?.login;
    const userId = commitData.author?.id;
    const avatarUrl = commitData.author?.avatar_url;

    results.push({
      user,
      userId,
      avatarUrl,
      additions,
      deletions,
      parentCount: parents.length,
      isRaidCommit,
    });
  }

  return results;
}

function compactStatsFromCommitData(commitData: FetchedCommitData[]) {
  if (!commitData) return [];

  return commitData.reduce<CompactedStats>((stats, commit) => {
    if (!isCompactableCommit(commit)) {
      return stats;
    }

    if (commit.userId in stats) {
      stats[commit.userId].additions += commit.additions;
      stats[commit.userId].deletions += commit.deletions;
      stats[commit.userId].commits += 1;
    } else {
      stats[commit.userId] = {
        userId: commit.userId,
        user: commit.user,
        avatarUrl: commit.avatarUrl,
        additions: commit.additions,
        deletions: commit.deletions,
        commits: 1,
      };
    }

    return stats;
  }, {});
}

function isCompactableCommit(
  commit: FetchedCommitData
): commit is CompactableCommitData {
  // Exclude null/undefined users
  // Exclude non raid commits
  // Exclude Merge commits
  return !!commit.user || !!commit.isRaidCommit || !(commit.parentCount > 1);
}

async function updateRaidStats(
  compactedStatsToAdd: CompactedStats,
  dungeonRepoNameWithOwner: string
) {
  const raidsQuery = firestore
    .collection('raid-stats')
    .where('status', '==', 'active')
    .where('dungeon', '==', dungeonRepoNameWithOwner);

  /*
   * TODO: It is possible for the transaction to fail after it is retried X times. Probably a good idea to have some sort of
   * "unable to apply" queue with a part of the website that allows for a "Retry" of applying these failed stat updates.
   */
  // Use transactions to avoid incorrect data when multiple events occur near to each other
  await firestore
    .runTransaction((transaction) => {
      return transaction.get(raidsQuery).then((raidsSnapshot) => {
        if (raidsSnapshot.empty) {
          throw `No active Raid for ${dungeonRepoNameWithOwner} associated with $$event$$`;
        }

        const raids = raidsSnapshot.docs;

        if (raids.length > 1) {
          // Unlikely to actually hit this, but just in case
          throw `Found more than one active Raid for ${dungeonRepoNameWithOwner} associated with $$event$$: ${JSON.stringify(
            raids.map((r) => r.data().title)
          )}`;
        }

        const raidRef = raids[0].ref;
        const raidData = raids[0].data();
        const updates: DocUpdates = {
          commits: raidData.commits,
          additions: raidData.additions,
          deletions: raidData.deletions,
        };

        Object.values(compactedStatsToAdd).forEach((newStats) => {
          // User Stats
          const key = `contributors.${newStats.userId}`;
          const oldStats = raidData.contributors[newStats.userId];
          if (oldStats) {
            const {
              additions: oldAdditions,
              deletions: oldDeletions,
              commits: oldCommits,
            } = oldStats;
            const {
              additions: newAdditions,
              deletions: newDeletions,
              commits: newCommits,
            } = newStats;

            updates[`${key}.additions`] = oldAdditions + newAdditions;
            updates[`${key}.deletions`] = oldDeletions + newDeletions;
            updates[`${key}.commits`] = oldCommits + newCommits;
          } else {
            updates[key] = newStats;
          }

          // Update Raid Stats
          updates.commits += newStats.commits;
          updates.additions += newStats.additions;
          updates.deletions += newStats.deletions;
        });

        transaction.update(raidRef, updates);
      });
    })
    .catch(
      /* istanbul ignore next */ (error) => {
        throw error;
      }
    );
}

/*
 * TYPES
 */
type FetchedCommitData = {
  user?: string;
  userId?: number;
  avatarUrl?: string;
  additions: number;
  deletions: number;
  parentCount: number;
  isRaidCommit: boolean;
};

type CompactableCommitData = FetchedCommitData & {
  user: string;
  userId: number;
  avatarUrl: string;
};

type UserStats = {
  userId: number;
  user: string;
  avatarUrl: string;
  additions: number;
  deletions: number;
  commits: number;
};

type CompactedStats = {
  [key: number]: UserStats;
};

type DocUpdates = {
  [filePath: string]: any;
};
