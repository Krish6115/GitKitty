// How long the model last made a request wait before its first words. BharatCode's free tier can queue requests for
// minutes; while it's that busy, optional extra calls (like the search rewrite) are skipped. Per server instance.

const BUSY_AFTER_MS = 10_000;
let lastWaitMs = 0;

export function recordModelWait(ms: number): void {
  lastWaitMs = ms;
}

export function modelIsQueueing(): boolean {
  return lastWaitMs > BUSY_AFTER_MS;
}
