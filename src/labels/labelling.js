import { Octokit } from '@octokit/rest';
import chalk from 'chalk';
import ora from 'ora';
import dotenv from 'dotenv';
dotenv.config();

const owner = process.env.OWNER;
const octokit = new Octokit({
  auth: process.env.AUTH,
});
const listOfReposResponse = await octokit.repos.listForOrg({
  type: 'all',
  org: owner,
});
const spinner = ora(chalk.cyanBright('Retrieving Labels From GitHub \n'));
export async function labelWebhookhandler(event) {
  spinner.start();
  switch (event.payload.action) {
    case 'created': {
      return listOfReposResponse.data.forEach(async (repo) => {
        createLabelInRepos({ label: { ...docData }, repoName: repo.name });
      });
    }
    case 'edited': {
      return listOfReposResponse.data.forEach(async (repo) => {
        updateLabelsInRepos({ label: { ...docData }, repoName: repo.name });
      });
    }
    case 'deleted':
      break;

    default:
      spinner.fail(chalk.redBright('Label Fetching/Writing Failed!!! \n'));
  }
}

/**
 * @Helper
 */
async function createLabelInRepos({ label = {}, repoName = '' }) {
  const spinner = ora(
    chalk.yellowBright('NO ID FOUND ATTEMPING TO CREATE LABEL \n')
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
        spinner.succeed(chalk.greenBright(`${res.status} Status \n`));
        spinner.succeed(
          chalk.greenBright(`${name} Label Created Successfully!!\n`)
        );
      }
    })
    .catch(() => {
      spinner.fail(`Label Creation ${chalk.red('FAILED!')} \n`);
    });
}
/**
 * @Helper
 */
async function updateLabelsInRepos({ label = {}, repoName = '' }) {
  const spinner = ora(
    chalk.yellowBright('NO ID FOUND ATTEMPING TO CREATE LABEL \n')
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
          chalk.greenBright(`${docName.name} Label Updated Successfully \n`)
        );
    });
}
