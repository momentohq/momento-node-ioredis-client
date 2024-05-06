import {EventEmitter} from 'stream';
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
  CacheGetBatch,
  CacheIncrement,
  CacheItemGetTtl,
  CacheSet,
  CacheSetBatch,
  CacheSetIfAbsent,
  CacheUpdateTtl,
  MomentoErrorCode,
} from '@gomomento/sdk';
import {Command, RedisKey} from 'ioredis';
import * as zstd from '@mongodb-js/zstd';
import {ChainableCommander} from 'ioredis/built/utils/RedisCommander';
import Pipeline from './Pipeline';

const TEXT_DECODER = new TextDecoder();

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

  setex(
    key: RedisKey,
    seconds: number | string,
    value: string | Buffer | number
  ): Promise<'OK' | null>;

  incr(key: RedisKey): Promise<number | null>;

  ttl(key: RedisKey): Promise<number | null>;

  pttl(key: RedisKey): Promise<number | null>;

  pexpire(key: RedisKey, milliseconds: number): Promise<number | null>;

  pexpire(key: RedisKey, milliseconds: number, nx: 'NX'): Promise<number>;

  pexpire(key: RedisKey, milliseconds: number, xx: 'XX'): Promise<number>;

  pexpire(key: RedisKey, milliseconds: number, gt: 'GT'): Promise<number>;

  pexpire(key: RedisKey, milliseconds: number, lt: 'LT'): Promise<number>;

  expire(key: RedisKey, seconds: number): Promise<number>;

  expire(key: RedisKey, seconds: number, nx: 'NX'): Promise<number>;

  expire(key: RedisKey, seconds: number, xx: 'XX'): Promise<number>;

  expire(key: RedisKey, seconds: number, gt: 'GT'): Promise<number>;

  expire(key: RedisKey, seconds: number, lt: 'LT'): Promise<number>;

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

  mset(
    ...args: [
      key: RedisKey,
      value: string | Buffer | number,
      ...keyValues: (RedisKey | string | Buffer | number)[]
    ]
  ): Promise<'OK'>;

  mget(
    ...args: [key: RedisKey, ...keys: RedisKey[]]
  ): Promise<(string | null)[]>;

  flushdb(): Promise<'OK'>;

  flushdb(async: 'ASYNC'): Promise<'OK'>;

  flushdb(sync: 'SYNC'): Promise<'OK'>;

  unlink(...args: [...keys: RedisKey[]]): Promise<number>;

  // TODO using type <any> here causes lint errors see if way to tighten up
  // TODO currently we pass back ChainableCommander here which means we dont get
  // TODO compile time checks on what methods are supported by the MomentoIORedis
  // TODO interface. We could try defining our own ChainableMomento interface
  // TODO instead here potentially
  pipeline(commands?: Array<Array<any>>): ChainableCommander;

  quit(): Promise<'OK'>;
}

export interface MomentoRedisAdapterOptions {
  useCompression?: boolean;
}

