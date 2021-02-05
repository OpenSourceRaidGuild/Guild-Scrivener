import { Webhooks } from '@octokit/webhooks';
import { labelWebhookhandler } from './labelling';
import dotenv from 'dotenv';
dotenv.config();

export const labelsWebhook = new Webhooks({
  secret: process.env.LABEL_HOOK_SECRET,
  path: '/labels',
});

labelsWebhook.on('label', labelWebhookhandler as any);
