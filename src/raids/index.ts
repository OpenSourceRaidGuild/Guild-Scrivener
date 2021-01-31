import { Webhooks } from '@octokit/webhooks';

import createNewRaid from './newRaid.js';
import statCompactor from './statCompactor.js';
import completeRaid from './completeRaid.js';

export const raidsWebhook = new Webhooks({
  secret: process.env.RAID_HOOK_SECRET,
  path: '/raid-hooks',
});

raidsWebhook.on('repository.created', createNewRaid);
raidsWebhook.on('push', statCompactor);
raidsWebhook.on('repository.archived', completeRaid);
