import dotenv from 'dotenv';
import chalk from 'chalk';
import { server } from './testUtils/msw';
import { resetFirestore, cleanupFirebaseApps } from './testUtils/firebaseUtils';

dotenv.config();

chalk.level = 0;

beforeAll(() => server.listen());

beforeEach(async () => {
  await resetFirestore();
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(async () => {
  server.close();
  await cleanupFirebaseApps();
});
