import EventEmitter from 'stream';
import {
  CacheClient,
  CacheDelete,
  CacheDictionaryFetch,
  CacheDictionaryGetField,
  CacheDictionaryGetFields,
  CacheDictionaryRemoveFields,
  CacheDictionarySetFields,
  CacheFlush,
  CacheGet,
  CacheItemGetTtl,
  CacheSet,
  CacheSetIfAbsent,
  CacheUpdateTtl,
  MomentoErrorCode,
} from '@gomomento/sdk';
import {RedisKey} from 'ioredis';

export interface MomentoIORedis {
  get(key: RedisKey): Promise<string | null>;

  set(key: RedisKey, value: string | Buffer | number): Promise<'OK' | null>;

  set(
    key: RedisKey,
    value: string | Buffer | number,
    secondsToken: 'EX',
    seconds: number | string
  ): Promise<'OK' | null>;

  set(
    key: RedisKey,
    value: string | Buffer | number,
    millisecondsToken: 'PX',
    milliseconds: number | string
  ): Promise<'OK' | null>;

  set(
    key: RedisKey,
    value: string | Buffer | number,
    unixTimeSecondsToken: 'EXAT',
    unixTimeSeconds: number | string
  ): Promise<'OK' | null>;

  set(
    key: RedisKey,
    value: string | Buffer | number,
    unixTimeMillisecondsToken: 'PXAT',
    unixTimeMilliseconds: number | string
  ): Promise<'OK' | null>;

  set(
    key: RedisKey,
    value: string | Buffer | number,
    nx: 'NX'
  ): Promise<'OK' | null>;

  set(
    key: RedisKey,
    value: string | Buffer | number,
    secondsToken: 'EX',
    seconds: number | string,
    nx: 'NX'
  ): Promise<'OK' | null>;

  set(
    key: RedisKey,
    value: string | Buffer | number,
    millisecondsToken: 'PX',
    milliseconds: number | string,
    nx: 'NX'
  ): Promise<'OK' | null>;

  set(
    key: RedisKey,
    value: string | Buffer | number,
    unixTimeSecondsToken: 'EXAT',
    unixTimeSeconds: number | string,
    nx: 'NX'
  ): Promise<'OK' | null>;

  set(
    key: RedisKey,
    value: string | Buffer | number,
    unixTimeMillisecondsToken: 'PXAT',
    unixTimeMilliseconds: number | string,
    nx: 'NX'
  ): Promise<'OK' | null>;

  ttl(key: RedisKey): Promise<number | null>;

  pttl(key: RedisKey): Promise<number | null>;

  pexpire(key: RedisKey, milliseconds: number): Promise<number | null>;

  pexpire(
    key: RedisKey,
    milliseconds: number,
    nx: 'NX'
  ): Promise<number | null>;

  pexpire(
    key: RedisKey,
    milliseconds: number,
    xx: 'XX'
  ): Promise<number | null>;

  pexpire(
    key: RedisKey,
    milliseconds: number,
    gt: 'GT'
  ): Promise<number | null>;

  pexpire(
    key: RedisKey,
    milliseconds: number,
    lt: 'LT'
  ): Promise<number | null>;

  del(...args: [...keys: RedisKey[]]): Promise<number>;

  hget(key: RedisKey, field: string | Buffer): Promise<string | null>;

  hmget(
    ...args: [key: RedisKey, ...fields: (string | Buffer)[]]
  ): Promise<(string | null)[]>;

  hgetall(key: RedisKey): Promise<Record<string, string>>;

  hset(key: RedisKey, object: object): Promise<number>;

  hset(
    key: RedisKey,
    map: Map<string | Buffer | number, string | Buffer | number>
  ): Promise<number>;

  hset(
    ...args: [key: RedisKey, ...fieldValues: (string | Buffer | number)[]]
  ): Promise<number>;

  hmset(key: RedisKey, object: object): Promise<'OK'>;

  hmset(
    key: RedisKey,
    map: Map<string | Buffer | number, string | Buffer | number>
  ): Promise<'OK'>;

  hmset(
    ...args: [key: RedisKey, ...fieldValues: (string | Buffer | number)[]]
  ): Promise<'OK'>;

  hdel(
    ...args: [key: RedisKey, ...fields: (string | Buffer)[]]
  ): Promise<number>;

  flushdb(): Promise<'OK'>;
  flushdb(async: 'ASYNC'): Promise<'OK'>;
  flushdb(sync: 'SYNC'): Promise<'OK'>;

  quit(): Promise<'OK'>;
}

