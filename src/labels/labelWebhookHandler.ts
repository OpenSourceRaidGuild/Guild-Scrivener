import { octokit } from '../octokit';
import chalk from 'chalk';
import { EmitterWebhookEvent } from '@octokit/webhooks';
import dotenv from 'dotenv';
import { TLabelReqObject } from './types';
import { createLabelInRepos, updateLabelsInRepos } from './repoEventHelpers';

dotenv.config();

export async function labelWebhookHandler(event: EmitterWebhookEvent<'label'>) {
  const rateLimitCheck = await octokit.request('GET /rate_limit');
  console.log(chalk`
  Rate: {yellow ${JSON.stringify(rateLimitCheck.data.rate, null, 2)}}
  `);

  const listOfRepos = await octokit.repos.listForOrg({
    type: 'all',
    org: event.payload.organization!.login,
  });
  const filteredRepos = listOfRepos.data.filter(
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
          owner: event.payload.organization!.login,
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
          owner: event.payload.organization!.login,
        });
      });
    }
    case 'deleted':
      break;

    default:
      console.log(chalk.redBright('Label Fetching/Writing Failed!!! \n'));
  }
}
