import { execSync } from 'child_process';
import { GenericContainer, StartedTestContainer } from 'testcontainers';

let postgresContainer: StartedTestContainer;
let urlConnection: string;

beforeAll(async () => {
  postgresContainer = await new GenericContainer('postgres:15')
    .withExposedPorts(5432)
    .withEnvironment({
      POSTGRES_USER: 'test',
      POSTGRES_PASSWORD: 'test',
      POSTGRES_DB: 'test',
    })
    .start();

  urlConnection = `postgresql://test:test@${postgresContainer.getHost()}:${postgresContainer.getMappedPort(5432)}/test`;

  process.env.DATABASE_URL = urlConnection;

  execSync('npx prisma migrate dev', {
    env: {
      ...process.env,
      DATABASE_URL: urlConnection,
    },
  });
});

afterAll(async () => {
  await postgresContainer.stop({ remove: true, removeVolumes: true });
});

jest.setTimeout(10000);

export { postgresContainer };