export class MomentoRedisAdapter
  extends EventEmitter
  implements MomentoIORedis
{
  momentoClient: CacheClient;
  cacheName: string;
  useCompression: boolean;

  constructor(
    momentoClient: CacheClient,
    cacheName: string,
    options?: MomentoRedisAdapterOptions
  ) {
    super();
    this.momentoClient = momentoClient;
    this.cacheName = cacheName;

    this.useCompression = options?.useCompression ?? false;
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
    const rsp = await this.momentoClient.get(this.cacheName, key);
    if (rsp instanceof CacheGet.Hit) {
      if (this.useCompression) {
        return decompress(rsp.valueUint8Array());
      } else {
        return rsp.valueString();
      }
    } else if (rsp instanceof CacheGet.Miss) {
      return null;
    } else if (rsp instanceof CacheGet.Error) {
      this.emitError('get', rsp.message(), rsp.errorCode());
    } else {
      this.emitError('get', `unexpected-response ${rsp.toString()}`);
    }
    return null;
  }

  // eslint-disable-next-line require-await, @typescript-eslint/require-await
  async quit(): Promise<'OK'> {
    this.momentoClient.close();
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

    let rsp: CacheSetIfAbsent.Response;
    let maybeCompressedValue: string | Uint8Array;
    if (this.useCompression) {
      maybeCompressedValue = await compress(value);
    } else {
      maybeCompressedValue = value.toString();
    }

    if (nxFlagSet) {
      if (parsedTTl > -1) {
        rsp = await this.momentoClient.setIfAbsent(
          this.cacheName,
          key,
          maybeCompressedValue,
          {
            ttl: parsedTTl,
          }
        );
      } else {
        rsp = await this.momentoClient.setIfAbsent(
          this.cacheName,
          key,
          maybeCompressedValue
        );
      }

      if (rsp instanceof CacheSetIfAbsent.Stored) {
        return 'OK';
      } else if (rsp instanceof CacheSetIfAbsent.NotStored) {
        return null;
      } else if (rsp instanceof CacheSetIfAbsent.Error) {
        this.emitError('set-not-exists', rsp.message(), rsp.errorCode());
      } else {
        this.emitError(
          'set-not-exists',
          `unexpected-response ${rsp.toString()}`
        );
      }
    } else {
      let rsp: CacheSet.Response;
      if (parsedTTl > -1) {
        rsp = await this.momentoClient.set(
          this.cacheName,
          key,
          maybeCompressedValue,
          {
            ttl: parsedTTl,
          }
        );
      } else {
        rsp = await this.momentoClient.set(
          this.cacheName,
          key,
          maybeCompressedValue
        );
      }

      if (rsp instanceof CacheSet.Success) {
        return 'OK';
      } else if (rsp instanceof CacheSet.Error) {
        this.emitError('set', rsp.message(), rsp.errorCode());
      } else {
        this.emitError('set', `unexpected-response ${rsp.toString()}`);
      }
    }

    return null;
  }

  async setex(
    key: RedisKey,
    seconds: number | string,
    value: string | Buffer | number
  ): Promise<'OK' | null> {
    return await this.set(key, value, 'EX', seconds);
  }

  async incr(key: RedisKey): Promise<number | null> {
    if (this.useCompression) {
      this.emitError(
        'incr',
        'Increment is not supported when compression is enabled.'
      );
      return null;
    }

    const rsp = await this.momentoClient.increment(this.cacheName, key);
    if (rsp instanceof CacheIncrement.Success) {
      return rsp.value();
    } else if (rsp instanceof CacheIncrement.Error) {
      this.emitError('incr', rsp.message(), rsp.errorCode());
    } else {
      this.emitError('incr', `unexpected-response ${rsp.toString()}`);
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
    const dictionaryName = String(args[0]);

    if (typeof args[1] === 'object') {
      if (args[1] instanceof Map) {
        for (const [key, value] of args[1]) {
          fieldsToSet.set(
            String(key),
            this.useCompression ? await compress(value) : String(value)
          );
        }
      } else {
        fieldsToSet = new Map<string | Uint8Array, string | Uint8Array>();
        if (Array.isArray(args[1])) {
          const list = args[1];
          for (let i = 0; i < list.length; i += 2) {
            fieldsToSet.set(
              String(list[i]),
              this.useCompression
                ? await compress(list[i + 1] as string | Buffer | number)
                : String(list[i + 1])
            );
          }
        } else {
          const entries = Object.entries(args[1]);
          for (const [key, value] of entries) {
            fieldsToSet.set(
              String(key),
              this.useCompression
                ? await compress(value as string | Buffer | number)
                : String(value)
            );
          }
        }
      }
    } else {
      for (let i = 1; i < args.length; i += 2) {
        fieldsToSet.set(
          String(args[i]),
          this.useCompression
            ? await compress(String(args[i + 1]))
            : String(args[i + 1])
        );
      }
    }

    const rsp = await this.momentoClient.dictionarySetFields(
      this.cacheName,
      dictionaryName,
      fieldsToSet
    );

    if (rsp instanceof CacheDictionarySetFields.Success) {
      return fieldsToSet.size;
    } else if (rsp instanceof CacheDictionarySetFields.Error) {
      this.emitError('hset', rsp.message(), rsp.errorCode());
      return 0;
    } else {
      this.emitError('hset', `unexpected-response ${rsp.toString()}`);
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
      fields
    );
    if (rsp instanceof CacheDictionaryGetFields.Hit) {
      if (this.useCompression) {
        const values = [];

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const [_, value] of rsp.valueMapStringUint8Array().entries()) {
          values.push(await decompress(value));
        }
        return values;
      } else {
        return Array.from(rsp.valueMap().values());
      }
    } else if (rsp instanceof CacheDictionaryGetFields.Miss) {
      return [];
    } else if (rsp instanceof CacheDictionaryGetFields.Error) {
      this.emitError('hmget', rsp.message(), rsp.errorCode());
      return [];
    } else {
      this.emitError('hmget', `unexpected-response ${rsp.toString()}`);
      return [];
    }
  }

  async hget(key: RedisKey, field: string | Buffer): Promise<string | null> {
    const rsp = await this.momentoClient.dictionaryGetField(
      this.cacheName,
      String(key),
      field
    );
    if (rsp instanceof CacheDictionaryGetField.Hit) {
      if (this.useCompression) {
        return await decompress(rsp.valueUint8Array());
      } else {
        return rsp.valueString();
      }
    } else if (rsp instanceof CacheDictionaryGetField.Miss) {
      return null;
    } else if (rsp instanceof CacheDictionaryGetField.Error) {
      this.emitError('hget', rsp.message(), rsp.errorCode());
      return null;
    } else {
      this.emitError('hget', `unexpected-response ${rsp.toString()}`);
      return null;
    }
  }

  async hgetall(key: RedisKey): Promise<Record<string, string>> {
    const rsp = await this.momentoClient.dictionaryFetch(
      this.cacheName,
      String(key)
    );
    if (rsp instanceof CacheDictionaryFetch.Hit) {
      const record: Record<string, string> = {};
      for (const [key, value] of rsp.valueMapStringUint8Array().entries()) {
        if (this.useCompression) {
          record[key] = await decompress(value);
        } else {
          record[key] = TEXT_DECODER.decode(value);
        }
      }
      return record;
    } else if (rsp instanceof CacheDictionaryFetch.Miss) {
      return {};
    } else if (rsp instanceof CacheDictionaryFetch.Error) {
      this.emitError('hgetall', rsp.message(), rsp.errorCode());
      return {};
    } else {
      this.emitError('hgetall', `unexpected-response ${rsp.toString()}`);
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
      this.emitError('hdel', `unexpected-response ${rsp.toString()}`);
      return 0;
    }
  }

  async mset(
    ...args: [
      key: RedisKey,
      value: string | Buffer | number,
      ...keyValues: (RedisKey | string | Buffer | number)[]
    ]
  ): Promise<'OK'> {
    if (args.length % 2 !== 0) {
      this.emitError(
        'mset',
        "Wrong number of arguments for 'mset' command",
        MomentoErrorCode.INVALID_ARGUMENT_ERROR
      );
    }

    const keys: RedisKey[] = [];
    const maybeCompressedValues: (string | Promise<Uint8Array>)[] = [];

    for (let i = 0; i < args.length; i += 2) {
      keys.push(args[i] as RedisKey);
      const value = args[i + 1];
      if (this.useCompression) {
        maybeCompressedValues.push(compress(value));
      } else {
        maybeCompressedValues.push(String(value));
      }
    }

    let values: (string | Uint8Array)[];
    if (this.useCompression) {
      values = await Promise.all(maybeCompressedValues);
    } else {
      values = maybeCompressedValues as string[];
    }

    const items = new Map<RedisKey, Uint8Array | string>();
    for (let i = 0; i < keys.length; i++) {
      items.set(
        keys[i],
        this.useCompression ? values[i] : Buffer.from(values[i] as string)
      );
    }

    const rsp = await this.momentoClient.setBatch(this.cacheName, items);
    if (rsp instanceof CacheSetBatch.Success) {
      return 'OK';
    } else if (rsp instanceof CacheSetBatch.Error) {
      this.emitError('mset', rsp.message(), rsp.errorCode());
      return 'OK';
    } else {
      this.emitError('mset', `unexpected-response ${rsp.toString()}`);
      return 'OK';
    }
  }

  async mget(
    ...args: [key: RedisKey, ...keys: RedisKey[]]
  ): Promise<(string | null)[]> {
    const resp = await this.momentoClient.getBatch(this.cacheName, args);

    if (resp instanceof CacheGetBatch.Success) {
      const keyValueRecord = resp.valuesRecordStringUint8Array();
      const maybeCompressedValues: (Uint8Array | null)[] = [];

      for (const key of args) {
        if ((key as string) in keyValueRecord) {
          maybeCompressedValues.push(keyValueRecord[key as string]);
        } else {
          maybeCompressedValues.push(null);
        }
      }

      if (this.useCompression) {
        return await Promise.all(
          maybeCompressedValues.map(async value => {
            if (value !== null) {
              return await decompress(value);
            }
            return null;
          })
        );
      } else {
        return maybeCompressedValues.map(value =>
          value !== null ? new TextDecoder().decode(value) : null
        );
      }
    } else if (resp instanceof CacheGetBatch.Error) {
      this.emitError('mget', resp.message(), resp.errorCode());
    } else {
      this.emitError('mget', `unexpected-response ${resp.toString()}`);
    }
    return [];
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
      this.emitError('ttl', `unexpected-response ${rsp.toString()}`);
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
      this.emitError('ttl', `unexpected-response ${rsp.toString()}`);
    }
    return null;
  }

  async pexpire(
    key: RedisKey,
    milliseconds: number,
    ttlFlagIdentifier?: 'NX' | 'XX' | 'GT' | 'LT'
  ): Promise<number> {
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
        this.emitError('pexpire', `unexpected-response ${rsp.toString()}`);
      }
    }

    return 0;
  }

  async expire(
    key: RedisKey,
    seconds: number,
    ttlFlagIdentifier?: 'NX' | 'XX' | 'GT' | 'LT'
  ): Promise<number> {
    return await this.pexpire(key, seconds * 1000, ttlFlagIdentifier);
  }

  async unlink(...args: [...keys: RedisKey[]]): Promise<number> {
    await this.del(...args);
    return args.length;
  }

  async flushdb(): Promise<'OK'> {
    const rsp = await this.momentoClient.flushCache(this.cacheName);
    if (rsp instanceof CacheFlush.Success) {
      return 'OK';
    } else if (rsp instanceof CacheFlush.Error) {
      this.emitError('flushdb', rsp.message(), rsp.errorCode());
      return 'OK';
    } else {
      this.emitError('flushdb', `unexpected-response ${rsp.toString()}`);
      return 'OK';
    }
  }

  pipeline(commands?: Command[][]): ChainableCommander {
    const pipeline = new Pipeline(this);
    // This is behavior of silently not adding commands and returning empty
    // pipeline if an array is not passed is ported from IORedis initial
    // implementation. Trying to keep behavior the same for now.
    if (Array.isArray(commands)) {
      pipeline.addBatch(commands);
    }
    return pipeline;
  }
}

async function decompress(compressed: Uint8Array): Promise<string> {
  return (await zstd.decompress(Buffer.from(compressed))).toString();
}

async function compress(value: string | Buffer | number): Promise<Uint8Array> {
  const buffer =
    value instanceof Buffer ? value : Buffer.from(value.toString());
  return await zstd.compress(buffer);
}
