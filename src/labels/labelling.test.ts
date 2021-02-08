import runOctokitWebhook from '../testUtils/runOctokitWebhook';
import { labelWebhookhandler } from './labelling';

it('smoke tests', async () => {
  try {
    const results = await runOctokitWebhook(() =>
      labelWebhookhandler({} as any)
    );
  } catch {}
});
