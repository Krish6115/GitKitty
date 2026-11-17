import { describe, expect, it } from 'vitest';
import { panelTheme } from './panel-theme';

describe('panelTheme', () => {
  it('uses a fixed setting over GitHub and the OS', () => {
    expect(panelTheme('light', 'dark', true)).toBe('light');
    expect(panelTheme('dark', 'light', false)).toBe('dark');
  });
  it('follows GitHub by default', () => {
    expect(panelTheme(undefined, 'dark', false)).toBe('dark');
    expect(panelTheme('github', 'light', true)).toBe('light');
  });
  it('falls back to the OS when GitHub has not been seen yet', () => {
    expect(panelTheme('github', undefined, true)).toBe('dark');
    expect(panelTheme(undefined, 'weird', false)).toBe('light');
  });
});
