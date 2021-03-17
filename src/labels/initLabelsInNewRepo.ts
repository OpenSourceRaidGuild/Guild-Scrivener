import { octokit } from '../utils/octokit';
import chalk from 'chalk';
import { createLabelInRepos } from './repoEventHelpers';
import { EmitterWebhookEvent } from '@octokit/webhooks';
import dotenv from 'dotenv';
dotenv.config();

// TODO delete partial Label dupes that are older or shorter

export async function initLabelsInNewRepoHandler(
  event: EmitterWebhookEvent<'repository.created'>
) {
  const owner = String(event.payload.repository.owner.login);
  const listOfLabels = await octokit.issues.listLabelsForRepo({
    owner,
    repo: process.env.LABEL_REPO as string,
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
