import chalk from 'chalk';
import ora from 'ora';
import got from 'got';
import { db as firestore } from '../firebase.js';
import { EventPayloads, WebhookEvent } from '@octokit/webhooks';

/*
 * Steps:
 * - Check flag(s) to either ignore or proceed
 * - Check if Raid already exists
 * - Create new Raid in firestore
 */
async function createNewRaid({
  id,
  payload,
}: WebhookEvent<EventPayloads.WebhookPayloadRepository>) {
  const spinner = ora(`Processing repository created event '${id}'`).start();

  try {
    const { fork: isFork, full_name: repoNameWithOwner } = payload.repository;

    /*
     * Step 1 - Check flags
     */
    if (!isFork) {
      throw `Repository did not meet criteria for Raid creation`;
    }

    const {
      parent: { full_name: dungeonRepoNameWithOwner },
    } = await got(`https://api.github.com/repos/${repoNameWithOwner}`).json();

    /*
     * Step 2 - Check if Raid already exists
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
     * Step 3 - Create new Raid
     */
    await firestore
      .collection('raid-stats')
      .add({
        additions: 0,
        changedFiles: 0,
        commits: 0,
        contributors: {},
        deletions: 0,
        dungeon: dungeonRepoNameWithOwner,
        status: 'active',
        title: '[PLEASE RENAME ME]',
      })
      .catch((error) => {
        throw error;
      });

    spinner.succeed(
      chalk.greenBright(`Created new Raid for ${dungeonRepoNameWithOwner}`)
    );
  } catch (error) {
    spinner.fail(chalk.redBright(error));
  }
}
export default createNewRaid;