import { Webhooks } from '@octokit/webhooks';

import createNewRaid from './newRaid';
import statCompactor from './statCompactor';
import completeRaid from './completeRaid';

export const raidsWebhook = new Webhooks({
  secret: process.env.RAID_HOOK_SECRET as string
});

raidsWebhook.on('repository.created', createNewRaid);
raidsWebhook.on('push', statCompactor);
raidsWebhook.on('repository.archived', completeRaid);
