import { octokit } from '../octokit';
import chalk from 'chalk';
import { createLabelInRepos } from './repoEventHelpers';
import dotenv from 'dotenv';
import { EmitterWebhookEvent } from '@octokit/webhooks';
dotenv.config();

// TODO delete partial Label dupes that are older or shorter

export async function initLabelsInNewRepoHandler(
  event: EmitterWebhookEvent<'repository.created'>
) {
  const owner = String(event.payload.repository.owner);
  const listOfLabels = await octokit.issues.listLabelsForRepo({
    owner,
    repo: 'website',
  });

  listOfLabels.data.forEach(
    async (label) =>
      await createLabelInRepos({
        label: {
          name: label.name,
          color: label.color,
          description: label?.description as string,
        },
        repo: event.payload.repository.name,
        owner,
      })
        .then(() =>
          console.log(
            chalk.greenBright(
              `Label ${label.name} created in ${event.payload.repository.name} Successfully`
            )
          )
        )
        .catch((err) =>
          console.log(
            `Error creating ${label.name} in ${event.payload.repository.name} \n Reason: ${err}`
          )
        )
  );
}
