// #!/usr/bin/env node
import fastify from 'fastify';
import middie from 'middie';
import chalk from 'chalk';

import { labelsWebhook, repoCreatedWebhook } from './labels/index';
import { raidsWebhook } from './raids/index';
import { createNodeMiddleware } from '@octokit/webhooks';

import dotenv from 'dotenv';
dotenv.config();

const server = fastify();

const start = async () => {
  await server.register(middie);
  server.use(createNodeMiddleware(raidsWebhook, { path: '/raid-hooks' }));
  server.use(createNodeMiddleware(labelsWebhook, { path: '/labels' }));
  server.use(
    createNodeMiddleware(repoCreatedWebhook, { path: '/new-repo-label-update' })
  );

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
