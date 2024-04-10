import {SetupIntegrationTest} from './integration-setup';
import {v4} from 'uuid';

const {client} = SetupIntegrationTest();

describe('hash', () => {
  it('should return an empty object on a missing hash', async () => {
    const key = v4();
    const result = await client.hgetall(key);
    expect(result).toEqual({});
  });

  it('should accept a string field and string value pair on hset', async () => {
    const key = v4();
    const field = v4();
    const value = v4();
    const result = await client.hset(key, field, value);
    expect(result).toBe(1);

    const getAllResult = await client.hgetall(key);
    expect(getAllResult).toEqual({[field]: value});
  });

  it('should support hmset for backwards compatibility', async () => {
    const key = v4();
    const field = v4();
    const value = v4();
    const result = await client.hmset(key, field, value);
    expect(result).toBe("OK");

    const getAllResult = await client.hgetall(key);
    expect(getAllResult).toEqual({[field]: value});
  });

  it('should accept a number field and string value pair on hset', async () => {
    const key = v4();
    const field = 42;
    const value = v4();
    const result = await client.hset(key, field, value);
    expect(result).toBe(1);

    const getResult = await client.hgetall(key);
    expect(getResult).toEqual({[field]: value});
  });

  it('should accept a string field and buffer value pair on hset', async () => {
    const key = v4();
    const field = v4();
    const value = Buffer.from(v4());
    const result = await client.hset(key, field, value);
    expect(result).toBe(1);

    const getResult = await client.hgetall(
      key
    );
    expect(getResult).toEqual({[field]: String(value)});
  });

  it('should accept a number field and buffer value pair on hset', async () => {
    const key = v4();
    const field = 42;
    const value = Buffer.from(v4());
    const result = await client.hset(key, field, value);
    expect(result).toBe(1);

    const getResult = await client.hgetall(
      key
    );
    expect(getResult).toEqual({[field]: String(value)});
  });

  it('should accept a Record<string, string> object on hset', async () => {
    const key = v4();
    const field = v4();
    const value = v4();
    const field2 = v4();
    const value2 = v4();
    const obj = {[field]: value, [field2]: value2};
    const result = await client.hset(key, obj);
    expect(result).toBe(2);

    const getAllResult = await client.hgetall(key);
    expect(getAllResult).toEqual(obj);

    const getResult = await client.hget(key, field);
    expect(getResult).toEqual(value);

    const mgetResult = await client.hmget(key, field, field2);
    expect(mgetResult).toEqual([value, value2]);
  });

  it('should accept a Map<string, string> instance on hset', async () => {
    const key = v4();
    const field = v4();
    const value = v4();
    const field2 = v4();
    const value2 = v4();
    const map = new Map<string, string>([
      [field, value],
      [field2, value2],
    ]);
    const result = await client.hset(key, map);
    expect(result).toBe(2);

    const getResult = await client.hgetall(key);
    expect(getResult).toEqual(Object.fromEntries(map));
  });
  it('should accept a generic object input on hset', async () => {
    const key = v4();
    const field = v4();
    const value = v4();
    const field2 = v4();
    const value2 = v4();
    const objectToSet = {
      [field]: value,
      [field2]: value2
    };
    const result = await client.hset(key, objectToSet);
    expect(result).toBe(2);

    const getResult = await client.hgetall(key);
    expect(getResult).toEqual(objectToSet);
  });

  it('should support deleting fields', async () => {
    const key = v4();
    const field = v4();
    const value = v4();
    const field2 = v4();
    const value2 = v4();
    const objectToSet = {
      [field]: value,
      [field2]: value2
    };
    const result = await client.hset(key, objectToSet);
    expect(result).toBe(2);

    await client.hdel(key, field2)
    const getResult = await client.hgetall(key);
    expect(getResult[value2]).toBeUndefined()
  });
});
