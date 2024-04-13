// Import the Momento redis compatibility client.
import {MomentoRedisAdapter, CacheClient, CredentialProvider} from '@gomomento-poc/node-ioredis-client';

// Instantiate Momento Adapter
const redis = new MomentoRedisAdapter(
  new CacheClient({
    credentialProvider: CredentialProvider.fromEnvironmentVariable('MOMENTO_API_KEY'),
    defaultTtlSeconds: 3600,
  }),
  'cache'
);

// make redis calls!
await redis.set('my-key', 'my-value');
const value = await redis.get('my-key');
console.log(`redis.get('my-key') returned: ${value}`);
