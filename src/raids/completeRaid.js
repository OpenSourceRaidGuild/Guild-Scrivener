import chalk from 'chalk';
import ora from 'ora';
import fetch from 'node-fetch';
import { db as firestore } from '../firebase.js';

/*
 * Steps:
 * - Check flag(s) to either ignore or proceed
 * - Check if Raid exists
 * - Update Raid to 'completed' status
 */
async function completeRaid({ id, payload }) {
  const spinner = ora(`Processing repository archived event '${id}'`).start();

  try {
    const { fork: isFork, full_name: repoNameWithOwner } = payload.repository;

    /*
     * Step 1 - Check flags
     */
    if (!isFork) {
      throw `Repository was not a fork`;
    }

    const {
      parent: { full_name: dungeonRepoNameWithOwner },
    } = await fetch(
      `https://api.github.com/repos/${repoNameWithOwner}`
    ).then((r) => r.json());

    /*
     * Step 2 - Check if Raid exists
     */
    const snapshot = await firestore
      .collection('raid-stats')
      .where('status', '==', 'active')
      .where('dungeon', '==', dungeonRepoNameWithOwner)
      .get();
    if (snapshot.empty) {
      throw `No active Raid exists for ${dungeonRepoNameWithOwner}`;
    } else if (snapshot.docs.length > 1) {
      // Unlikely to actually hit this, but just in case
      throw `Found more than one active Raid for ${dungeonRepoNameWithOwner} - did you forget to complete a Raid? Found: ${JSON.stringify(
        raids.map((r) => r.data().title)
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
