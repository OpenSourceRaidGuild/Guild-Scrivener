import chalk from 'chalk';
import ora from 'ora';
import { octokit } from '../octokit.js';
import { db as firestore } from '../firebase.js';
import { EventPayloads, WebhookEvent } from '@octokit/webhooks';

/*
 * Steps:
 * - Check flag(s) to either ignore or proceed
 * - Check if Raid exists
 * - Update Raid to 'completed' status
 */
async function completeRaid({
  id,
  payload,
}: WebhookEvent<EventPayloads.WebhookPayloadRepository>) {
  const spinner = ora(`Processing repository archived event '${id}'`).start();

  try {
    const {
      fork: isFork,
      owner: { login: raidRepoOwner },
      name: raidRepoName,
    } = payload.repository;

    /*
     * Step 1 - Check flags
     */
    if (!isFork) {
      throw `Event '${id}' did not meet criteria for Raid creation:  Repository was not a fork`;
    }

    // Get parent repo name with owner so we can check if the commit exists upstream
    const parentRepository = await octokit.repos
      .get({
        owner: raidRepoOwner,
        repo: raidRepoName,
      })
      .then((r) => r.data.parent);
    const dungeonRepoNameWithOwner = String(parentRepository?.full_name);

    /*
     * Step 2 - Check if Raid exists
     */
    const snapshot = await firestore
      .collection('raid-stats')
      .where('status', '==', 'active')
      .where('dungeon', '==', dungeonRepoNameWithOwner)
      .get();
    if (snapshot.empty) {
      throw `No active Raid exists for ${dungeonRepoNameWithOwner} associated with event '${id}'`;
    } else if (snapshot.docs.length > 1) {
      // Unlikely to actually hit this, but just in case
      throw `Found more than one active Raid for ${dungeonRepoNameWithOwner} associated with event '${id}':  ${JSON.stringify(
        snapshot.docs.map((r) => r.data().title)
      )}`;
    }

    /*
     * Step 3 - Complete Raid
     */
    const raidRef = snapshot.docs[0].ref;
    await raidRef.update({
      status: 'completed',
    });

    spinner.succeed(
      chalk.greenBright(`Completed Raid ${dungeonRepoNameWithOwner}`)
    );
  } catch (error) {
    spinner.fail(chalk.redBright(error));
  }
}
export default completeRaid;
