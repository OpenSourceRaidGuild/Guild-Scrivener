import chalk from 'chalk';
import dotenv from 'dotenv';
import { octokit } from '../utils/octokit';
import { db as firestore } from '../utils/firebase';
import { EmitterWebhookEvent } from '@octokit/webhooks';
import { RaidStats } from './types/raidStats';

dotenv.config();

/*
 * Steps:
 * - Check flag(s) to either ignore or proceed
 * - Check if Raid already exists
 * - Send Discord notification
 * - Create new Raid in firestore
 */
async function createNewRaid({
  id,
  payload,
}: EmitterWebhookEvent<'repository.created'>) {
  console.log(
    chalk.cyanBright(`- Processing repository created event '${id}'`)
  );

  try {
    const {
      fork: isFork,
      owner: { login: raidRepoOwner },
      name: raidRepoName,
    } = payload.repository;

    /*
     * Step - Check flags
     */
    if (!isFork) {
      throw `Event '${id}' did not meet criteria for Raid creation: Repository was not a fork`;
    }

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
     * Step - Check if Raid already exists
     */
    const snapshot = await firestore
      .collection('raid-stats')
      .where('status', '==', 'active')
      .where('dungeon', '==', dungeonRepoNameWithOwner)
      .get();
    if (!snapshot.empty) {
      throw `An active Raid already exists for ${dungeonRepoNameWithOwner}`;
    }

    /*
     * Step - Create new Raid
     */
    await (firestore.collection(
      'raid-stats'
    ) as FirebaseFirestore.CollectionReference<RaidStats>)
      .add({
        additions: 0,
        changedFiles: 0,
        files: {},
        commits: 0,
        contributors: {},
        deletions: 0,
        dungeon: dungeonRepoNameWithOwner,
        status: 'active',
        title: '[PLEASE RENAME ME]',
        createdAt: Date.now(),
      })
      .catch(
        // Ignore, because this is impossible to test... And it works.
        // If you change it, it's on you to test it (somehow)
        /* istanbul ignore next */ (error) => {
          throw error;
        }
      );

    console.log(
      chalk.greenBright(`✔ Created new Raid for ${dungeonRepoNameWithOwner}`)
    );
  } catch (error) {
    console.log(chalk.redBright('✖ ' + error));
  }
}
export default createNewRaid;
