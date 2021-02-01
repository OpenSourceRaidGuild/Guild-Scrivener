import { octokit } from '../octokit.js';
import chalk from 'chalk';
import ora from 'ora';

const owner = process.env.OWNER;

const spinner = ora(chalk.cyanBright('Retrieving Labels From GitHub \n'));
export async function labelWebhookhandler(event) {
  const listOfReposResponse = await octokit.repos.listForOrg({
    type: 'all',
    org: owner,
  });
  const filteredResponse = listOfReposResponse.data.filter(
    (repo) => repo.name !== 'website'
  );

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
      console.log(event);
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
      // console.log('UPDATE RESPONSE', res);
      if (res.status === 200)
        spinner.succeed(
          chalk.greenBright(
            `${label.name} Label Updated Successfully ${repoName} \n`
          )
        );
    })
    .catch((err) => {
      console.log('ERROR', err.status);
      //TODO this doesnt work yet, not passing back the data for create attempt
      if (err.status === 404) return createLabelInRepos();
      if (err.status === 403)
        return chalk.redBright(`${err} Label Update Failed`);
    });
}
