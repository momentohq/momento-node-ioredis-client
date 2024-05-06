import {SetupIntegrationTest} from './integration-setup';
import {v4} from 'uuid';

const {client} = SetupIntegrationTest();

describe('pexpire', () => {
  it('should update ttl using pexpire when no flags are specified', async () => {
    const key = v4();
    const value = v4();

    // Set initial key value
    await client.set(key, value);

    // Set ttl of key
    const pexpireRsp = await client.pexpire(key, 5000);
    expect(pexpireRsp).toBe(1);

    // Get ttl of key
    const ttlResp = await client.pttl(key);
    expect(ttlResp).toBeGreaterThan(2000);
  });

  it('should overwrite ttl using pexpire when no flags are specified', async () => {
    const key = v4();
    const value = v4();

    // Set initial key value
    await client.set(key, value, 'EX', 5);

    // Set ttl of key
    const pexpireRsp = await client.pexpire(key, 10000);
    expect(pexpireRsp).toBe(1);

    // Get ttl of key
    const ttlResp = await client.pttl(key);
    expect(ttlResp).toBeGreaterThan(5000);
  });

  it('should not update ttl using pexpire with nx flag when key exists when momento enabled', async () => {
    if (process.env.MOMENTO_ENABLED === 'true') {
      const key = v4();
      const value = v4();

      // Set initial key value
      await client.set(key, value);

      // Set ttl of key using nx flag
      const pexpireRsp = await client.pexpire(key, 5000, 'NX');
      expect(pexpireRsp).toBe(0);
    }
  });

  it('should update ttl using pexpire with nx flag when key exists with no ttl when redis enabled', async () => {
    if (process.env.REDIS_ENABLED === 'true') {
      const key = v4();
      const value = v4();

      // Set initial key value
      await client.set(key, value);

      // Set ttl of key using nx flag
      const pexpireRsp = await client.pexpire(key, 5000, 'NX');
      expect(pexpireRsp).toBe(1);
    }
  });

  it('should not update ttl using pexpire with nx flag when key exists and ttl on key exists', async () => {
    const key = v4();
    const value = v4();

    // Set initial key value
    await client.set(key, value, 'EX', 5);

    // Set ttl of key using nx flag
    const pexpireRsp = await client.pexpire(key, 10000, 'NX');
    expect(pexpireRsp).toBe(0);
  });

  it('should not update ttl when pexpire with nx flag when key does not exist', async () => {
    const key = v4();
    const key1 = v4();
    const value = v4();

    // Set initial key value
    await client.set(key, value, 'EX', 5);

    // Set ttl of key using nx flag
    const pexpireRsp = await client.pexpire(key1, 10000, 'NX');
    expect(pexpireRsp).toBe(0);
  });

  it('should update ttl using pexpire with xx flag is specified when key exists and ttl on key exits', async () => {
    const key = v4();
    const value = v4();

    // Set initial key value
    await client.set(key, value, 'EX', 5);

    // Set ttl of key using xx flag
    const pexpireRsp = await client.pexpire(key, 10000, 'XX');
    expect(pexpireRsp).toBe(1);
  });

  it('should not update ttl using pexpire with xx flag when key does not exist', async () => {
    const key = v4();
    const key1 = v4();
    const value = v4();

    // Set initial key value
    await client.set(key, value, 'EX', 5);

    // Set ttl of key using xx flag
    const pexpireRsp = await client.pexpire(key1, 10000, 'XX');
    expect(pexpireRsp).toBe(0);
  });

  it('should update ttl using pexpire with gt flag when key exists and new expiry is greater than current one', async () => {
    const key = v4();
    const value = v4();

    // Set initial key value
    await client.set(key, value, 'EX', 5);

    // Set ttl of key using gt flag
    const pexpireRsp = await client.pexpire(key, 10000, 'GT');
    expect(pexpireRsp).toBe(1);
  });

  it('should not update ttl using pexpire with gt flag when key exists and new expiry is less than the current one', async () => {
    const key = v4();
    const value = v4();

    // Set initial key value
    await client.set(key, value, 'EX', 10);

    // Set ttl of key using gt flag
    const pexpireRsp = await client.pexpire(key, 5000, 'GT');
    expect(pexpireRsp).toBe(0);
  });

  it('should not update ttl using pexpire with gt flag when key does not exist', async () => {
    const key = v4();
    const key1 = v4();
    const value = v4();

    // Set initial key value
    await client.set(key, value, 'EX', 10);

    // Set ttl of key using gt flag
    const pexpireRsp = await client.pexpire(key1, 5000, 'GT');
    expect(pexpireRsp).toBe(0);
  });

  it('should update ttl using pexpire with lt flag when key exists and new expiry is less than current one', async () => {
    const key = v4();
    const value = v4();

    // Set initial key value
    await client.set(key, value, 'EX', 10);

    // Set ttl of key using lt flag
    const pexpireRsp = await client.pexpire(key, 5000, 'LT');
    expect(pexpireRsp).toBe(1);
  });

  it('should not update ttl using pexpire with lt flag when key exists and new expiry is greater than current one', async () => {
    const key = v4();
    const value = v4();

    // Set initial key value
    await client.set(key, value, 'EX', 5);

    // Set ttl of key using lt flag
    const pexpireRsp = await client.pexpire(key, 10000, 'LT');
    expect(pexpireRsp).toBe(0);
  });

  it('should not update ttl using pexpire with lt flag when key does not exist', async () => {
    const key = v4();
    const key1 = v4();
    const value = v4();

    // Set initial key value
    await client.set(key, value, 'EX', 5);

    // Set ttl of key using lt flag
    const pexpireRsp = await client.pexpire(key1, 10000, 'LT');
    expect(pexpireRsp).toBe(0);
  });
});

