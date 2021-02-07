import chalk from 'chalk';
import { octokit } from '../octokit.js';
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
      throw `Event '${id}' did not meet criteria for Raid creation: Repository was not a fork`;
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
  } catch (error) {
    return error;
  }
}
export default createNewRaid;
