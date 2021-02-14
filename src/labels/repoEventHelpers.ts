import { octokit } from '../octokit';
import chalk from 'chalk';
import { IOctoLabelParams } from './types';
const LOG = console.log;

export async function createLabelInRepos({
  label,
  repo,
  owner,
}: IOctoLabelParams) {
  return await octokit.issues
    .createLabel({
      owner,
      repo,
      name: label.name,
      color: label.color,
      description: label.description,
    })
    .then((res) => {
      if (res.status === 201) {
        LOG(chalk.greenBright(`${res.status} Status \n`));
        LOG(chalk.greenBright(`${label.name} Label Created Successfully!!\n`));
      }
    })
    .catch((err) =>
      LOG(
        `${chalk.red(
          `${label.name} in ${repo} Label Creation FAILED! \n
              ${err}
            `
        )}`
      )
    );
}

export async function updateLabelsInRepos({
  label,
  repo,
  owner,
}: IOctoLabelParams) {
  const memory = { label, repo, owner };
  return await octokit.issues
    .updateLabel({
      owner,
      repo,
      name: label.name,
      new_name: label.new_name,
      color: label.color,
      description: label.description,
    })
    .then((res) => {
      if (res.status === 200)
        LOG(
          chalk.greenBright(
            `${label.name} Label Updated Successfully ${repo} \n`
          )
        );
    })
    .catch((err: any): Promise<void> | void => {
      LOG('ERROR', err.status);
      if (err.status === 404) return createLabelInRepos(memory);
      if (err.status === 403)
        LOG(chalk.redBright(`${err} Label Update Failed`));
    });
}
