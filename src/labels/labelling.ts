import { octokit } from '../octokit.js';
import chalk from 'chalk';
import ora from 'ora';
import { EventPayloads, WebhookEvent } from '@octokit/webhooks';
import dotenv from 'dotenv';
dotenv.config();

const OWNER = process.env.OWNER as string;
const LOG = console.log;

type TPayload = {
  action: string;
  label: ILabel;
};

interface ILabelObject {
  name: string;
  color?: string;
  description?: string;
}
interface ILabel extends ILabelObject {
  id: number;
  node_id: string;
  url: string;
  default: boolean;
}

export async function labelWebhookhandler(event: WebhookEvent<TPayload>) {
  const rateLimitCheck = await octokit.request('GET /rate_limit');
  LOG(chalk`
  Rate: {yellow ${JSON.stringify(rateLimitCheck.data.rate, null, 2)}}
  `);
  const listOfReposResponse = await octokit.repos.listForOrg({
    type: 'all',
    org: OWNER,
  });
  const filteredRepos = listOfReposResponse.data.filter(
    (repo) => repo.name !== 'website' && repo.archived !== true
  );

  switch (event.payload.action) {
    case 'created': {
      return filteredRepos.forEach(async (repo) => {
        const label: ILabelObject = {
          name: event.payload.label.name,
          color: event.payload.label.color,
          description: event.payload.label.description,
        };

        await createLabelInRepos({
          label,
          repoName: repo.name,
        });
      });
    }
    case 'edited': {
      return filteredRepos.forEach(async (repo) => {
        const label: ILabelObject = {
          name: event.payload.label.name,
          color: event.payload.label.color,
          description: event.payload.label.description,
        };
        await updateLabelsInRepos({
          label,
          repoName: repo.name,
        });
      });
    }
    case 'deleted':
      break;

    default:
      LOG(chalk.redBright('Label Fetching/Writing Failed!!! \n'));
  }
}

/**
 * @Helpers
 */
interface IOctoLabelParams {
  label: ILabelObject;
  repoName: string;
}
async function createLabelInRepos({ label, repoName }: IOctoLabelParams) {
  return await octokit.issues
    .createLabel({
      owner: OWNER,
      repo: repoName,
      ...label,
    } as any)
    .then((res) => {
      if (res.status === 201) {
        LOG(chalk.greenBright(`${res.status} Status \n`));
        LOG(chalk.greenBright(`${label.name} Label Created Successfully!!\n`));
      }
    })
    .catch((err) =>
      LOG(
        `${chalk.red(
          `${label.name} in ${repoName} Label Creation FAILED! \n
          ${err}
        `
        )}`
      )
    );
}

async function updateLabelsInRepos({ label, repoName }: IOctoLabelParams) {
  const memory = { label, repoName };
  const spinner = ora(
    chalk.yellowBright(`Attempting to update labels in ${repoName} \n`)
  ).start();
  return await octokit.issues
    .updateLabel({
      OWNER,
      repo: repoName,
      ...label,
    } as any)
    .then((res) => {
      if (res.status === 200)
        spinner.succeed(
          chalk.greenBright(
            `${label.name} Label Updated Successfully ${repoName} \n`
          )
        );
    })
    .catch((err: any): Promise<void> | void => {
      LOG('ERROR', err.status);
      if (err.status === 404) return createLabelInRepos(memory);
      if (err.status === 403) chalk.redBright(`${err} Label Update Failed`);
    });
}
