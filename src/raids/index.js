import { Webhooks } from '@octokit/webhooks';
import statCompactor from './stat-compactor.js';

export const raidsWebhook = new Webhooks({
  secret: process.env.RAID_HOOK_SECRET,
  path: '/github',
});

raidsWebhook.on('push', statCompactor);
