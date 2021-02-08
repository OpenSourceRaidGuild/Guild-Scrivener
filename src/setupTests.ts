import dotenv from 'dotenv';
import chalk from 'chalk';
import { server } from './testUtils/msw';
import { resetFirestore, cleanupFirebaseApps } from './testUtils/firebaseUtils';

dotenv.config();

chalk.level = 0;

beforeAll(() => server.listen());

beforeEach(async () => {
  server.resetHandlers();
  await resetFirestore();
});

afterAll(async () => {
  server.close();
  await cleanupFirebaseApps();
});
