import chalk from 'chalk';
import got from 'got';
import { octokit } from '../octokit';
import { db as firestore } from '../firebase';
import { EmitterWebhookEvent } from '@octokit/webhooks';
import { RaidStats } from './types/raidStats';

/*
 * Steps:
 * - Check flags to either ignore or proceed
 * - Fetch and filter commit data
 * - Compact stats from filtered commit data
 * - Write stats to firestore
 */
async function statCompactor({ id, payload }: EmitterWebhookEvent<'push'>) {
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
export async function fetchAndFilterCommitData(
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

    const isRaidCommit = await checkIsRaidCommit(
      dungeonRepoNameWithOwner,
      commitId
    );

    const additions = commitData.stats?.additions ?? 0;
    const deletions = commitData.stats?.deletions ?? 0;
    const parentCount = commitData.parents.length;
    const user = commitData.author?.login;
    const userId = commitData.author?.id;
    const avatarUrl = commitData.author?.avatar_url;
    const changedFiles =
      commitData.files?.map<ChangedFile>((file) => ({
        filename: file.filename!,
        url: file.blob_url!,
      })) ?? [];

    results.push({
      user,
      userId,
      avatarUrl,
      additions,
      deletions,
      parentCount,
      isRaidCommit,
      changedFiles,
    });
  }

  return results;
}

export async function checkIsRaidCommit(
  dungeonRepoNameWithOwner: string,
  commitId: string
) {
  /*
   * TODO: Find a better way to do this with the API, as it is subject to breaking at some point in the future
   */
  return !new RegExp(`href="/${dungeonRepoNameWithOwner}"`).test(
    await got(
      `https://github.com/${dungeonRepoNameWithOwner}/branch_commits/${commitId}`
    ).text()
  );
}

function isCompactableCommit(
  commit: FetchedCommitData
): commit is CompactableCommitData {
  /*
   * A commit is compactable if:
   * - The user is not undefined
   * - The commit is a raid commit
   * - The commit has only one parent
   */
  return !!commit.user && commit.isRaidCommit && !(commit.parentCount > 1);
}

export function compactStatsFromCommitData(commitData: FetchedCommitData[]) {
  return commitData.reduce<CompactedStats>((stats, commit) => {
    if (!isCompactableCommit(commit)) {
      return stats;
    }

    if (commit.userId in stats) {
      stats[commit.userId].additions += commit.additions;
      stats[commit.userId].deletions += commit.deletions;
      stats[commit.userId].commits += 1;
      stats[commit.userId].changedFiles = stats[
        commit.userId
      ].changedFiles.concat(commit.changedFiles);
    } else {
      stats[commit.userId] = {
        userId: commit.userId,
        user: commit.user,
        avatarUrl: commit.avatarUrl,
        additions: commit.additions,
        deletions: commit.deletions,
        commits: 1,
        changedFiles: commit.changedFiles,
      };
    }

    return stats;
  }, {});
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

        const updates = getUpdatesFromCompactedStats(
          raids[0].data() as RaidStats,
          compactedStatsToAdd
        );

        transaction.update(raidRef, updates);
      });
    })
    .catch(
      /* istanbul ignore next */ (error) => {
        throw error;
      }
    );
}

export function getUpdatesFromCompactedStats(
  raidData: RaidStats,
  compactedStatsToAdd: CompactedStats
): DocUpdates {
  const updates: DocUpdates = {
    commits: raidData.commits,
    additions: raidData.additions,
    deletions: raidData.deletions,
    changedFiles: raidData.changedFiles,
    files: JSON.parse(JSON.stringify(raidData.files)), // There has to be a better way to deep clone
    contributors: JSON.parse(JSON.stringify(raidData.contributors)), // There has to be a better way to deep clone
  };

  Object.values(compactedStatsToAdd).forEach((compactedStats) => {
    const { changedFiles, ...newStats } = compactedStats;
    const userId = newStats.userId;

    // User Stats
    if (userId in updates.contributors) {
      const {
        additions: newAdditions,
        deletions: newDeletions,
        commits: newCommits,
      } = newStats;

      updates.contributors[userId].additions += newAdditions;
      updates.contributors[userId].deletions += newDeletions;
      updates.contributors[userId].commits += newCommits;
    } else {
      updates.contributors[userId] = newStats;
    }

    // Update changed files
    let numberOfUniqueNewFiles = 0;
    changedFiles.forEach((changedFile) => {
      const { filename, url } = changedFile;
      if (!(filename in updates.files)) {
        // Add the file to the list of files if it hasn't already been added
        updates.files[filename] = {
          filename,
          url,
          contributors: [userId],
        };
        numberOfUniqueNewFiles++;
      } /* istanbul ignore else */ else if (
        filename in updates.files &&
        !updates.files[filename].contributors.includes(userId)
      ) {
        // Add userId to a file's contributors list if they haven't already been added
        updates.files[filename].contributors.push(userId);
      }
      // If the file already exists, and the userId has already been added, then there isn't anything that needs to be done
    });

    // Update Raid Stats
    updates.commits += newStats.commits;
    updates.additions += newStats.additions;
    updates.deletions += newStats.deletions;
    updates.changedFiles += numberOfUniqueNewFiles;
  });

  return updates;
}

/*
 * TYPES
 */
type ChangedFile = {
  url: string;
  filename: string;
};

type FetchedCommitData = {
  user?: string;
  userId?: number;
  avatarUrl?: string;
  additions: number;
  deletions: number;
  parentCount: number;
  isRaidCommit: boolean;
  changedFiles: ChangedFile[];
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
  changedFiles: ChangedFile[];
};

type CompactedStats = {
  [key: number]: UserStats;
};

type DocUpdates = {
  [filePath: string]: any;
};
