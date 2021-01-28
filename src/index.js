// #!/usr/bin/env node
import fastify from 'fastify';
import { Webhooks } from '@octokit/webhooks';
import got from 'got';
import chalk from 'chalk';
import ora from 'ora';
import { db } from './firebase.js';
const webhooks = new Webhooks({
  secret: process.env.WEBHOOK_SECRET,
});

webhooks.onAny(({ id, name, payload }) => {
  console.log(name, 'event received');
});

const start = async () => {
  try {
    await fastify(webhooks.middleware).listen(4321);
  } catch (err) {
    fastify().log.error(err);
    process.exit(1);
  }
};
start().then(() =>
  ora().succeed(chalk.greenBright(`Server Running on ${4321}`))
);

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
