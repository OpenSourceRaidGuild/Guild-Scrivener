import dotenv from 'dotenv';
import { server } from './testUtils/msw';
import { resetFirestore, cleanupApps } from './testUtils/firebaseUtils';

dotenv.config();

beforeAll(() => server.listen());

afterEach(async () => {
  server.resetHandlers();
  await resetFirestore();
});

afterAll(async () => {
  server.close();
  await cleanupApps();
});
