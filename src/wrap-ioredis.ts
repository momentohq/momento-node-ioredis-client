import {Cluster as C, ClusterNode, ClusterOptions, Redis as R, RedisKey,} from 'ioredis';
import {
  CacheClient,
  CacheDelete,
  CacheGet,
  CacheSet, CacheSetIfNotExists,
  Configurations,
  CredentialProvider,
  MomentoErrorCode,
} from "@gomomento/sdk";
import EventEmitter from "stream";

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

export interface MomentoIORedisCluster {

  get(key: RedisKey): Promise<string | null>;

  set(key: RedisKey, value: string | Buffer | number): Promise<'OK' | null>;
  set(key: RedisKey, value: string | Buffer | number, secondsToken: "EX", seconds: number | string): Promise<'OK' | null>;
  set(key: RedisKey, value: string | Buffer | number, millisecondsToken: "PX", milliseconds: number | string): Promise<'OK' | null>;
  set(key: RedisKey, value: string | Buffer | number, unixTimeSecondsToken: "EXAT", unixTimeSeconds: number | string): Promise<"OK" | null>;
  set(key: RedisKey, value: string | Buffer | number, unixTimeMillisecondsToken: "PXAT", unixTimeMilliseconds: number | string): Promise<"OK" | null>
  set(key: RedisKey, value: string | Buffer | number, nx: "NX"): Promise<"OK" | null>
  set(key: RedisKey, value: string | Buffer | number, secondsToken: "EX", seconds: number | string, nx: "NX"): Promise<"OK" | null>
  set(key: RedisKey, value: string | Buffer | number, millisecondsToken: "PX", milliseconds: number | string, nx: "NX"): Promise<"OK" | null>
  set(key: RedisKey, value: string | Buffer | number, unixTimeSecondsToken: "EXAT", unixTimeSeconds: number | string, nx: "NX"): Promise<"OK" | null>
  set(key: RedisKey, value: string | Buffer | number, unixTimeMillisecondsToken: "PXAT", unixTimeMilliseconds: number | string, nx: "NX"): Promise<"OK" | null>

  del(...args: [...keys: RedisKey[]]): Promise<number>;

  quit(): Promise<'OK'>;
}

export class MomentoRedisAdapter extends EventEmitter implements MomentoIORedisCluster {
  ioRedisClusterClient: C | undefined;
  momentoClient: CacheClient | undefined;

  constructor(startupNodes: ClusterNode[], options?: ClusterOptions) {
    super();
    if (enableMomento) {
      this.momentoClient = new CacheClient({
        configuration: Configurations.Laptop.v1(),
        credentialProvider: CredentialProvider.fromEnvironmentVariable({
          environmentVariableName: authTokenEnvVarName,
        }),
        defaultTtlSeconds: defaultTTLSeconds,
      });
    } else {
      this.ioRedisClusterClient = new R.Cluster(startupNodes, options);
    }
  }

  async del(...args: [...keys: RedisKey[]]): Promise<number> {
    if (!enableMomento) {
      return this.ioRedisClusterClient!.del(args);
    }

    const promises: Array<Promise<CacheDelete.Response>> = [];
    args.forEach((value) => {
      promises.push(this.momentoClient!.delete(cacheName, value));
    });
    const deleteResponses = await Promise.all(promises);
    deleteResponses.forEach((r) => {
      if (r instanceof CacheDelete.Error) {
        this.emitError("del", r.message(), r.errorCode());
      }
    });
    return promises.length;
  }


  async get(key: RedisKey): Promise<string | null> {
    if (!enableMomento) {
      return this.ioRedisClusterClient!.get(key);
    }

    const rsp = await this.momentoClient!.get(cacheName, key);
    if (rsp instanceof CacheGet.Hit) {
      return rsp.valueString();
    } else if (rsp instanceof CacheGet.Miss) {
      return null;
    } else if (rsp instanceof CacheGet.Error) {
      this.emitError("get", rsp.message(), rsp.errorCode());
    } else {
      this.emitError("get", "unexpected-response")
    }
    return null;
  }

  async quit(): Promise<"OK"> {
    if (!enableMomento) {
      return this.ioRedisClusterClient!.quit();
    }
    // Noop for now. TODO shut down momento client gracefully
    return 'OK';
  }

  emitError(op: String, msg: String, code?: MomentoErrorCode) {
    this.emit("error", {
      platform: this.momentoClient !== undefined? "momento": "redis",
      op: op,
      msg: msg,
      code: code
    });
  }

