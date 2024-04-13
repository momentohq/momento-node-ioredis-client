{{ ossHeader }}

# Momento Node.js IORedis compatibility client

## What and why?

This project provides a Momento-backed implementation of [ioredis](https://github.com/luin/ioredis)
The goal is to provide a drop-in replacement for [ioredis](https://github.com/luin/ioredis) so that you can
use the same code with either a Redis server or with the Momento Cache service!

## Installation

The Momento Node.js IORedis compatibility client is [available on npm.js](https://www.npmjs.com/package/@gomomento-poc/node-ioredis-client). You can install it via:

```bash
npm install @gomomento-poc/node-ioredis-client
```

## Usage

To switch your existing `ioredis` application to use Momento Cache, you only need to change the code where you construct your client object. Here is an example of constructing a Momento ioredis client:

```typescript
{% include "./examples/src/basic.ts" %}
```

Alternately, if you'd like to be able to easily switch back and forth between Momento and Redis using environment variables, you can use the `NewIORedisWrapper` and `NewIORedisClusterWrapper` wrapper functions:

```typescript
{% include "./examples/src/wrapper.ts" %}
```

**NOTE**: The Momento `ioredis` implementation currently supports simple key/value pairs (`GET`, `SET`, `DELETE`) as well as hash values (`HGET`/`HSET`). We will continue to add support for additional Redis APIs in the future; for more information see the [current Redis API support](#current-redis-api-support) section later in this doc.

### Compression

The Momento ioredis client provides built-in support for compression. If your data contains relatively large text-based data structures (e.g. large JSON objects), compression can significantly speed up your application and potentially reduce network costs. To enable compression, all you need to do is set the `compression` option to `true` when constructing your client:

```typescript
{% include "./examples/src/compression.ts" %}
```

After making this change to the configuration, all of your data will be compressed before storing it in the Momento cache, and will be automatically decompressed when retrieved.

### Momento wrapper function configuration

In this package we provide wrapper functions that help you configure whether or not to use Momento and how client settings should look based off environment variables. This is to try and make for a simpler drop in experience where you might be running Momento or Redis based off the environment or Region. This applies for `NewIORedisWrapper` and `NewIORedisClusterWrapper` wrapper functions.

| EnvVar Name                 | Description                                                | Default |
|-----------------------------|------------------------------------------------------------|---------|
| MOMENTO_ENABLED             | Will allow you to toggle between using Momento and IORedis | false   |
| MOMENTO_API_KEY             | The Momento Auth token you would like to use               | ""      |
| MOMENTO_CACHE_NAME          | The name of the Momento Cache to use if Momento is enabled | ""      |
| MOMENTO_DEFAULT_TTL_SECONDS | The number of seconds to cache items for by default        | 86400   |

## Current Redis API support

This library supports the most popular Redis APIs, but does not yet support all Redis APIs. We currently support the most common APIs related to string values (GET, SET, DELETE), as well as hash values (`HGET`/`HSET`). We will be adding support for additional APIs in the future. If there is a particular API that you need support for, please drop by our [Discord](https://discord.com/invite/3HkAKjUZGq) or e-mail us at [support@momentohq.com](mailto:support@momentohq.com) and let us know!

{{ ossFooter }}
