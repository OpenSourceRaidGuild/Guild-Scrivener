import { Webhooks } from '@octokit/webhooks';
import { labelWebhookHandler } from './labelWebhookHandler';
import { initLabelsInNewRepoHandler } from './initLabelsInNewRepo';
import dotenv from 'dotenv';
dotenv.config();

export const labelsWebhook = new Webhooks({
  secret: process.env.LABEL_HOOK_SECRET,
  path: '/labels',
});
export const repoCreatedWebhook = new Webhooks({
  secret: process.env.LABEL_HOOK_SECRET,
  path: '/repoCreated',
});

labelsWebhook.on('label', labelWebhookHandler);
repoCreatedWebhook.on('repository.created', initLabelsInNewRepoHandler as any);
repoCreatedWebhook.on('fork', initLabelsInNewRepoHandler as any);
