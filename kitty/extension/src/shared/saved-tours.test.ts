import { describe, expect, it } from 'vitest';
import { canResume, forgetTour, MAX_SAVED_TOURS, rememberTour, savedTourFor, type SavedTours } from './saved-tours';
import type { TourState } from './tour';

const state = (owner: string, repo: string, extra: Partial<TourState> = {}, meta: Record<string, unknown> = {}): TourState => ({
  owner, repo, sha: 'a'.repeat(40), partial: false, currentIndex: 3,
  steps: [{ path: 'README.md', title: 't', what: 'w', why_it_matters: 'y' }],
  result: {
    tour: { summary: '', stack: [], steps: [], how_to_run: '', how_to_contribute: '', good_first_issue_tips: [] },
    meta: { owner, repo, sha: 'a'.repeat(40), partial: false, cached: false, provider: '', repaired: false, droppedSteps: [], unreadableFiles: 0, ...meta },
  },
  ...extra,
});

describe('saved tours', () => {
  it('saves and restores a repo tour at its step, case-insensitively', () => {
    const all = rememberTour({}, state('Acme', 'Web'), 1);
    expect(savedTourFor(all, 'acme', 'web')?.currentIndex).toBe(3);
  });

  it('skips tours still streaming and issue or PR walkthroughs', () => {
    expect(rememberTour({}, state('a', 'b', { streaming: true }), 1)).toEqual({});
    expect(rememberTour({}, state('a', 'b', {}, { issue: { number: 1, title: '', url: '', labels: [] } }), 1)).toEqual({});
    expect(rememberTour({}, state('a', 'b', {}, { pr: { number: 2, title: '', url: '' } }), 1)).toEqual({});
  });

  it('keeps only the most recent repos', () => {
    let all: SavedTours = {};
    for (let i = 0; i < MAX_SAVED_TOURS + 3; i++) all = rememberTour(all, state('o', `r${i}`), i);
    expect(Object.keys(all)).toHaveLength(MAX_SAVED_TOURS);
    expect(savedTourFor(all, 'o', 'r0')).toBeNull();
    expect(savedTourFor(all, 'o', `r${MAX_SAVED_TOURS + 2}`)).not.toBeNull();
  });

  it('forgets a finished or exited tour', () => {
    const all = rememberTour(rememberTour({}, state('a', 'b'), 1), state('c', 'd'), 2);
    const left = forgetTour(all, 'A', 'B');
    expect(savedTourFor(left, 'a', 'b')).toBeNull();
    expect(savedTourFor(left, 'c', 'd')).not.toBeNull();
  });

  it('resumes only at the same commit, or when the commit is unknown', () => {
    const s = state('a', 'b');
    expect(canResume(s, 'a'.repeat(40))).toBe(true);
    expect(canResume(s, 'b'.repeat(40))).toBe(false);
    expect(canResume(s, null)).toBe(true);
  });
});
