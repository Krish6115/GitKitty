import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json' with { type: 'json' };

// The localhost server is only allowed in development and e2e builds, never in the release (Web Store) build.
export default defineManifest(({ mode }) => ({
  manifest_version: 3,
  name: 'GitKitty: Learn Git and GitHub',
  description: 'A pixel cat on github.com that tours any repo, explains commands, diffs and pull requests, and teaches Git step by step.',
  version: pkg.version,
  icons: { 16: 'icons/icon-16.png', 32: 'icons/icon-32.png', 48: 'icons/icon-48.png', 128: 'icons/icon-128.png' },
  action: { default_title: 'Kitty', default_icon: { 16: 'icons/icon-16.png', 32: 'icons/icon-32.png', 48: 'icons/icon-48.png', 128: 'icons/icon-128.png' } },
  background: { service_worker: 'src/background/index.ts', type: 'module' },
  side_panel: { default_path: 'src/sidepanel/index.html' },
  permissions: ['sidePanel', 'storage', 'contextMenus'],
  commands: {
    _execute_action: {
      suggested_key: {
        default: 'Alt+K',
        mac: 'MacCtrl+K',
      },
    },
  },
  // Kitty's server, and github.com so the First PR guide can read the active tab's URL (content scripts already run there)
  host_permissions: ['https://kitty-server.vercel.app/*', 'https://github.com/*', ...(mode === 'production' ? [] : ['http://localhost:8787/*'])],
  content_scripts: [
    { matches: ['https://github.com/*'], js: ['src/content/index.tsx'], run_at: 'document_idle' },
  ],
}));
