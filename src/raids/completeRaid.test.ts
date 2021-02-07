import { buildRepositoryEvent } from '../testUtils/dataFactory';
import runOctokitWebhook from '../testUtils/runOctokitWebhook';
import completeRaid from './completeRaid';

it('smoke tests', async () => {
  const result = await runOctokitWebhook(() =>
    completeRaid(
      buildRepositoryEvent({
        eventType: 'archived',
      })
    )
  );
});
