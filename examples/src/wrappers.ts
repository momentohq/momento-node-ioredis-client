import {NewIORedisWrapper} from '@gomomento-poc/node-ioredis-client';

// set env vars to configure Momento; For more info, see Momento wrapper function configuration section.
process.env['MOMENTO_ENABLED'] = 'true';
process.env['MOMENTO_DEFAULT_TTL_SECONDS'] = '3600';
process.env['MOMENTO_CACHE_NAME'] = 'cache';

const redis = NewIORedisWrapper();

// Or initialize Momento as you would an ioredis cluster client
// const redis = NewIORedisClusterWrapper([], {});

// make redis calls!
await redis.set('my-key', 'my-value');
const value = await redis.get('my-key');
console.log(`redis.get('my-key') returned: ${value}`);
