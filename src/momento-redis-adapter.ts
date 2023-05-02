import EventEmitter from 'stream';
import {
  CacheClient,
  CacheDelete,
  CacheGet,
  CacheSet,
  CacheSetIfNotExists,
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

  del(...args: [...keys: RedisKey[]]): Promise<number>;

  quit(): Promise<'OK'>;
}

export class MomentoRedisAdapter
  extends EventEmitter
  implements MomentoIORedis
{
  momentoClient: CacheClient;
  cacheName: string;

  constructor(momentoClient: CacheClient, cacheName: string) {
    super();
    this.momentoClient = momentoClient;
    this.cacheName = cacheName;
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
      return rsp.valueString();
    } else if (rsp instanceof CacheGet.Miss) {
      return null;
    } else if (rsp instanceof CacheGet.Error) {
      this.emitError('get', rsp.message(), rsp.errorCode());
    } else {
      this.emitError('get', 'unexpected-response');
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
      let rsp: CacheSetIfNotExists.Response;
      if (parsedTTl > -1) {
        rsp = await this.momentoClient.setIfNotExists(
          this.cacheName,
          key,
          value.toString(),
          {
            ttl: parsedTTl,
          }
        );
      } else {
        rsp = await this.momentoClient.setIfNotExists(
          this.cacheName,
          key,
          value.toString()
        );
      }

      if (rsp instanceof CacheSetIfNotExists.Stored) {
        return 'OK';
      } else if (rsp instanceof CacheSetIfNotExists.NotStored) {
        return null;
      } else if (rsp instanceof CacheSetIfNotExists.Error) {
        this.emitError('set-not-exists', rsp.message(), rsp.errorCode());
      } else {
        this.emitError('set-not-exists', 'unexpected-response');
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
          value.toString()
        );
      }

      if (rsp instanceof CacheSet.Success) {
        return 'OK';
      } else if (rsp instanceof CacheSet.Error) {
        this.emitError('set', rsp.message(), rsp.errorCode());
      } else {
        this.emitError('set', 'unexpected-response');
      }
    }

    return null;
  }
}
