import dotenv from 'dotenv';
import { server } from './testUtils/msw';

dotenv.config();

beforeAll(() => server.listen());

afterEach(() => server.resetHandlers());

afterAll(() => server.close());
