// #!/usr/bin/env node
import fastify from 'fastify';
import fastifyExpress from 'fastify-express';
import { Webhooks } from '@octokit/webhooks';
import dotenv from 'dotenv';
import chalk from 'chalk';

import statCompactor from './raids/stat-compactor.js';

dotenv.config();

const webhooks = new Webhooks({
  secret: process.env.WEBHOOK_SECRET,
  path: '/github',
});
// Handle push events for stat compacting
webhooks.on('push', statCompactor);

const server = fastify();

const start = async () => {
  // Setup middleware
  await server.register(fastifyExpress);
  server.use(webhooks.middleware);

  server.listen(process.env.PORT ?? 4321, (error, address) => {
    if (error) {
      server.log.error(error);
      process.exit(1);
    } else {
      console.log(chalk.greenBright(`Server started on ${address}`));
    }
  });
};
start();

// const spinner = ora(chalk.cyanBright('Retrieving Labels From GitHub')).start();
// spinner.color = chalk.greenBright();

// //! Website will be source of label truth for all Org repos
// //TODO: Convert to Server that either polls while running OR listen for an event (Labels changing)
// export async function dumpGitHubLabelIntoDB() {
//   let response = [];
//   try {
//     response = await got(
//       `https://api.github.com/repos/${process.env.OWNER}/${process.env.LABEL_REPO}/labels`
//     ).json();
//   } finally {
//     return response;
//   }
// }

// try {
//   JSON.parse(await dumpGitHubLabelIntoDB()).forEach(
//     async (label) =>
//       await db
//         .collection('labels')
//         .doc(label.name)
//         .set(
//           { ...label, timestamp: FieldValue.serverTimestamp() },
//           { merge: true }
//         )
//         .then(() => console.log('Label in DB'))
//   );
// } catch (err) {
//   spinner.fail(chalk.redBright('Label Fetching/Writing Failed!!!'));
//   console.error('ERROR', err);
// }

// spinner.succeed(chalk.green('Labels Written to Database'));
