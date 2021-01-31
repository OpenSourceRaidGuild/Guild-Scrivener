import chalk from 'chalk';
import ora from 'ora';
import fetch from 'node-fetch';
import { db as firestore } from '../firebase.js';

// TODO: Refactor to use octokit with OSRG-bot-user's PAT

/*
 * Steps:
 * - Check flags to either ignore or proceed
 * - Fetch and filter commit data
 * - Compact stats from filtered commit data
 * - Write stats to firestore
 */
async function statCompactor({ id, payload }) {
  const spinner = ora(`Processing push event '${id}'`).start();

  try {
    const { ref, repository, commits } = payload;
    const {
      fork: isFork,
      archived: isArchived,
      full_name: raidRepoNameWithOwner,
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
        throw `Event did not meet criteria for stat compacting: ${flag.message}`;
      }
    });

    // Get parent repo name with owner so we can check if the commit exists upstream
    const {
      parent: { full_name: dungeonRepoNameWithOwner },
    } = await fetch(
      `https://api.github.com/repos/${raidRepoNameWithOwner}`
    ).then((r) => r.json());

    /*
     * Step 2 - Fetch and filter commit data
     */
    const commitIds = commits.map((c) => c.id);
    const filteredCommitData = await fetchAndFilterCommitData(
      raidRepoNameWithOwner,
      dungeonRepoNameWithOwner,
      commitIds
    );

    /*
     * Step 3 - Compact stats
     */
    const compactedStatsToAdd = compactStatsFromCommitData(filteredCommitData);

    /*
     * Step 4 - Write stats to firestore
     */
    await updateRaidStats(compactedStatsToAdd, dungeonRepoNameWithOwner);

    spinner.succeed(
      chalk.greenBright(
        `Successfully updated Raid stats for ${dungeonRepoNameWithOwner}!`
      )
    );
  } catch (error) {
    spinner.fail(chalk.redBright(error.replace('$$event$$', `event (${id})`)));
  }
}
export default statCompactor;

/*
 * HELPERS
 */
async function fetchAndFilterCommitData(
  raidRepoNameWithOwner,
  dungeonRepoNameWithOwner,
  commitIds
) {
  const results = [];

  // TODO: Refactor to be parallel requests instead of sequential
  // Maybe Promise.settleAll or something can help?
  for (const commitId of commitIds) {
    const commitData = await fetch(
      `https://api.github.com/repos/${raidRepoNameWithOwner}/commits/${commitId}`
    ).then((r) => r.json());

    const isRaidCommit = !new RegExp(dungeonRepoNameWithOwner).test(
      await fetch(
        `https://github.com/${dungeonRepoNameWithOwner}/branch_commits/${commitId}`
      ).then(async (r) => r.text())
    );

    const {
      stats: { additions, deletions },
      parents,
      author: { login: user, id: userId, avatar_url: avatarUrl },
    } = commitData;

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

function compactStatsFromCommitData(commitData) {
  if (!commitData) return [];

  return commitData.reduce((stats, commit) => {
    if (
      !commit.user || // Exclude null users
      !commit.isRaidCommit || // Exclude non raid commits
      commit.parentCount > 1 // Exclude Merge commits
    ) {
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

async function updateRaidStats(compactedStatsToAdd, dungeonRepoNameWithOwner) {
  const raidsQuery = firestore
    .collection('raid-stats')
    .where('status', '==', 'active')
    .where('dungeon', '==', dungeonRepoNameWithOwner);

  /*
   * TODO: It is possible for the transaction to fail after it is retried X times. Probably a good idea to have some sort of
   * "unable to apply" queue with a part of the website that allows for a "Retry" of applying these failed stat updates.
   */
  // Use transactions to avoid incorrect data when multiple events occur near to each other
  await firestore.runTransaction((transaction) => {
    return transaction.get(raidsQuery).then((raidsSnapshot) => {
      if (raidsSnapshot.empty) {
        throw `No active Raid associated with this $$event$$ - did you forget to create a Raid, or close it out early? ${dungeonRepoNameWithOwner}`;
      }

      const raids = raidsSnapshot.docs;

      if (raids.length > 1) {
        // Unlikely to actually hit this, but just in case
        throw `Found more than one active Raid for ${dungeonRepoNameWithOwner} - did you forget to complete a Raid? Found: ${JSON.stringify(
          raids.map((r) => r.data().title)
        )}`;
      }

      const raidRef = raids[0].ref;
      const raidData = raids[0].data();
      const updates = {
        commits: raidData.commits,
        additions: raidData.additions,
        deletions: raidData.deletions,
      };

      // Update User stats
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
  });
}
