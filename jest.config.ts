import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  rootDir: 'src',
  verbose: true,
  testEnvironment: 'node',
  moduleDirectories: ['node_modules', 'src'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  setupFilesAfterEnv: ['./setupTests.ts'],
  moduleFileExtensions: ['js', 'ts'],
};
export default config;
