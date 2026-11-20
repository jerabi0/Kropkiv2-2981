import { ORPCError } from "@orpc/server";
import { createGame, legal, play, other, type Game, type Player } from "../../web/lib/kropki";
import { scoreWinner, type Result } from "../../web/lib/timed-game";
export const PRESENCE_TIMEOUT_MS = 10_000;
export const DISCONNECT_GRACE_MS = 60_000;
export type Participant = { id: string; name: string };
export type OnlineGame = {
  game: Game;
  minutes: number;
  blue: Participant;
  red: Participant | null;
  ready: [boolean, boolean];
  startedAt: number | null;
  deadline: number | null;
  finishedAt: number | null;
  expiresAt: number;
  result: Result | null;
  requests: string[];
  moveTimes: number[];
  ranked?: boolean;
  cancelled?: boolean;
  rating?: { blueBefore: number; redBefore: number; delta: number };
};
export type Action =
  | { type: "ready" }
  | { type: "move"; x: number; y: number }
  | { type: "resign" };
export function newOnlineGame(
  blue: Participant,
  size: number,
  minutes: number,
  now: number,
): OnlineGame {
  return {
    game: createGame(size, size === 13 ? 11 : size === 21 ? 17 : 13),
    minutes,
    blue,
    red: null,
    ready: [false, false],
    startedAt: null,
    deadline: null,
    finishedAt: null,
    expiresAt: now + 86400000,
    result: null,
    requests: [],
    moveTimes: [],
  };
}
export function side(g: OnlineGame, id: string): Player | null {
  return g.blue.id === id ? 1 : g.red?.id === id ? 2 : null;
}
export function expireDisconnected(
  g: OnlineGame,
  lastSeenAt: [number, number],
  now: number,
): OnlineGame {
  if (g.startedAt === null || g.result || g.cancelled) return g;
  const expired = lastSeenAt
    .map((seenAt, index) => ({
      player: (index + 1) as Player,
      deadline: seenAt > 0 ? seenAt + PRESENCE_TIMEOUT_MS + DISCONNECT_GRACE_MS : Infinity,
    }))
    .filter((entry) => now >= entry.deadline)
    .sort((a, b) => a.deadline - b.deadline);
  if (!expired.length) return g;
  const first = expired[0];
  const simultaneous = expired[1]?.deadline === first.deadline;
  return {
    ...g,
    game: { ...g.game, ended: true },
    finishedAt: first.deadline,
    result: {
      reason: "disconnect",
      winner: simultaneous ? null : other(first.player),
      ...(simultaneous ? {} : { disconnectedBy: first.player }),
    },
  };
}
export function expire(g: OnlineGame, now: number): OnlineGame {
  if (g.ranked && g.startedAt === null && !g.result && !g.cancelled && now >= g.expiresAt)
    return { ...g, cancelled: true, game: { ...g.game, ended: true }, finishedAt: g.expiresAt };
  if (g.result || g.deadline === null || now < g.deadline) return g;
  return {
    ...g,
    game: { ...g.game, ended: true },
    finishedAt: g.deadline,
    result: { reason: "time", winner: scoreWinner(g.game) },
  };
}
export function joinGame(g: OnlineGame, who: Participant, now: number): OnlineGame {
  if (side(g, who.id)) return g;
  if (g.red) throw new ORPCError("FORBIDDEN", { message: "Cette salle est déjà complète." });
  if (now >= g.expiresAt || g.result)
    throw new ORPCError("BAD_REQUEST", { message: "Cette invitation a expiré." });
  return { ...g, red: who };
}
export function act(
  g: OnlineGame,
  id: string,
  action: Action,
  requestId: string,
  now: number,
): OnlineGame {
  const player = side(g, id);
  if (!player)
    throw new ORPCError("FORBIDDEN", { message: "Tu ne participes pas à cette partie." });
  if (g.requests.includes(id + ":" + requestId)) return expire(g, now);
  const settled = expire(g, now);
  if (settled.result || settled.cancelled) return settled;
  let n = settled;
  if (action.type === "ready") {
    if (n.startedAt !== null) return n;
    if (now >= n.expiresAt)
      throw new ORPCError("BAD_REQUEST", { message: "Cette invitation a expiré." });
    const ready: [boolean, boolean] = [...n.ready];
    ready[player - 1] = true;
    n = {
      ...n,
      ready,
    };
  } else if (action.type === "resign") {
    if (n.ranked && n.startedAt === null)
      throw new ORPCError("BAD_REQUEST", { message: "Aucun abandon classé avant le départ." });
    if (!n.red) throw new ORPCError("BAD_REQUEST", { message: "Attends ton adversaire." });
    n = {
      ...n,
      game: { ...n.game, ended: true },
      finishedAt: now,
      result: { reason: "resign", winner: other(player), resignedBy: player },
    };
  } else {
    if (!n.red || !n.ready.every(Boolean))
      throw new ORPCError("BAD_REQUEST", { message: "Les deux joueurs doivent être prêts." });
    if (n.startedAt === null && now >= n.expiresAt)
      throw new ORPCError("BAD_REQUEST", { message: "Le délai de départ a expiré." });
    if (n.game.turn !== player)
      throw new ORPCError("FORBIDDEN", { message: "Ce n’est pas ton tour." });
    if (
      !Number.isInteger(action.x) ||
      !Number.isInteger(action.y) ||
      !legal(n.game, action.x, action.y)
    )
      throw new ORPCError("BAD_REQUEST", { message: "Intersection occupée ou capturée." });
    const game = play(n.game, action.x, action.y);
    n = {
      ...n,
      game,
      startedAt: n.startedAt ?? now,
      deadline: n.deadline ?? now + n.minutes * 60000,
      moveTimes: [...n.moveTimes, now],
      finishedAt: game.ended ? now : null,
      result: game.ended ? { reason: "full", winner: scoreWinner(game) } : null,
    };
  }
  return { ...n, requests: [...n.requests, id + ":" + requestId] };
}
export function publicState(g: OnlineGame, id: string) {
  const player = side(g, id);
  if (!player)
    return {
      player: null,
      blue: { name: g.blue.name },
      red: g.red ? { name: g.red.name } : null,
      minutes: g.minutes,
      w: g.game.w,
      h: g.game.h,
      full: !!g.red,
      expiresAt: g.expiresAt,
    };
  const { requests: _, blue, red, ...rest } = g;
  return { ...rest, player, blue: { name: blue.name }, red: red ? { name: red.name } : null };
}
