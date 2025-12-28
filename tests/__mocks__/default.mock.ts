import { setEnvs } from './index.mock';

let restoreEnvs: () => void;
const testEnvs: Record<string, string | undefined> = {
  NODE_ENV: 'development',
  LOGGER_LEVEL: 'silent',
  LOGGER_NAME: '@catbee/utils',
  LOGGER_PRETTY: 'true'
};

beforeAll(() => {
  restoreEnvs = setEnvs(testEnvs);
});

afterAll(() => {
  restoreEnvs();
});
