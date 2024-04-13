import Redis, {
  ClusterNode,
  ClusterOptions,
  Redis as R,
  RedisOptions,
} from 'ioredis';
import {CacheClient, Configurations, CredentialProvider} from '@gomomento/sdk';
import {MomentoIORedis, MomentoRedisAdapter} from './momento-redis-adapter';

interface config {
  momentoEnabled: boolean;
  defaultTTLSeconds: number;
  cacheName: string;
}

const momentoApiKeyEnvVarName = 'MOMENTO_API_KEY';
const momentoEnabledEnvVarName = 'MOMENTO_ENABLED';
const momentoCacheNameEnvVarName = 'MOMENTO_CACHE_NAME';
const momentoDefaultTtlEnvVarName = 'MOMENTO_DEFAULT_TTL_SECONDS';

function parseConfig(): config {
  const enableMomentoVar = process.env[momentoEnabledEnvVarName],
    defaultTTLSecondsVar = process.env[momentoDefaultTtlEnvVarName],
    cacheNameVar = process.env[momentoCacheNameEnvVarName];
  let enableMomento = false,
    defaultTTLSeconds = 86400,
    cacheName = '';

  if (enableMomentoVar !== undefined && enableMomentoVar === 'true') {
    enableMomento = true;
    if (defaultTTLSecondsVar === undefined) {
      throw new Error(
        `missing ${momentoDefaultTtlEnvVarName} env var when using momento`
      );
    } else {
      defaultTTLSeconds = Number.parseInt(defaultTTLSecondsVar);
    }
    if (cacheNameVar === undefined || cacheNameVar === '') {
      throw new Error(
        `missing ${momentoCacheNameEnvVarName} env var when using momento`
      );
    } else {
      cacheName = cacheNameVar;
    }
  }
  return {
    momentoEnabled: enableMomento,
    defaultTTLSeconds: defaultTTLSeconds,
    cacheName: cacheName,
  };
}

export function NewIORedisWrapper(options?: RedisOptions): MomentoIORedis {
  const config = parseConfig();
  if (config.momentoEnabled) {
    return new MomentoRedisAdapter(
      new CacheClient({
        configuration: Configurations.Laptop.v1(),
        credentialProvider: CredentialProvider.fromEnvironmentVariable(
          momentoApiKeyEnvVarName
        ),
        defaultTtlSeconds: config.defaultTTLSeconds,
      }),
      config.cacheName
    );
  } else {
    if (!options) {
      return new Redis();
    } else {
      return new Redis(options);
    }
  }
}

export function NewIORedisClusterWrapper(
  startupNodes: ClusterNode[],
  options?: ClusterOptions
): MomentoIORedis {
  const config = parseConfig();
  if (config.momentoEnabled) {
    return new MomentoRedisAdapter(
      new CacheClient({
        configuration: Configurations.Laptop.v1(),
        credentialProvider: CredentialProvider.fromEnvironmentVariable(
          momentoApiKeyEnvVarName
        ),
        defaultTtlSeconds: config.defaultTTLSeconds,
      }),
      config.cacheName
    );
  } else {
    return new R.Cluster(startupNodes, options);
  }
}
