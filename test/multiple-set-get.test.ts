import {v4} from 'uuid';
import {SetupIntegrationTest} from './integration-setup';

const {client} = SetupIntegrationTest();

describe('multiple get and set', () => {
  it('happy path multiple set', async () => {
    const key1 = v4();
    const key2 = v4();
    const value1 = v4();
    const value2 = v4();

    // Set multiple keys and values
    const resp = await client.mset([
      [key1, value1],
      [key2, value2],
    ]);
    expect(resp).toEqual('OK');

    // Get multiple keys
    const getResp = await client.mget(key1, key2);
    expect(getResp).toEqual([value1, value2]);
  });
});
