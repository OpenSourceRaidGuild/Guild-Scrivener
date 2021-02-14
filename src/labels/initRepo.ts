import { octokit } from '../octokit';
import chalk from 'chalk';
// import { WebhookEvent } from '@octokit/webhooks';
import dotenv from 'dotenv';
dotenv.config();
const LOG = console.log;

const listOfReposResponse = await octokit.issues.listLabelsForRepo({
  owner: 'OpenSourceRaidGuild',
  repo: 'website',
});
