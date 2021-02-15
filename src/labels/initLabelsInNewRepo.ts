import { octokit } from '../octokit';
import chalk from 'chalk';
import { createLabelInRepos } from './repoEventHelpers';
import dotenv from 'dotenv';
import { EmitterWebhookEvent } from '@octokit/webhooks';
dotenv.config();

// TODO delete partial dupes that are older or shorter

export async function initLabelsInNewRepoHandler(
  event: EmitterWebhookEvent<'repository.created'>
) {
  const listOfLabels = await octokit.issues.listLabelsForRepo({
    owner: 'OpenSourceRaidGuild',
    repo: 'website',
  });

  const listOfRepos = await octokit.repos.listForOrg({
    type: 'all',
    org: 'OpenSourceRaidGuild',
  });

  const filteredRepos = listOfRepos.data.filter(
    (repo) => repo.name !== 'website'
  );

  filteredRepos.forEach(async (repo) => {
    listOfLabels.data.forEach(async (label) => {
      const buildLabel = {
        name: label.name,
        color: label.color,
        description: label?.description as string,
      };
      return await createLabelInRepos({
        label: buildLabel,
        repo: repo.name,
        owner: 'OpenSourceRaidGuild',
      })
        .then(() =>
          console.log(
            chalk.greenBright(
              `Label ${label.name} created in ${repo.name} Successfully`
            )
          )
        )
        .catch((err) =>
          console.log(
            `Error creating ${label.name} in ${repo.name} \n Reason: ${err}`
          )
        );
    });
  });
}
