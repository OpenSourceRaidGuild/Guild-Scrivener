import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';
dotenv.config();

export const octokit = new Octokit({
  auth: process.env.AUTH,
});