  async set(key: RedisKey, value: string | Buffer | number): Promise<"OK" | null>;
  async set(key: RedisKey, value: string | Buffer | number, secondsToken: "EX", seconds: number | string): Promise<"OK" | null>;
  async set(key: RedisKey, value: string | Buffer | number, millisecondsToken: "PX", milliseconds: number | string): Promise<"OK" | null>;
  async set(key: RedisKey, value: string | Buffer | number, unixTimeSecondsToken: "EXAT", unixTimeSeconds: number | string): Promise<"OK" | null>;
  async set(key: RedisKey, value: string | Buffer | number, unixTimeMillisecondsToken: "PXAT", unixTimeMilliseconds: number | string): Promise<"OK" | null>;
  async set(key: RedisKey, value: string | Buffer | number, nx: "NX"): Promise<"OK" | null>
  async set(key: RedisKey, value: string | Buffer | number, secondsToken: "EX", seconds: number | string, nx: "NX"): Promise<"OK" | null>
  async set(key: RedisKey, value: string | Buffer | number, millisecondsToken: "PX", milliseconds: number | string, nx: "NX"): Promise<"OK" | null>
  async set(key: RedisKey, value: string | Buffer | number, unixTimeSecondsToken: "EXAT", unixTimeSeconds: number | string, nx: "NX"): Promise<"OK" | null>
  async set(key: RedisKey, value: string | Buffer | number, unixTimeMillisecondsToken: "PXAT", unixTimeMilliseconds: number | string, nx: "NX"): Promise<"OK" | null>
  async set(key: RedisKey, value: string | Buffer | number, ttlFlagIdentifier?: "EX" | "PX" | "EXAT" | "PXAT" | "NX", ttlValue?: number | string, nx?: "NX"): Promise<"OK" | null> {
    if (!enableMomento) {
      if (ttlFlagIdentifier !== undefined) {
        // @ts-ignore ttlFlagIdentifier force to match type
        return this.ioRedisClusterClient!.set(key, value, ttlFlagIdentifier, ttlValue, nx);
      }
      return this.ioRedisClusterClient!.set(key, value);
    }

    let parsedTTl = -1
    if (ttlValue === undefined) {
      // Do nothing keep as -1 will use default TTL
    } else if (typeof ttlValue === "string") {
      parsedTTl = Number(ttlValue)
    } else {
      parsedTTl = ttlValue
    }

    let nxFlagSet = false

    if (ttlFlagIdentifier === "PX") {
      parsedTTl = parsedTTl / 1000
    } else if (ttlFlagIdentifier === "EXAT") {
      parsedTTl = parsedTTl - Math.floor(Date.now() / 1000)
    } else if (ttlFlagIdentifier === "PXAT") {
      parsedTTl = Math.floor((parsedTTl - Date.now()) / 1000);
    }

    if (ttlFlagIdentifier === "NX" || nx !== undefined) {
      nxFlagSet = true
    }

    if (nxFlagSet) {
      let rsp: CacheSetIfNotExists.Response
      if (parsedTTl > -1) {
        rsp = await this.momentoClient!.setIfNotExists(
          cacheName,
          key,
          value.toString(),
          {
            ttl: parsedTTl
          }
        );
      } else {
        rsp = await this.momentoClient!.setIfNotExists(cacheName, key, value.toString())
      }

      if (rsp instanceof CacheSetIfNotExists.Stored) {
        return "OK"
      } else if (rsp instanceof CacheSetIfNotExists.NotStored) {
        return null
      } else if (rsp instanceof CacheSetIfNotExists.Error) {
        this.emitError("set-not-exists", rsp.message(), rsp.errorCode());
      } else {
        this.emitError("set-not-exists", "unexpected-response")
      }
    } else {
      let rsp: CacheSet.Response
      if (parsedTTl > -1) {
        rsp = await this.momentoClient!.set(
          cacheName,
          key,
          value.toString(),
          {
            ttl: parsedTTl
          }
        );
      } else {
        rsp = await this.momentoClient!.set(cacheName, key, value.toString())
      }


      if (rsp instanceof CacheSet.Success) {
        return "OK";
      } else if (rsp instanceof CacheSet.Error) {
        this.emitError("set", rsp.message(), rsp.errorCode());
      } else {
        this.emitError("set", "unexpected-response")
      }
    }

    return null;
  }

}
