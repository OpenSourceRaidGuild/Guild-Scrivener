import { octokit } from '../octokit';
import chalk from 'chalk';
import { WebhookEvent } from '@octokit/webhooks';
import dotenv from 'dotenv';
import { TPayload, TLabelReqObject, IOctoLabelParams } from './types';
dotenv.config();
const LOG = console.log;

export async function labelWebhookhandler(event: WebhookEvent<TPayload>) {
  const rateLimitCheck = await octokit.request('GET /rate_limit');
  LOG(chalk`
  Rate: {yellow ${JSON.stringify(rateLimitCheck.data.rate, null, 2)}}
  `);

  const listOfReposResponse = await octokit.repos.listForOrg({
    type: 'all',
    org: event.payload.organization.login,
  });
  const filteredRepos = listOfReposResponse.data.filter(
    (repo) => repo.name !== 'website' && repo.archived !== true
  );

  switch (event.payload.action) {
    case 'created': {
      return filteredRepos.forEach(async (repo) => {
        const label: TLabelReqObject = {
          name: event.payload.label.name,
          color: event.payload.label.color,
          description: event.payload.label.description,
        };

        return await createLabelInRepos({
          label,
          repo: repo.name,
          owner: event.payload.organization.login,
        });
      });
    }
    case 'edited': {
      return filteredRepos.forEach(async (repo) => {
        const label: TLabelReqObject = {
          name: event.payload.label.name,
          color: event.payload.label.color,
          description: event.payload.label.description,
        };
        return await updateLabelsInRepos({
          label,
          repo: repo.name,
          owner: event.payload.organization.login,
        });
      });
    }
    case 'deleted':
      break;

    default:
      LOG(chalk.redBright('Label Fetching/Writing Failed!!! \n'));
  }
}

async function createLabelInRepos({ label, repo, owner }: IOctoLabelParams) {
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

async function updateLabelsInRepos({ label, repo, owner }: IOctoLabelParams) {
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