describe('expire', () => {
  it('should update ttl using expire when no flags are specified', async () => {
    const key = v4();
    const value = v4();

    // Set initial key value
    await client.set(key, value);

    // Set ttl of key
    const expireRsp = await client.expire(key, 5);
    expect(expireRsp).toBe(1);

    // Get ttl of key
    const ttlResp = await client.ttl(key);
    expect(ttlResp).toBeGreaterThan(2);
  });

  it('should overwrite ttl using expire when no flags are specified', async () => {
    const key = v4();
    const value = v4();

    // Set initial key value
    await client.set(key, value, 'EX', 5);

    // Set ttl of key
    const expireRsp = await client.expire(key, 10);
    expect(expireRsp).toBe(1);

    // Get ttl of key
    const ttlResp = await client.ttl(key);
    expect(ttlResp).toBeGreaterThan(5);
  });

  it('should not update ttl using expire with nx flag when key exists when momento enabled', async () => {
    if (process.env.MOMENTO_ENABLED === 'true') {
      const key = v4();
      const value = v4();

      // Set initial key value
      await client.set(key, value);

      // Set ttl of key using nx flag
      const expireRsp = await client.expire(key, 5, 'NX');
      expect(expireRsp).toBe(0);
    }
  });

  it('should update ttl using expire with nx flag when key exists with no ttl when redis enabled', async () => {
    if (process.env.REDIS_ENABLED === 'true') {
      const key = v4();
      const value = v4();

      // Set initial key value
      await client.set(key, value);

      // Set ttl of key using nx flag
      const expireRsp = await client.expire(key, 5, 'NX');
      expect(expireRsp).toBe(1);
    }
  });

  it('should not update ttl using expire with nx flag when key exists and ttl on key exists', async () => {
    const key = v4();
    const value = v4();

    // Set initial key value
    await client.set(key, value, 'EX', 5);

    // Set ttl of key using nx flag
    const expireRsp = await client.expire(key, 10, 'NX');
    expect(expireRsp).toBe(0);
  });

  it('should not update ttl when expire with nx flag when key does not exist', async () => {
    const key = v4();
    const key1 = v4();
    const value = v4();

    // Set initial key value
    await client.set(key, value, 'EX', 5);

    // Set ttl of key using nx flag
    const expireRsp = await client.expire(key1, 10, 'NX');
    expect(expireRsp).toBe(0);
  });

  it('should update ttl using expire with xx flag is specified when key exists and ttl on key exits', async () => {
    const key = v4();
    const value = v4();

    // Set initial key value
    await client.set(key, value, 'EX', 5);

    // Set ttl of key using xx flag
    const expireRsp = await client.expire(key, 10, 'XX');
    expect(expireRsp).toBe(1);
  });

  it('should not update ttl using expire with xx flag when key does not exist', async () => {
    const key = v4();
    const key1 = v4();
    const value = v4();

    // Set initial key value
    await client.set(key, value, 'EX', 5);

    // Set ttl of key using xx flag
    const expireRsp = await client.expire(key1, 10, 'XX');
    expect(expireRsp).toBe(0);
  });

  it('should update ttl using expire with gt flag when key exists and new expiry is greater than current one', async () => {
    const key = v4();
    const value = v4();

    // Set initial key value
    await client.set(key, value, 'EX', 5);

    // Set ttl of key using gt flag
    const expireRsp = await client.expire(key, 10, 'GT');
    expect(expireRsp).toBe(1);
  });

  it('should not update ttl using expire with gt flag when key exists and new expiry is less than the current one', async () => {
    const key = v4();
    const value = v4();

    // Set initial key value
    await client.set(key, value, 'EX', 10);

    // Set ttl of key using gt flag
    const expireRsp = await client.expire(key, 5, 'GT');
    expect(expireRsp).toBe(0);
  });

  it('should not update ttl using expire with gt flag when key does not exist', async () => {
    const key = v4();
    const key1 = v4();
    const value = v4();

    // Set initial key value
    await client.set(key, value, 'EX', 10);

    // Set ttl of key using gt flag
    const expireRsp = await client.expire(key1, 5, 'GT');
    expect(expireRsp).toBe(0);
  });

  it('should update ttl using expire with lt flag when key exists and new expiry is less than current one', async () => {
    const key = v4();
    const value = v4();

    // Set initial key value
    await client.set(key, value, 'EX', 10);

    // Set ttl of key using lt flag
    const expireRsp = await client.expire(key, 5, 'LT');
    expect(expireRsp).toBe(1);
  });

  it('should not update ttl using expire with lt flag when key exists and new expiry is greater than current one', async () => {
    const key = v4();
    const value = v4();

    // Set initial key value
    await client.set(key, value, 'EX', 5);

    // Set ttl of key using lt flag
    const expireRsp = await client.expire(key, 10, 'LT');
    expect(expireRsp).toBe(0);
  });

  it('should not update ttl using expire with lt flag when key does not exist', async () => {
    const key = v4();
    const key1 = v4();
    const value = v4();

    // Set initial key value
    await client.set(key, value, 'EX', 5);

    // Set ttl of key using lt flag
    const expireRsp = await client.expire(key1, 10, 'LT');
    expect(expireRsp).toBe(0);
  });
});
