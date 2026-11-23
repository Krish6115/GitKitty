import { describe, expect, it } from 'vitest';
import { formatWait } from './Waiting';

describe('formatWait', () => {
  it('shows seconds, then minutes and seconds', () => {
    expect(formatWait(9)).toBe('9s');
    expect(formatWait(65)).toBe('1:05');
    expect(formatWait(180)).toBe('3:00');
  });
});
