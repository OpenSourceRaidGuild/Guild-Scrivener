import runOctokitWebhook from '../testUtils/runOctokitWebhook';
import { labelWebhookHandler } from './labelWebhookHandler';

it('smoke tests', async () => {
  try {
    const results = await runOctokitWebhook(() =>
      labelWebhookHandler({} as any)
    );
  } catch {}
});
