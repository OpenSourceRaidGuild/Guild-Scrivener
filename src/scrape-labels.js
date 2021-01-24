// #!/usr/bin/env node
import fsp from 'fs/promises';
import got from 'got';
import chalk from 'chalk';
import ora from 'ora';
import { db } from './firebase.ts';
import database from '../database.json';

const spinner = ora(chalk.cyanBright('Retrieving Labels From GitHub')).start();
spinner.color = chalk.greenBright();
export async function dumpGitHubLabelIntoDB() {
  return await got(
    'https://api.github.com/repos/OpenSourceRaidGuild/website/labels'
  ).json();
}

try {
  JSON.stringify(await dumpGitHubLabelIntoDB(), null, 2).forEach(
    async (label) =>
      await db
        .collection('labels')
        .doc(label.name)
        .set(label, { merge: true })
        .then(() => console.log('Label in DB'))
  );
} catch (err) {
  spinner.fail(chalk.redBright('Label Fetching/Writing Failed!!!'));
  console.error('ERROR', err);
}

spinner.succeed(chalk.green('Labels Written to Database'));
