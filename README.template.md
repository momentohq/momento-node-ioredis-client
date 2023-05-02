{{ ossHeader }}

# Momento Node.js IORedis compatibility client

## What and why?

This project provides a Momento-backed implementation of [ioredis](https://github.com/luin/ioredis)
The goal is to provide a drop-in replacement for [ioredis](https://github.com/luin/ioredis) so that you can
use the same code with either a Redis server or with the Momento Cache service!

## Usage

To switch your existing `ioredis` application to use Momento, you only need to change the code where you construct
your client object:

<table>
<tr>
 <td width="50%">With ioredis client</td>
 <td width="50%">With Momento's Redis compatibility client</td>
</tr>
<tr>
 <td width="50%" valign="top">

```javascript
// Import the redis module
const Redis = require('ioredis');

// Create a Redis instance.
// By default, it will connect to localhost:6379.
const redis = new Redis();
// or cluster client example
const redis = new Redis.Cluster(['localhost:6379'], {
  redisOptions: {tls: false},
});
```

</td>
<td width="50%">

```javascript
// Import the Momento redis compatibility client.
import {NewIORedisWrapper, NewIORedisClusterWrapper} from '@gomomento-poc/node-ioredis-client';
import {
  CacheClient,
  Configurations,
  CredentialProvider,
} from '@gomomento/sdk';

// Instatiate Momento Adapter Directly
const Redis = new MomentoRedisAdapter(
  new CacheClient({
    configuration: Configurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromEnvironmentVariable({
      environmentVariableName: authTokenEnvVarName,
    }),
    defaultTtlSeconds: config.defaultTTLSeconds,
  }),
  config.cacheName,
);

// Or use Momento Wrapper Functions to provide a more drop in friendly replacement when trying to toggle between momento and Redis.
// Use env vars to configure Momento. See Momento Wrapper Function configuration section.
// Initialize basic Redis client Momento Wrapper
const redisClient = NewIORedisWrapper();

// Or Initilize Momento as you would a `ioredis cluster client
const redisClusterClient = NewIORedisClusterWrapper([], {});

```

 </td>
</tr>
</table>

**NOTE**: The Momento `ioredis` implementation currently supports simple key/value pairs (`GET`, `SET`, `DELETE`). We
will continue to add support for additional Redis APIs in the future; for more
information see the [Current Redis API Support](#current-redis-api-support) section later in this doc.

### Momento Wrapper Function configuration

In this package we provide wrapper functions that help you configure wether or not to use Momento and how client
settings
should look based off Environment variables. This is to try and make for a simpler drop in experience where you might be
running Momento or Redis based off the environment or Region. This applies for `NewIORedisWrapper`
and `NewIORedisClusterWrapper`
wrapper functions.

| EnvVar Name         | Description                                                | Default |
|---------------------|------------------------------------------------------------|---------|
| MOMENTO_ENABLED     | Will allow you to toggle between using Momento and IORedis | false   |
| MOMENTO_AUTH_TOKEN  | The Momento Auth token you would like to use               | ""      |
| CACHE_NAME          | The name of the Momento Cache to use if Momento is enabled | ""      |
| DEFAULT_TTL_SECONDS | The number of seconds to cache items for by default        | 86400   |

## Installation

The Momento Node.js IORedis compatibility client
is [available on npm.js](https://www.npmjs.com/package/@gomomento-poc/node-ioredis-client).
You can install it via:

```bash
npm install @gomomento-poc/node-ioredis-client
```

## Current Redis API Support

This library supports the most popular Redis APIs, but does not yet support all Redis APIs. We currently support the
most
common APIs related to string values (GET, SET, DELETE). We will be adding support for additional
APIs in the future. If there is a particular API that you need support for, please drop by
our [Discord](https://discord.com/invite/3HkAKjUZGq)
or e-mail us at [support@momentohq.com](mailto:support@momentohq.com) and let us know!

{{ ossFooter }}
