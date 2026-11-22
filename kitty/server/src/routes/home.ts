import { Hono } from 'hono';
import { HOME_HTML } from './home-page.js';
import { PRIVACY_HTML } from './privacy-page.js';

/** Public pages: the landing page (what Kitty is, download and install steps) and the privacy policy. */
export function homeRoute(): Hono {
  const route = new Hono();
  route.get('/', (c) => c.html(HOME_HTML));
  route.get('/privacy', (c) => c.html(PRIVACY_HTML));
  return route;
}
