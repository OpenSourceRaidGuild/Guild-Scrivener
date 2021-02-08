import runOctokitWebhook from '../testUtils/runOctokitWebhook';
import statCompactor from './statCompactor';

it('smoke tests', async () => {
  const result = await runOctokitWebhook(() => statCompactor({} as any));
});
