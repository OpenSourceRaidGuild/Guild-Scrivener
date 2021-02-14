import { octokit } from '../octokit';
import chalk from 'chalk';
// TODO use this after the manual init of all repos to init labels on fork or creation of Org repos
// import { WebhookEvent } from '@octokit/webhooks';
import { createLabelInRepos } from './repoEventHelpers';
import dotenv from 'dotenv';
dotenv.config();

// TODO

(async (): Promise<void> => {
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
})();
