import {SetupIntegrationTest} from './integration-setup';
import {v4} from 'uuid';

const {client} = SetupIntegrationTest();

describe('flush', () => {
  it('happy path flush', async () => {
    const key = v4();
    const value = v4();

    // Set initial value w/ long ttl
    await client.set(key, value, 'EX', 1000);

    // Flush cache
    await client.flushdb();

    // Get key that was set and ensure its a miss
    const rsp = await client.get(key);

    expect(rsp).toBeNull();
  });
});
