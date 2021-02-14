// #!/usr/bin/env node
import fastify from 'fastify';
import middie from 'middie';
import chalk from 'chalk';

import { labelsWebhook, repoCreatedWebhook } from './labels/index';
import { raidsWebhook } from './raids/index';

import dotenv from 'dotenv';
dotenv.config();

const server = fastify();

server.get('/ping', async () => 'Pong!');

const start = async () => {
  await server.register(middie);
  server.use(raidsWebhook.middleware);
  server.use(labelsWebhook.middleware);
  server.use(repoCreatedWebhook.middleware);

  server.listen(process.env.PORT ?? 5000, '0.0.0.0', (error, address) => {
    if (error) {
      server.log.error(String(error));
      process.exit(1);
    } else {
      console.log(chalk.green(`Server started on ${address}`));
    }
  });
};
start();
