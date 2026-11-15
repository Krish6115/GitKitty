import { describe, expect, it } from 'vitest';
import manifest from '../manifest.config';

describe('manifest commands', () => {
  it('defines _execute_action shortcut with Alt+K default and MacCtrl+K on mac', async () => {
    const fnOrObj = typeof manifest === 'function' ? manifest({ mode: 'production', command: 'build' }) : manifest;
    const resolved = await fnOrObj;
    expect(resolved.commands).toBeDefined();
    expect(resolved.commands?._execute_action).toMatchObject({
      suggested_key: {
        default: 'Alt+K',
        mac: 'MacCtrl+K',
      },
    });
  });
});
