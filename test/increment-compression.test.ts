import {v4} from 'uuid';

import {SetupIntegrationTest} from './integration-setup';

const {client, compression} = SetupIntegrationTest();

describe('increment, with compression client', () => {
  it('should return error saying compression not supported', async () => {
    if (compression) {
      const key = v4();
      const value = 5;

      // Set initial key value
      await client.set(key, value);

      // Increment the value of the key
      try {
        await client.incr(key);
      } catch (error) {
        const momentoError = error as {
          code: string;
          context: {code: string; msg: string; op: string; platform: string};
        };
        expect(momentoError.context.op).toBe('incr');
        expect(momentoError.context.platform).toBe('momento');
        expect(momentoError.context.msg).toBe(
          'Increment is not supported when compression is enabled.'
        );
      }
    }
  });
});
