import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';
import chalk from 'chalk';
import ora from 'ora';
import { db } from './firebase.js';

dotenv.config();
const owner = process.env.OWNER;

const octokit = new Octokit({
  auth: process.env.AUTH,
});

const listOfReposResponse = await octokit.repos.listForOrg({
  type: 'all',
  org: OWNER,
});

// TODO FIX certain messages are repeated due to happening in forEach
listOfReposResponse.data.forEach(async (repo) => {
  db.collection('labels').onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((documentChange) => {
      if (!documentChange.doc.exists) continue;
      const docData = document.data();

      if (documentChange.type === 'added') {
        createLabelInRepos({ label: { ...docData }, repoName: repo.name });
      }

      if (documentChange.type === 'modified') {
        updateLabelsInRepos({ label: { ...docData }, repoName: repo.name });
      }
    });
  });
});

async function createLabelInRepos({ label = {}, repoName = '' }) {
  const spinner = ora(
    chalk.yellowBright('NO ID FOUND ATTEMPING TO CREATE LABEL')
  ).start();
  setTimeout(() => {
    spinner.color = chalk.hex(`#${Number(Math.random()).toString(16)}`);
  }, 3000);
  return await octokit.issues
    .createLabel({
      owner,
      repo: repoName,
      ...label,
    })
    .then((res) => {
      if (res.status === 201) {
        spinner.succeed(chalk.greenBright(`${res.status} Status`));
        spinner.succeed(
          chalk.greenBright(`${name} Label Created Successfully!!`)
        );
      }
    })
    .catch(() => {
      spinner.fail(`Label Creation ${chalk.red('FAILED!')}`);
    });
}

async function updateLabelsInRepos({ label = {}, repoName = '' }) {
  const spinner = ora(
    chalk.yellowBright('NO ID FOUND ATTEMPING TO CREATE LABEL')
  ).start();
  spinner.color = chalk.redBright();
  return await octokit.issues
    .updateLabel({
      owner,
      repo: repoName,
      ...label,
    })
    .then((res) => {
      if (res.status === 200)
        spinner.succeed(
          chalk.greenBright(`${docName.name} Label Updated Successfully`)
        );
    });
}
