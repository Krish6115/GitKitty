import { describe, expect, it } from 'vitest';
import { createApp } from '../src/create-app.js';
import { loadEnv } from '../src/env.js';

describe('public pages', () => {
  const app = createApp(loadEnv({}));

  it('serves the landing page with a link to the privacy policy', async () => {
    const res = await app.request('/');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    expect(await res.text()).toContain('href="/privacy"');
  });

  it('serves the privacy policy', async () => {
    const res = await app.request('/privacy');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('<title>GitKitty privacy policy</title>');
    expect(html).toContain('Limited Use');
  });
});
