import { Webhooks } from '@octokit/webhooks';
import { labelWebhookHandler } from './labelWebhookHandler';
import dotenv from 'dotenv';
dotenv.config();

export const labelsWebhook = new Webhooks({
  secret: process.env.LABEL_HOOK_SECRET,
  path: '/labels',
});

labelsWebhook.on('label', labelWebhookHandler as any);