export class MomentoRedisAdapter
  extends EventEmitter
  implements MomentoIORedis
{
  momentoClient: CacheClient;
  cacheName: string;
  useCompression: boolean;

  constructor(momentoClient: CacheClient, cacheName: string) {
    super();
    this.momentoClient = momentoClient;
    this.cacheName = cacheName;

    this.useCompression = momentoClient.configuration.hasCompressionStrategy();
  }

  async del(...args: [...keys: RedisKey[]]): Promise<number> {
    const promises: Array<Promise<CacheDelete.Response>> = [];
    args.forEach(value => {
      promises.push(this.momentoClient.delete(this.cacheName, value));
    });
    const deleteResponses = await Promise.all(promises);
    deleteResponses.forEach(r => {
      if (r instanceof CacheDelete.Error) {
        this.emitError('del', r.message(), r.errorCode());
      }
    });
    return promises.length;
  }

  async get(key: RedisKey): Promise<string | null> {
    const rsp = await this.momentoClient.get(this.cacheName, key, {
      decompress: this.useCompression,
    });
    if (rsp instanceof CacheGet.Hit) {
      return rsp.valueString();
    } else if (rsp instanceof CacheGet.Miss) {
      return null;
    } else if (rsp instanceof CacheGet.Error) {
      this.emitError('get', rsp.message(), rsp.errorCode());
    } else {
      this.emitError('get', `unexpected-response ${rsp}`);
    }
    return null;
  }

  // eslint-disable-next-line require-await, @typescript-eslint/require-await
  async quit(): Promise<'OK'> {
    // @ Noop for now.
    return 'OK';
  }

  emitError(op: string, msg: string, code?: MomentoErrorCode) {
    this.emit('error', {
      platform: this.momentoClient !== undefined ? 'momento' : 'redis',
      op: op,
      msg: msg,
      code: code,
    });
  }

  async set(
    key: RedisKey,
    value: string | Buffer | number
  ): Promise<'OK' | null>;
  async set(
    key: RedisKey,
    value: string | Buffer | number,
    secondsToken: 'EX',
    seconds: number | string
  ): Promise<'OK' | null>;
  async set(
    key: RedisKey,
    value: string | Buffer | number,
    millisecondsToken: 'PX',
    milliseconds: number | string
  ): Promise<'OK' | null>;
  async set(
    key: RedisKey,
    value: string | Buffer | number,
    unixTimeSecondsToken: 'EXAT',
    unixTimeSeconds: number | string
  ): Promise<'OK' | null>;
  async set(
    key: RedisKey,
    value: string | Buffer | number,
    unixTimeMillisecondsToken: 'PXAT',
    unixTimeMilliseconds: number | string
  ): Promise<'OK' | null>;
  async set(
    key: RedisKey,
    value: string | Buffer | number,
    nx: 'NX'
  ): Promise<'OK' | null>;
  async set(
    key: RedisKey,
    value: string | Buffer | number,
    secondsToken: 'EX',
    seconds: number | string,
    nx: 'NX'
  ): Promise<'OK' | null>;
  async set(
    key: RedisKey,
    value: string | Buffer | number,
    millisecondsToken: 'PX',
    milliseconds: number | string,
    nx: 'NX'
  ): Promise<'OK' | null>;
  async set(
    key: RedisKey,
    value: string | Buffer | number,
    unixTimeSecondsToken: 'EXAT',
    unixTimeSeconds: number | string,
    nx: 'NX'
  ): Promise<'OK' | null>;
  async set(
    key: RedisKey,
    value: string | Buffer | number,
    unixTimeMillisecondsToken: 'PXAT',
    unixTimeMilliseconds: number | string,
    nx: 'NX'
  ): Promise<'OK' | null>;
  async set(
    key: RedisKey,
    value: string | Buffer | number,
    ttlFlagIdentifier?: 'EX' | 'PX' | 'EXAT' | 'PXAT' | 'NX',
    ttlValue?: number | string,
    nx?: 'NX'
  ): Promise<'OK' | null> {
    let parsedTTl = -1;
    if (ttlValue === undefined) {
      // Do nothing keep as -1 will use default TTL
    } else if (typeof ttlValue === 'string') {
      parsedTTl = Number(ttlValue);
    } else {
      parsedTTl = ttlValue;
    }

    let nxFlagSet = false;

    if (ttlFlagIdentifier === 'PX') {
      parsedTTl = parsedTTl / 1000;
    } else if (ttlFlagIdentifier === 'EXAT') {
      parsedTTl = parsedTTl - Math.floor(Date.now() / 1000);
    } else if (ttlFlagIdentifier === 'PXAT') {
      parsedTTl = Math.floor((parsedTTl - Date.now()) / 1000);
    }

    if (ttlFlagIdentifier === 'NX' || nx !== undefined) {
      nxFlagSet = true;
    }

    if (nxFlagSet) {
      let rsp: CacheSetIfAbsent.Response;
      if (parsedTTl > -1) {
        rsp = await this.momentoClient.setIfAbsent(
          this.cacheName,
          key,
          value.toString(),
          {
            ttl: parsedTTl,
            compress: this.useCompression,
          }
        );
      } else {
        rsp = await this.momentoClient.setIfAbsent(
          this.cacheName,
          key,
          value.toString(),
          {compress: this.useCompression}
        );
      }

      if (rsp instanceof CacheSetIfAbsent.Stored) {
        return 'OK';
      } else if (rsp instanceof CacheSetIfAbsent.NotStored) {
        return null;
      } else if (rsp instanceof CacheSetIfAbsent.Error) {
        this.emitError('set-not-exists', rsp.message(), rsp.errorCode());
      } else {
        this.emitError('set-not-exists', `unexpected-response ${rsp}`);
      }
    } else {
      let rsp: CacheSet.Response;
      if (parsedTTl > -1) {
        rsp = await this.momentoClient.set(
          this.cacheName,
          key,
          value.toString(),
          {
            ttl: parsedTTl,
          }
        );
      } else {
        rsp = await this.momentoClient.set(
          this.cacheName,
          key,
          value.toString(),
          {compress: this.useCompression}
        );
      }

      if (rsp instanceof CacheSet.Success) {
        return 'OK';
      } else if (rsp instanceof CacheSet.Error) {
        this.emitError('set', rsp.message(), rsp.errorCode());
      } else {
        this.emitError('set', `unexpected-response ${rsp}`);
      }
    }

    return null;
  }

  async hset(
    ...args: [
      RedisKey,
      (
        | object
        | Map<string | Buffer | number, string | Buffer | number>
        | string
        | Buffer
        | number
      ),
      ...Array<string | Buffer | number>
    ]
  ): Promise<number> {
    let fieldsToSet: Map<string | Uint8Array, string | Uint8Array> = new Map();
    let dictionaryName = String(args[0]);
    if (typeof args[1] === 'object') {
      if (args[1] instanceof Map) {
        for (const [key, value] of args[1]) {
          fieldsToSet.set(String(key), String(value));
        }
      } else {
        dictionaryName = String(args[0]);
        fieldsToSet = new Map<string | Uint8Array, string | Uint8Array>(
          Object.entries(args[1])
        );
      }
    } else {
      for (let i = 1; i < args.length; i += 2) {
        fieldsToSet.set(String(args[i]), String(args[i + 1]));
      }
    }

    const rsp = await this.momentoClient.dictionarySetFields(
      this.cacheName,
      dictionaryName,
      fieldsToSet,
      {compress: this.useCompression}
    );

    if (rsp instanceof CacheDictionarySetFields.Success) {
      return fieldsToSet.size;
    } else if (rsp instanceof CacheDictionarySetFields.Error) {
      this.emitError('hset', rsp.message(), rsp.errorCode());
      return 0;
    } else {
      this.emitError('hset', `unexpected-response ${rsp}`);
      return 0;
    }
  }

  async hmset(
    ...args: [
      RedisKey,
      (
        | object
        | Map<string | Buffer | number, string | Buffer | number>
        | string
        | Buffer
        | number
      ),
      ...Array<string | Buffer | number>
    ]
  ): Promise<'OK'> {
    await this.hset(...args);
    return 'OK';
  }

  async hmget(
    ...args: [key: RedisKey, ...fields: (string | Buffer)[]]
  ): Promise<(string | null)[]> {
    const fields: string[] = [];
    for (let i = 1; i < args.length; i++) {
      fields.push(String(args[i]));
    }
    const rsp = await this.momentoClient.dictionaryGetFields(
      this.cacheName,
      String(args[0]),
      fields,
      {decompress: this.useCompression}
    );
    if (rsp instanceof CacheDictionaryGetFields.Hit) {
      return Array.from(rsp.valueMap().values());
    } else if (rsp instanceof CacheDictionaryGetFields.Miss) {
      return [];
    } else if (rsp instanceof CacheDictionaryGetFields.Error) {
      this.emitError('hmget', rsp.message(), rsp.errorCode());
      return [];
    } else {
      this.emitError('hmget', `unexpected-response ${rsp}`);
      return [];
    }
  }

  async hget(key: RedisKey, field: string | Buffer): Promise<string | null> {
    const rsp = await this.momentoClient.dictionaryGetField(
      this.cacheName,
      String(key),
      field,
      {decompress: this.useCompression}
    );
    if (rsp instanceof CacheDictionaryGetField.Hit) {
      return rsp.valueString();
    } else if (rsp instanceof CacheDictionaryGetField.Miss) {
      return null;
    } else if (rsp instanceof CacheDictionaryGetField.Error) {
      this.emitError('hget', rsp.message(), rsp.errorCode());
      return null;
    } else {
      this.emitError('hget', `unexpected-response ${rsp}`);
      return null;
    }
  }

  async hgetall(key: RedisKey): Promise<Record<string, string>> {
    const rsp = await this.momentoClient.dictionaryFetch(
      this.cacheName,
      String(key),
      {decompress: this.useCompression}
    );
    if (rsp instanceof CacheDictionaryFetch.Hit) {
      return rsp.valueRecord();
    } else if (rsp instanceof CacheDictionaryFetch.Miss) {
      return {};
    } else if (rsp instanceof CacheDictionaryFetch.Error) {
      this.emitError('hgetall', rsp.message(), rsp.errorCode());
      return {};
    } else {
      this.emitError('hgetall', `unexpected-response ${rsp}`);
      return {};
    }
  }

  async hdel(
    ...args: [key: RedisKey, ...fields: (string | Buffer)[]]
  ): Promise<number> {
    const fields: string[] = [];
    for (let i = 1; i < args.length; i++) {
      fields.push(String(args[i]));
    }
    const rsp = await this.momentoClient.dictionaryRemoveFields(
      this.cacheName,
      String(args[0]),
      fields
    );
    if (rsp instanceof CacheDictionaryRemoveFields.Success) {
      return fields.length;
    } else if (rsp instanceof CacheDictionaryRemoveFields.Error) {
      this.emitError('hdel', rsp.message(), rsp.errorCode());
      return 0;
    } else {
      this.emitError('hdel', `unexpected-response ${rsp}`);
      return 0;
    }
  }

  async ttl(key: RedisKey): Promise<number | null> {
    const rsp = await this.momentoClient.itemGetTtl(this.cacheName, key);
    if (rsp instanceof CacheItemGetTtl.Hit) {
      return rsp.remainingTtlMillis() / 1000;
    } else if (rsp instanceof CacheItemGetTtl.Miss) {
      return null;
    } else if (rsp instanceof CacheItemGetTtl.Error) {
      this.emitError('ttl', rsp.message(), rsp.errorCode());
    } else {
      this.emitError('ttl', `unexpected-response ${rsp}`);
    }
    return null;
  }

  async pttl(key: RedisKey): Promise<number | null> {
    const rsp = await this.momentoClient.itemGetTtl(this.cacheName, key);
    if (rsp instanceof CacheItemGetTtl.Hit) {
      return rsp.remainingTtlMillis();
    } else if (rsp instanceof CacheItemGetTtl.Miss) {
      return null;
    } else if (rsp instanceof CacheItemGetTtl.Error) {
      this.emitError('ttl', rsp.message(), rsp.errorCode());
    } else {
      this.emitError('ttl', `unexpected-response ${rsp}`);
    }
    return null;
  }

  async pexpire(
    key: RedisKey,
    milliseconds: number,
    ttlFlagIdentifier?: 'NX' | 'XX' | 'GT' | 'LT'
  ): Promise<number | null> {
    let shouldUpdateTtl = true;

    if (ttlFlagIdentifier === 'NX') {
      return 0;
    } else if (ttlFlagIdentifier === 'XX') {
      const getTtlRsp = await this.momentoClient.itemGetTtl(
        this.cacheName,
        key
      );
      shouldUpdateTtl =
        getTtlRsp instanceof CacheItemGetTtl.Hit &&
        getTtlRsp.remainingTtlMillis() > 0;
    } else if (ttlFlagIdentifier === 'GT' || ttlFlagIdentifier === 'LT') {
      const getTtlRsp = await this.momentoClient.itemGetTtl(
        this.cacheName,
        key
      );
      shouldUpdateTtl =
        getTtlRsp instanceof CacheItemGetTtl.Hit &&
        (ttlFlagIdentifier === 'GT'
          ? getTtlRsp.remainingTtlMillis() < milliseconds
          : getTtlRsp.remainingTtlMillis() > milliseconds);
    }

    if (shouldUpdateTtl) {
      const rsp = await this.momentoClient.updateTtl(
        this.cacheName,
        key,
        milliseconds
      );

      if (rsp instanceof CacheUpdateTtl.Set) {
        return 1;
      } else if (rsp instanceof CacheUpdateTtl.Miss) {
        return 0;
      } else if (rsp instanceof CacheUpdateTtl.Error) {
        this.emitError('pexpire', rsp.message(), rsp.errorCode());
      } else {
        this.emitError('pexpire', `unexpected-response ${rsp}`);
      }
    }

    return 0;
  }

  async flushdb(): Promise<'OK'> {
    const rsp = await this.momentoClient.flushCache(this.cacheName);
    if (rsp instanceof CacheFlush.Success) {
      return 'OK';
    } else if (rsp instanceof CacheFlush.Error) {
      this.emitError('flushdb', rsp.message(), rsp.errorCode());
      return 'OK';
    } else {
      this.emitError('flushdb', `unexpected-response ${rsp}`);
      return 'OK';
    }
  }
}
