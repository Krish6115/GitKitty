// Issue search across GitHub can't filter by the repo's popularity or activity, so tiny or abandoned repos
// crowd the results. This re-ranks the top search results by their repo's stars and last push, and drops archived repos.
import type { BeginnerIssue } from './issues.js';
import type { RepoInfo } from './client.js';

const DAY = 86_400_000;

/** Extra score for an issue's repo: up to +12 for stars, +3 for a push this month, -4 after a quiet year. null = archived. */
export function repoBoost(info: RepoInfo, now: number): number | null {
  if (info.archived) return null;
  let boost = Math.min(12, Math.log10(info.stargazers_count + 1) * 3);
  const pushed = info.pushed_at ? now - Date.parse(info.pushed_at) : null;
  if (pushed !== null) {
    if (pushed < 30 * DAY) boost += 3;
    else if (pushed < 180 * DAY) boost += 1;
    else if (pushed > 365 * DAY) boost -= 4;
  }
  return Math.round(boost * 10) / 10;
}

export type RankedIssue = BeginnerIssue & { stars?: number };

/**
 * Re-rank issues by their repo. `repos` maps "owner/name" (lower case) to the repo, or null when it couldn't be read;
 * issues from unread repos keep their own score. Returns the top `limit`, at most `perRepo` from one repo.
 */
export function rerankByRepo(issues: BeginnerIssue[], repos: Map<string, RepoInfo | null>, now: number, limit = 5, perRepo = 2): RankedIssue[] {
  const ranked: RankedIssue[] = [];
  for (const i of issues) {
    const info = repos.get(i.repo.toLowerCase());
    if (!info) {
      ranked.push(i);
      continue;
    }
    const boost = repoBoost(info, now);
    if (boost === null) continue;
    const reasons = info.stargazers_count >= 100 ? [...i.reasons, `${info.stargazers_count.toLocaleString('en-US')} stars`] : i.reasons;
    ranked.push({ ...i, score: Math.round((i.score + boost) * 10) / 10, stars: info.stargazers_count, reasons });
  }
  ranked.sort((a, b) => b.score - a.score || Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  const count = new Map<string, number>();
  return ranked.filter((i) => {
    const n = (count.get(i.repo) ?? 0) + 1;
    count.set(i.repo, n);
    return n <= perRepo;
  }).slice(0, limit);
}
