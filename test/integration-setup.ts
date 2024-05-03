import {v4} from 'uuid';
import {CacheClientProps} from '@gomomento/sdk/dist/src/cache-client-props';
import {
  CacheClient,
  CacheConfiguration,
  Configurations,
  CreateCache,
  CredentialProvider,
  DeleteCache,
  MomentoErrorCode,
} from '@gomomento/sdk';
import {MomentoIORedis, MomentoRedisAdapter, NewIORedisWrapper} from '../src';

export function testCacheName(): string {
  const name = process.env.CACHE_NAME || 'js-integration-test-default';
  return name + v4();
}

function useCompression(): boolean {
  return process.env.COMPRESSION === 'true';
}

const deleteCacheIfExists = async (momento: CacheClient, cacheName: string) => {
  const deleteResponse = await momento.deleteCache(cacheName);
  if (deleteResponse instanceof DeleteCache.Error) {
    if (deleteResponse.errorCode() !== MomentoErrorCode.NOT_FOUND_ERROR) {
      throw deleteResponse.innerException();
    }
  }
};

function momentoClientForTesting() {
  const configuration: CacheConfiguration = Configurations.Laptop.latest();
  const IntegrationTestCacheClientProps: CacheClientProps = {
    configuration,
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: 'MOMENTO_API_KEY',
    }),
    defaultTtlSeconds: 60,
  };
  return new CacheClient(IntegrationTestCacheClientProps);
}

export function isRedisBackedTest() {
  return process.env.MOMENTO_ENABLED !== 'true';
}

export function SetupIntegrationTest(): {
  client: MomentoIORedis;
  compression?: boolean;
} {
  if (isRedisBackedTest()) {
    return setupIntegrationTestWithRedis();
  } else {
    return setupIntegrationTestWithMomento();
  }
}

function setupIntegrationTestWithMomento() {
  const cacheName = testCacheName();

  beforeAll(async () => {
    // Use a fresh client to avoid test interference with setup.
    const momento = momentoClientForTesting();
    await deleteCacheIfExists(momento, cacheName);
    const createResponse = await momento.createCache(cacheName);
    if (createResponse instanceof CreateCache.Error) {
      throw createResponse.innerException();
    }
  });

  afterAll(async () => {
    // Use a fresh client to avoid test interference with teardown.
    const momento = momentoClientForTesting();
    const deleteResponse = await momento.deleteCache(cacheName);
    if (deleteResponse instanceof DeleteCache.Error) {
      throw deleteResponse.innerException();
    }
  });

  const momentoClient = momentoClientForTesting();
  const momentoNodeRedisClient = new MomentoRedisAdapter(
    momentoClient,
    cacheName,
    {
      useCompression: useCompression(),
    },
  );

  return {
    client: momentoNodeRedisClient,
    compression: momentoNodeRedisClient.useCompression,
  };
}

function setupIntegrationTestWithRedis() {
  const client = NewIORedisWrapper({
    host: process.env.TEST_REDIS_HOST || 'localhost',
    port: process.env.TEST_REDIS_PORT
      ? Number(process.env.TEST_REDIS_PORT)
      : 6379,
  });

  afterAll(async () => {
    await client.quit();
  });

  return {client: client};
}
