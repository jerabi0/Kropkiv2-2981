import { and, eq } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { db } from "../database";
import { privateGames as rooms } from "../database/online-schema";
import { ratings, ratingResults } from "../database/ranked-schema";
import { expire, expireDisconnected, type OnlineGame } from "./online-game";
import { eloDelta } from "./elo";
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type RoomRow = typeof rooms.$inferSelect;
export async function profile(tx: Tx, id: string) {
  await tx.insert(ratings).values({ userId: id }).onConflictDoNothing();
  const [r] = await tx.select().from(ratings).where(eq(ratings.userId, id));
  return r;
}
async function rate(tx: Tx, row: RoomRow, state: OnlineGame): Promise<OnlineGame> {
  if (!state.ranked || !state.result || !state.startedAt || !state.red || state.rating)
    return state;
  const [old] = await tx.select().from(ratingResults).where(eq(ratingResults.roomId, row.id));
  if (old)
    return {
      ...state,
      rating: { blueBefore: old.blueBefore, redBefore: old.redBefore, delta: old.delta },
    };
  const b = await profile(tx, state.blue.id),
    r = await profile(tx, state.red.id);
  const delta = eloDelta(b.elo, r.elo, state.result.winner);
  await tx
    .insert(ratingResults)
    .values({
      roomId: row.id,
      blueId: b.userId,
      redId: r.userId,
      blueBefore: b.elo,
      redBefore: r.elo,
      delta,
      finishedAt: state.finishedAt ?? Date.now(),
    });
  await tx
    .update(ratings)
    .set({ elo: b.elo + delta, games: b.games + 1 })
    .where(eq(ratings.userId, b.userId));
  await tx
    .update(ratings)
    .set({ elo: r.elo - delta, games: r.games + 1 })
    .where(eq(ratings.userId, r.userId));
  return { ...state, rating: { blueBefore: b.elo, redBefore: r.elo, delta } };
}
export async function saveRoom(tx: Tx, row: RoomRow, next: OnlineGame) {
  const state = await rate(tx, row, next);
  const [saved] = await tx
    .update(rooms)
    .set({ state: JSON.stringify(state), revision: row.revision + 1 })
    .where(and(eq(rooms.id, row.id), eq(rooms.revision, row.revision)))
    .returning();
  if (!saved) throw new ORPCError("CONFLICT", { message: "La partie a changé. Actualise-la." });
  return { row: saved, state };
}
export async function loadRoom(tx: Tx, id: string, now = Date.now()) {
  const [initial] = await tx.select().from(rooms).where(eq(rooms.id, id));
  if (!initial) throw new ORPCError("NOT_FOUND", { message: "Invitation introuvable." });
  let row = initial;
  const baseline = {
    ...(row.blueSeenAt === 0 ? { blueSeenAt: now } : {}),
    ...(row.redId && row.redSeenAt === 0 ? { redSeenAt: now } : {}),
  };
  if (Object.keys(baseline).length) {
    const [updated] = await tx.update(rooms).set(baseline).where(eq(rooms.id, row.id)).returning();
    if (updated) row = updated;
  }
  const old = JSON.parse(row.state) as OnlineGame;
  const timed = expire(old, now);
  const state =
    timed.result || timed.cancelled
      ? timed
      : expireDisconnected(timed, [row.blueSeenAt, row.redSeenAt], now);
  if (state !== old || (state.ranked && state.result && !state.rating))
    return saveRoom(tx, row, state);
  return { row, state };
}
export const readRoom = (id: string) => db.transaction((tx) => loadRoom(tx, id));
