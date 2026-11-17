// The side panel's light/dark theme: follows GitHub's own setting by default, or a fixed choice from Settings.

export type Theme = 'light' | 'dark';
export type ThemeSetting = 'github' | 'light' | 'dark';

/** chrome.storage.session key where the content script stores GitHub's effective theme. */
export const GITHUB_THEME_KEY = 'kitty:github-theme';

export const isTheme = (t: unknown): t is Theme => t === 'light' || t === 'dark';

/** Pick the panel theme: a fixed setting wins, then GitHub's last seen theme, then the OS preference. */
export function panelTheme(setting: ThemeSetting | undefined, github: unknown, prefersDark: boolean): Theme {
  if (setting === 'light' || setting === 'dark') return setting;
  if (isTheme(github)) return github;
  return prefersDark ? 'dark' : 'light';
}
