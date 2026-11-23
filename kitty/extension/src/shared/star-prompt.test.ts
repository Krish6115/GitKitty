import { describe, expect, it } from 'vitest';
import { addHelp, ASK_AFTER, NEW_PROMPT, shouldAsk } from './star-prompt';

describe('star prompt', () => {
  it('asks only after Kitty has helped a few times', () => {
    let s = NEW_PROMPT;
    for (let i = 1; i < ASK_AFTER; i++) {
      s = addHelp(s);
      expect(shouldAsk(s)).toBe(false);
    }
    expect(shouldAsk(addHelp(s))).toBe(true);
  });

  it('never asks again once closed', () => {
    const closed = { helped: ASK_AFTER, closed: true };
    expect(shouldAsk(closed)).toBe(false);
    expect(addHelp(closed)).toBe(closed);
  });

  it('stops counting once it is enough to ask', () => {
    const ready = { helped: ASK_AFTER, closed: false };
    expect(addHelp(ready)).toBe(ready);
  });
});
