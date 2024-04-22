import {v4} from 'uuid';
import {SetupIntegrationTest} from './integration-setup';

const {client} = SetupIntegrationTest();

describe('multiple get and set', () => {
  it('happy path multiple set and get', async () => {
    const key1 = v4();
    const key2 = v4();
    const value1 = v4();
    const value2 = v4();

    // Set multiple keys and values
    const resp = await client.mset(key1, value1, key2, value2);
    expect(resp).toEqual('OK');

    // Get multiple keys
    const getResp = await client.mget(key1, key2);
    expect(getResp).toEqual([value1, value2]);
  });

  it('should return null for keys that do not exist', async () => {
    const key1 = v4();
    const key2 = v4();
    const value = v4();

    // Set a key and value
    const resp = await client.mset(key1, value);
    expect(resp).toEqual('OK');

    // Get multiple keys
    const getResp = await client.mget(key1, key2);
    expect(getResp).toEqual([value, null]);
  });

  it('should emit error when wrong number of arguments provided', async () => {
    const key1 = v4();
    const key2 = v4();
    const value = v4();

    // Set a key and value
    try {
      await client.mset(key1, value, key2);
    } catch (error) {
      if (process.env.MOMENTO_ENABLED === 'true') {
        const momentoError = error as {
          code: string;
          context: {code: string; msg: string; op: string; platform: string};
        };
        expect(momentoError.code).toBe('ERR_UNHANDLED_ERROR');
        expect(momentoError.context.code).toBe('INVALID_ARGUMENT_ERROR');
        expect(momentoError.context.msg).toBe(
          "Wrong number of arguments for 'mset' command"
        );
        expect(momentoError.context.op).toBe('mset');
        expect(momentoError.context.platform).toBe('momento');
      } else {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe(
          "ERR wrong number of arguments for 'mset' command"
        );
      }
    }
  });
});
