// Repo tours saved in chrome.storage.local so they can be resumed after the browser restarts.
import type { TourState } from './tour';

export const SAVED_TOURS_KEY = 'kitty:saved-tours';
export const MAX_SAVED_TOURS = 10;

export interface SavedTour {
  state: TourState;
  savedAt: number;
}
export type SavedTours = Record<string, SavedTour>;

const keyOf = (owner: string, repo: string): string => `${owner}/${repo}`.toLowerCase();

/** Only finished repo tours are saved (not issue or PR walkthroughs, and not one still being written). */
export const isResumable = (s: TourState): boolean => !s.streaming && !s.result.meta.issue && !s.result.meta.pr && s.steps.length > 0;

/** Save (or update) a repo's tour, keeping the most recent MAX_SAVED_TOURS repos. */
export function rememberTour(all: SavedTours, s: TourState, now: number): SavedTours {
  if (!isResumable(s)) return all;
  const next: SavedTours = { ...all, [keyOf(s.owner, s.repo)]: { state: s, savedAt: now } };
  const keep = Object.entries(next).sort((a, b) => b[1].savedAt - a[1].savedAt).slice(0, MAX_SAVED_TOURS);
  return Object.fromEntries(keep);
}

export function forgetTour(all: SavedTours, owner: string, repo: string): SavedTours {
  const rest = { ...all };
  delete rest[keyOf(owner, repo)];
  return rest;
}

export const savedTourFor = (all: SavedTours, owner: string, repo: string): TourState | null => all[keyOf(owner, repo)]?.state ?? null;

/**
 * Whether a saved tour can be resumed: yes at the same commit, no once the default branch has moved on.
 * When the current commit is unknown (e.g. GitHub's rate limit), the saved tour is still offered.
 */
export const canResume = (saved: TourState, currentSha: string | null): boolean => currentSha === null || currentSha === saved.sha;

async function loadAll(): Promise<SavedTours> {
  return ((await chrome.storage.local.get(SAVED_TOURS_KEY))[SAVED_TOURS_KEY] as SavedTours | undefined) ?? {};
}

export async function saveTourForLater(s: TourState): Promise<void> {
  if (!isResumable(s)) return;
  await chrome.storage.local.set({ [SAVED_TOURS_KEY]: rememberTour(await loadAll(), s, Date.now()) });
}

export async function dropSavedTour(owner: string, repo: string): Promise<void> {
  await chrome.storage.local.set({ [SAVED_TOURS_KEY]: forgetTour(await loadAll(), owner, repo) });
}

export async function loadSavedTour(owner: string, repo: string): Promise<TourState | null> {
  return savedTourFor(await loadAll(), owner, repo);
}

/** The default branch's current commit, or null when GitHub can't be asked. */
export async function currentSha(owner: string, repo: string, branch = 'HEAD'): Promise<string | null> {
  try {
    const r = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits/${encodeURIComponent(branch)}`, { headers: { Accept: 'application/vnd.github.sha' } });
    if (!r.ok) return null;
    const sha = (await r.text()).trim();
    return /^[0-9a-f]{40}$/.test(sha) ? sha : null;
  } catch {
    return null;
  }
}
