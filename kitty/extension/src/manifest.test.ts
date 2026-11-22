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

  const resolve = async (mode: string) => await (typeof manifest === 'function' ? manifest({ mode, command: 'build' }) : manifest);

  it('only allows the localhost server outside release builds', async () => {
    const release = (await resolve('production')).host_permissions ?? [];
    expect(release).toContain('https://kitty-server.vercel.app/*');
    expect(release).toContain('https://github.com/*');
    expect(release.some((p: string) => p.includes('localhost'))).toBe(false);
    expect((await resolve('e2e')).host_permissions).toContain('http://localhost:8787/*');
  });

  it('fits the Chrome Web Store limits for name and description', async () => {
    const m = await resolve('production');
    expect(m.name.length).toBeLessThanOrEqual(75);
    expect((m.description ?? '').length).toBeLessThanOrEqual(132);
  });
});
