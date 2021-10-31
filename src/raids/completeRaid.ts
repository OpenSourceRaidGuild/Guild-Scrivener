import dotenv from 'dotenv';
import { octokit } from '../utils/octokit';
import { EmitterWebhookEvent } from '@octokit/webhooks';
import { RaidStats } from './types/raidStats';
import {
  deleteWebhookMessage,
  sendWebhookMessage,
} from '../utils/discord/webhooks';

dotenv.config();

/*
 * Steps:
 * - Check flag(s) to either ignore or proceed
 * - Check if Raid exists
 * - Remove "current raid" discord message, send "raid complete" message
 * - Update Raid to 'completed' status
 */
async function completeRaid({
  id,
  payload,
}: EmitterWebhookEvent<'repository.archived'>) {
  console.log(
    chalk.cyanBright(`- Processing repository archived event '${id}'`)
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
     * Step - Check if Raid exists
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
    const raidRef = snapshot.docs[0].ref;

    /*
     * Step - Discord Messages
     */
    const raidStats = (await raidRef.get()).data() as RaidStats;
    const discordMessageId = raidStats.discordMessageId;
    const raidDuration = Math.ceil(
      Math.abs(raidStats.createdAt - Date.now()) / 86400000
    );

    // Remove current raid message
    if (discordMessageId) {
      await deleteWebhookMessage(
        process.env.CURRENT_RAID_DISCORD_WEBHOOK_URL!,
        discordMessageId
      );
    }

    // Send completed raid message
    const { id: newDiscordMessageId } = await sendWebhookMessage(
      process.env.COMPLETED_RAID_DISCORD_WEBHOOK_URL!,
      {
        // TODO: replace with a templating system
        content: `Raid Complete!

**${raidStats.title} - *${raidStats.dungeon}***
:crossed_swords:  ${Object.values(raidStats.contributors).length} Contributors
:card_box:  ${raidStats.changedFiles} Files Changed
:computer:  ${raidStats.commits} Commits
:calendar:  ${raidDuration} Day(s)`,
      }
    );

    /*
     * Step - Complete Raid
     */
    await raidRef.update({
      status: 'completed',
      duration: raidDuration,
      discordMessageId: newDiscordMessageId,
    });

    console.log(
      chalk.greenBright(`✔ Completed Raid ${dungeonRepoNameWithOwner}`)
    );
  } catch (error) {
    console.log(chalk.redBright('✖ ' + error));
  }
}
export default completeRaid;
