import {SetupIntegrationTest} from './integration-setup';
import {v4} from 'uuid';

const {client} = SetupIntegrationTest();

describe('ttl', () => {
  it('happy path ttl', async () => {
    const key = v4();
    const value = v4();

    // Set initial key value with a 5 seconds expiration
    await client.set(key, value, 'EX', 5);

    // Get ttl of key
    const ttlResp = await client.ttl(key);
    expect(ttlResp).toBeGreaterThan(2);
  });

  it('happy path pttl', async () => {
    const key = v4();
    const value = v4();

    // Set initial key value with a 5000 milliseconds expiration
    await client.set(key, value, 'EX', 5);

    // Get ttl of key
    const pttlResp = await client.pttl(key);
    expect(pttlResp).toBeGreaterThan(2000);
  });
});
