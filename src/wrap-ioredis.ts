import {ClusterNode, ClusterOptions, Redis as R,} from 'ioredis';
import {
  CacheClient,
  Configurations,
  CredentialProvider,
} from "@gomomento/sdk";
import {MomentoRedisAdapter} from "./momento-redis-adapter";

export function NewIORedisWrapper(startupNodes: ClusterNode[], options?: ClusterOptions) {
  const authTokenEnvVarName = 'MOMENTO_AUTH_TOKEN',
    enableMomentoVar = process.env["MOMENTO_ENABLED"],
    defaultTTLSecondsVar = process.env["DEFAULT_TTL_SECONDS"],
    cacheNameVar = process.env["CACHE_NAME"];
  let enableMomento = false, defaultTTLSeconds = 86400, cacheName = "";

  if (enableMomentoVar != undefined && enableMomentoVar === "true") {
    enableMomento = true;
    if (defaultTTLSecondsVar == undefined) {
      throw new Error("missing DEFAULT_TTL env var when using momento")
    } else {
      defaultTTLSeconds = Number.parseInt(defaultTTLSecondsVar)
    }
    if (cacheNameVar == undefined || cacheNameVar == "") {
      throw new Error("missing CACHE_NAME env var when using momento")
    } else {
      cacheName = cacheNameVar
    }
  }

  if (enableMomento) {
    return new MomentoRedisAdapter(
      new CacheClient({
        configuration: Configurations.Laptop.v1(),
        credentialProvider: CredentialProvider.fromEnvironmentVariable({
          environmentVariableName: authTokenEnvVarName,
        }),
        defaultTtlSeconds: defaultTTLSeconds,
      }),
      cacheName,
    )
  } else {
    return new R.Cluster(startupNodes, options);
  }
}
