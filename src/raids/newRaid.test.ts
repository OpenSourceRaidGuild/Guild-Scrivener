import {
  buildRepository,
  buildRepositoryEvent,
} from '../testUtils/dataFactory';
import runOctokitWebhook from '../testUtils/runOctokitWebhook';
import { server, rest } from '../testUtils/msw';
import createNewRaid from './newRaid';

it(`does not create a new raid if repository is not a fork`, async () => {
  const repositoryCreatedEvent = buildRepositoryEvent({
    eventType: 'created',
    isFork: false,
  });
  const result = await runOctokitWebhook(() =>
    createNewRaid(repositoryCreatedEvent)
  );

  // FIXME: Actually check firestore to ensure a raid has not been created

  const sanitizedStdOut = result.stdOut.replace(
    new RegExp(repositoryCreatedEvent.id, 'g'),
    'EVENT_ID'
  );
  expect(sanitizedStdOut).toMatchInlineSnapshot(`
    "[96m- Processing repository created event 'EVENT_ID'[39m
    [91m✖ Event 'EVENT_ID' did not meet criteria for Raid creation: Repository was not a fork[39m"
  `);
});

it(`does not create a raid if an active raid already exists for the dungeon`, async () => {
  // We need a specific repo that already exists, so use that
  // FIXME: Build random repository, and populate firestore with a raid for it, then return it here instead of hard-coding
  server.use(
    rest.get('https://api.github.com/repos/:owner/:repo', (req, res, ctx) => {
      return res(
        ctx.json(
          buildRepository({
            isFork: true,
            parentOwnerName: 'HospitalRun',
            parentRepoName: 'hospitalrun-frontend',
          })
        )
      );
    })
  );

  const repositoryCreatedEvent = buildRepositoryEvent({
    eventType: 'created',
    isFork: true,
  });
  const result = await runOctokitWebhook(() =>
    createNewRaid(repositoryCreatedEvent)
  );

  // FIXME: Actually check firestore to ensure a raid has been created

  const sanitizedStdOut = result.stdOut.replace(
    new RegExp(repositoryCreatedEvent.id, 'g'),
    'EVENT_ID'
  );
  expect(sanitizedStdOut).toMatchInlineSnapshot(`
    "[96m- Processing repository created event 'EVENT_ID'[39m
    [91m✖ An active Raid already exists for HospitalRun/hospitalrun-frontend[39m"
  `);
});

it(`creates a raid when called`, async () => {
  const repositoryCreatedEvent = buildRepositoryEvent({
    eventType: 'created',
    isFork: true,
  });
  const result = await runOctokitWebhook(() =>
    createNewRaid(repositoryCreatedEvent)
  );

  // FIXME: Actually check firestore to ensure a raid has been created

  const sanitizedStdOut = result.stdOut
    .replace(new RegExp(repositoryCreatedEvent.id, 'g'), 'EVENT_ID')
    .replace(/(\w+|\w+\.\w+)\/((\w+(-\w+)+)|\w+)/g, 'OWNER/REPO');
  expect(sanitizedStdOut).toMatchInlineSnapshot(`
    "[96m- Processing repository created event 'EVENT_ID'[39m
    [92m✔ Created new Raid for OWNER/REPO[39m"
  `);
});
