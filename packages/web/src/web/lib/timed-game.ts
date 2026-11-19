import { createGame, play, replay, scores, other, type Game, type Player } from "./kropki";
export const CADENCES = [3, 5, 7, 10, 30] as const;
export type Clock = { minutes: number; remaining: number; paused: boolean; started: boolean; since: number | null };
export type Result = {
  reason: "time" | "full" | "resign" | "score";
  winner: Player | null;
  resignedBy?: Player;
};
export type TimedMatch = {
  version: 3;
  game: Game;
  clock: Clock;
  result: Result | null;
  snapshots: (number | null)[];
};
export function scoreWinner(g: Game): Player | null {
  const s = scores(g);
  return s[1] === s[2] ? null : s[1] > s[2] ? 1 : 2;
}
export function createMatch(g = createGame(), minutes = 3, now = Date.now()): TimedMatch {
  if (!CADENCES.includes(minutes as (typeof CADENCES)[number])) minutes = 3;
  return {
    version: 3,
    game: g,
    clock: { minutes, remaining: minutes * 60000, paused: false, started: g.moves.length > 0, since: g.ended || !g.moves.length ? null : now },
    result: g.ended ? { reason: "score", winner: scoreWinner(g) } : null,
    snapshots: Array.from({ length: g.moves.length + 1 }, (_, i) =>
      i === 0 && !g.moves.length ? minutes * 60000 : null,
    ),
  };
}
// A single budget for the entire match, regardless of whose turn it is.
// Check before each move too: a delayed/background ticker cannot admit a late move.
export function settleMatch(m: TimedMatch, now: number): TimedMatch {
  if (m.game.ended || m.clock.paused || m.clock.since === null) return m;
  const elapsed = Math.max(0, now - m.clock.since);
  const remaining = Math.max(0, m.clock.remaining - elapsed);
  if (remaining === 0)
    return {
      ...m,
      game: { ...m.game, ended: true },
      clock: { ...m.clock, remaining: 0, since: null },
      result: { reason: "time", winner: scoreWinner(m.game) },
    };
  if (!elapsed) return m;
  return { ...m, clock: { ...m.clock, remaining, since: now } };
}
export function moveMatch(m: TimedMatch, x: number, y: number, now: number): TimedMatch {
  const n = settleMatch(m, now);
  if (n.game.ended || n.clock.paused) return n;
  const game = play(n.game, x, y);
  if (game === n.game) return n;
  return {
    ...n,
    game,
    clock: { ...n.clock, started: true, since: game.ended ? null : now },
    snapshots: [...n.snapshots, n.clock.remaining],
    result: game.ended ? { reason: "full", winner: scoreWinner(game) } : null,
  };
}
export function pauseMatch(m: TimedMatch, now: number): TimedMatch {
  if (m.game.ended || m.clock.paused) return m;
  const n = settleMatch(m, now);
  return n.game.ended ? n : { ...n, clock: { ...n.clock, paused: true, since: null } };
}
export function resumeMatch(m: TimedMatch, now: number): TimedMatch {
  if (m.game.ended || !m.clock.paused) return m;
  return settleMatch({ ...m, clock: { ...m.clock, paused: false, since: m.clock.started ? now : null } }, now);
}
export function resignMatch(m: TimedMatch, player: Player, now: number): TimedMatch {
  const n = settleMatch(m, now);
  if (n.game.ended) return n;
  return {
    ...n,
    game: { ...n.game, ended: true },
    clock: { ...n.clock, since: null },
    result: { reason: "resign", winner: other(player), resignedBy: player },
  };
}
export function undoMatch(m: TimedMatch, count: number, now: number): TimedMatch {
  const n = settleMatch(m, now);
  if (
    n.game.ended ||
    n.clock.paused ||
    !n.game.moves.length ||
    !Number.isInteger(count) ||
    count <= 0
  )
    return n;
  const game = replay(
    n.game.moves.slice(0, Math.max(0, n.game.moves.length - count)),
    n.game.w,
    n.game.h,
  );
  // Never refund time on undo; historical snapshots remain historical.
  return {
    ...n,
    game,
    snapshots: n.snapshots.slice(0, game.moves.length + 1),
    result: null,
    clock: { ...n.clock, since: now },
  };
}
function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
function savedResult(value: unknown, game: Game): Result | null {
  if (!game.ended) return null;
  const r = record(value);
  if (
    r?.reason === "resign" &&
    (r.resignedBy === 1 || r.resignedBy === 2) &&
    r.winner === other(r.resignedBy)
  )
    return { reason: "resign", winner: r.winner, resignedBy: r.resignedBy };
  const reason = r?.reason;
  return {
    reason: reason === "time" || reason === "full" || reason === "score" ? reason : "score",
    winner: scoreWinner(game),
  };
}
export function restoreMatch(g: Game, data: unknown, now: number): TimedMatch {
  const saved = record(data),
    c = record(saved?.clock);
  const minutes = c?.minutes;
  if (typeof minutes !== "number" || ![1, ...CADENCES].includes(minutes))
    return createMatch(g, 3, now);
  const duration = minutes * 60000;
  const validTime = (r: unknown): r is number =>
    typeof r === "number" && Number.isFinite(r) && r >= 0 && r <= duration;
  const since = c?.since,
    paused = c?.paused;
  const started = saved?.version === 3 ? c?.started : true;
  if (
    typeof started !== "boolean" ||
    (!started && (g.moves.length > 0 || since !== null)) ||
    typeof paused !== "boolean" ||
    (since !== null && (typeof since !== "number" || !Number.isFinite(since))) ||
    (!g.ended && !paused && started && since === null)
  )
    return createMatch(g, 3, now);
  const legacy = saved?.version !== 2 && saved?.version !== 3 && Array.isArray(c?.remaining);
  const convert = (r: unknown): number | null => {
    if (!legacy) return validTime(r) ? r : null;
    if (!Array.isArray(r) || r.length !== 3 || !validTime(r[1]) || !validTime(r[2])) return null;
    return Math.max(0, r[1] + r[2] - duration);
  };
  const remaining = convert(c?.remaining);
  if (remaining === null || (!started && remaining !== duration)) return createMatch(g, 3, now);
  const snapshots =
    Array.isArray(saved?.snapshots) && saved.snapshots.length === g.moves.length + 1
      ? saved.snapshots.map(convert)
      : Array.from({ length: g.moves.length + 1 }, () => null);
  const m: TimedMatch = {
    version: 3,
    game: g,
    clock: { minutes, remaining, paused, started, since: g.ended ? null : (since as number | null) },
    snapshots,
    result: savedResult(saved?.result, g),
  };
  // Local review/tutorial pause ends on reload, without charging that paused absence.
  return m.clock.paused ? resumeMatch(m, now) : settleMatch(m, now);
}
export function formatClock(ms: number) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}
