import {SetupIntegrationTest} from './integration-setup';
import {v4} from 'uuid';

const {client} = SetupIntegrationTest();

describe('pipelines', () => {
  it('should be able to run with chaining commands commands', async () => {
    const key1 = v4();
    const key2 = v4();
    const value1 = v4();
    const value2 = v4();
    const dictionaryName = v4();

    await client
      .pipeline()
      .hset(dictionaryName, key1, value1)
      .hset(dictionaryName, key2, value2)
      .set(key1, value1)
      .set(key2, value2)
      .exec();

    const results = await client
      .pipeline()
      .hget(dictionaryName, key1)
      .hget(dictionaryName, key2)
      .get(key1)
      .get(key2)
      .exec();

    expect(results).toEqual([value1, value2, value1, value2]);
  });
  it('should be able to run with batch load commands', async () => {
    const key1 = v4();
    const key2 = v4();
    const value1 = v4();
    const value2 = v4();
    const dictionaryName = v4();

    await client
      .pipeline([
        ['hset', dictionaryName, key1, value1],
        ['hset', dictionaryName, key2, value2],
        ['set', key1, value1],
        ['set', key2, value2],
      ])
      .exec();

    const results = await client
      .pipeline([
        ['hget', dictionaryName, key1],
        ['hget', dictionaryName, key2],
        ['get', key1],
        ['get', key2],
      ])
      .exec();

    expect(results).toEqual([value1, value2, value1, value2]);
  });

  it('you should be able to mix commands', async () => {
    const key1 = v4();
    const key2 = v4();
    const key3 = v4();
    const key4 = v4();
    const value1 = v4();
    const value2 = v4();
    const value3 = v4();
    const value4 = v4();
    const dictionaryName = v4();

    await client
      .pipeline([
        ['hset', dictionaryName, key1, value1],
        ['hset', dictionaryName, key2, value2],
        ['set', key3, value3],
        ['set', key4, value4],
      ])
      .hset(dictionaryName, key1, value1)
      .hset(dictionaryName, key2, value2)
      .set(key3, value3)
      .set(key4, value4)
      .exec();

    const results = await client
      .pipeline([
        ['hget', dictionaryName, key1],
        ['hget', dictionaryName, key2],
        ['get', key3],
        ['get', key4],
      ])
      .hget(dictionaryName, key1)
      .hget(dictionaryName, key2)
      .get(key3)
      .get(key4)
      .exec();

    expect(results).toEqual([
      value1,
      value2,
      value3,
      value4,
      value1,
      value2,
      value3,
      value4,
    ]);
  });
  it('throws an error when using an un supported command', async () => {
    try {
      await client.pipeline([['UNSUPPORTED_CMD']]).exec();
    } catch (err) {
      if (process.env.MOMENTO_ENABLED === 'true') {
        expect(err).toEqual(
          new Error('Un-Supported Command Passed: UNSUPPORTED_CMD')
        );
      } else {
        expect(err).toEqual(
          new TypeError("Cannot read properties of undefined (reading 'apply')")
        );
      }
    }
  });
});
