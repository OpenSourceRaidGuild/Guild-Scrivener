import { Octokit } from '@octokit/rest';
import chalk from 'chalk';
import ora from 'ora';
import dotenv from 'dotenv';
dotenv.config();

const owner = process.env.OWNER;
const octokit = new Octokit({
  auth: process.env.AUTH,
});
const spinner = ora(chalk.cyanBright('Retrieving Labels From GitHub \n'));
export async function labelWebhookhandler(event) {
  const listOfReposResponse = await octokit.repos.listForOrg({
    type: 'all',
    org: owner,
  });
  spinner.start();
  switch (event.payload.action) {
    case 'created': {
      spinner.succeed();
      return filteredResponse.forEach(async (repo) => {
        const {
          id,
          node_id,
          url,
          default: some,
          ...label
        } = event.payload.label;
        createLabelInRepos({
          label,
          repoName: repo.name,
        });
      });
    }
    case 'edited': {
      spinner.succeed();
      console.log(event.payload.label);
      return filteredResponse.forEach(async (repo) => {
        const {
          id,
          node_id,
          url,
          default: some,
          ...label
        } = event.payload.label;
        updateLabelsInRepos({
          label,
          repoName: repo.name,
        });
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
  console.log(repoName, 'IM THE REPO');
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
    chalk.yellowBright(`Attempting to update labels in ${repoName} \n`)
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
          chalk.greenBright(
            `${label.name} Label Updated Successfully ${repoName} \n`
          )
        );
    })
    .catch((err) => chalk.redBright(`${err} Label Update Failed`));
}
