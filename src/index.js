// #!/usr/bin/env node
import got from 'got';
import chalk from 'chalk';
import ora from 'ora';
import { db } from './firebase.js';

const spinner = ora(chalk.cyanBright('Retrieving Labels From GitHub')).start();
spinner.color = chalk.greenBright();
//! Website will be source of label truth for all Org repos
export async function dumpGitHubLabelIntoDB() {
  let response = [];
  try {
    response = await got(
      'https://api.github.com/repos/OpenSourceRaidGuild/website/labels'
    ).json();
  } finally {
    return response;
  }
}

try {
  await dumpGitHubLabelIntoDB().forEach(
    async (label) =>
      await db
        .collection('labels')
        .doc(label.name)
        .set(
          { ...label, timestamp: FieldValue.serverTimestamp() },
          { merge: true }
        )
        .then(() => console.log('Label in DB'))
  );
} catch (err) {
  spinner.fail(chalk.redBright('Label Fetching/Writing Failed!!!'));
  console.error('ERROR', err);
}

spinner.succeed(chalk.green('Labels Written to Database'));
