// #!/usr/bin/env node
import fastify from 'fastify';
import middie from 'middie';
import chalk from 'chalk';

import { labelsWebhook } from './labels/index.js';
import { raidsWebhook } from './raids/index.js';

import dotenv from 'dotenv';
dotenv.config();

const server = fastify();

server.get('/ping', async (req, res) => 'Pong!');

const start = async () => {
  await server.register(middie);
  server.use(raidsWebhook.middleware);
  server.use(labelsWebhook.middleware);

  server.listen(process.env.PORT ?? 4321, (error, address) => {
    if (error) {
      server.log.error(error);
      process.exit(1);
    } else {
      console.log(chalk.green(`Server started on ${address}`));
    }
  });
};
start();
