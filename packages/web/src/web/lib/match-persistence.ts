import type { TimedMatch } from "./timed-game";

export type LocalSave = { match: TimedMatch; mode: string; level: string };

// Running ticks only advance the anchor (remaining/since). The saved anchor
// already lets restoreMatch subtract all elapsed time, including offline time.
export function needsMatchSave(previous: LocalSave | null, next: LocalSave): boolean {
  if (!previous) return true;
  const a = previous.match, b = next.match;
  return previous.mode !== next.mode || previous.level !== next.level ||
    a.game !== b.game || a.snapshots !== b.snapshots || a.result !== b.result ||
    a.clock.minutes !== b.clock.minutes || a.clock.paused !== b.clock.paused ||
    a.clock.started !== b.clock.started ||
    (a.clock.since === null) !== (b.clock.since === null);
}