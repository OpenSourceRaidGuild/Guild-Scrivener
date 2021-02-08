import dotenv from 'dotenv';
import { server } from './testUtils/msw';
import { resetFirestore, cleanupFirebaseApps } from './testUtils/firebaseUtils';

dotenv.config();

beforeAll(() => server.listen());

beforeEach(async () => {
  server.resetHandlers();
  await resetFirestore();
});

afterAll(async () => {
  server.close();
  await cleanupFirebaseApps();
});
