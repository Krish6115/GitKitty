import { Hono } from 'hono';
import { HOME_HTML } from './home-page.js';

/** Public landing page: what Kitty is, plus the extension download and install steps. */
export function homeRoute(): Hono {
  const route = new Hono();
  route.get('/', (c) => c.html(HOME_HTML));
  return route;
}
