import { randomBytes } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "../database";
import { matchQueue } from "../database/ranked-schema";
import { privateGames } from "../database/online-schema";
import { profile, loadRoom, type Tx } from "./rooms";
import { newOnlineGame } from "./online-game";
import { eligible } from "./elo";
const lease = 60000;
export async function seek(
  tx: Tx,
  who: { id: string; name: string },
  config?: { size: number; minutes: number },
) {
  const now = Date.now();
  const rows = await tx.select().from(matchQueue).where(eq(matchQueue.userId, who.id));
  let q: typeof matchQueue.$inferSelect | undefined = rows[0];
  if (q?.roomId) {
    const { state } = await loadRoom(tx, q.roomId);
    if (!state.result && !state.cancelled)
      return { status: "matched" as const, roomId: q.roomId, joinedAt: q.joinedAt };
    await tx.delete(matchQueue).where(eq(matchQueue.userId, who.id));
    q = undefined;
  }
  if (config) {
    const p = await profile(tx, who.id);
    const preserve =
      q && q.expiresAt > now && q.size === config.size && q.minutes === config.minutes;
    const values = {
      userId: who.id,
      name: who.name.slice(0, 24),
      ...config,
      elo: p.elo,
      joinedAt: preserve ? q.joinedAt : now,
      expiresAt: now + lease,
      roomId: null,
    };
    await tx
      .insert(matchQueue)
      .values(values)
      .onConflictDoUpdate({ target: matchQueue.userId, set: values });
    q = values;
  } else if (!q || q.expiresAt <= now) {
    if (q) await tx.delete(matchQueue).where(eq(matchQueue.userId, who.id));
    return { status: "idle" as const, roomId: null, joinedAt: null };
  } else {
    await tx
      .update(matchQueue)
      .set({ expiresAt: now + lease })
      .where(eq(matchQueue.userId, who.id));
  }
  const candidates = await tx
    .select()
    .from(matchQueue)
    .where(
      and(
        eq(matchQueue.size, q.size),
        eq(matchQueue.minutes, q.minutes),
        gt(matchQueue.expiresAt, now),
        isNull(matchQueue.roomId),
      ),
    );
  const opponent = candidates
    .filter((c) => eligible(q, c, now))
    .sort(
      (a, b) => Math.abs(a.elo - q.elo) - Math.abs(b.elo - q.elo) || a.joinedAt - b.joinedAt,
    )[0];
  if (!opponent)
    return {
      status: "waiting" as const,
      roomId: null,
      joinedAt: q.joinedAt,
      size: q.size,
      minutes: q.minutes,
    };
  const id = randomBytes(24).toString("hex");
  const [b, r] = randomBytes(1)[0] % 2 ? [q, opponent] : [opponent, q];
  const state = {
    ...newOnlineGame({ id: b.userId, name: b.name }, q.size, q.minutes, now),
    red: { id: r.userId, name: r.name },
    ranked: true,
    expiresAt: now + 90000,
  };
  await tx
    .insert(privateGames)
    .values({
      id,
      blueId: b.userId,
      redId: r.userId,
      state: JSON.stringify(state),
      createdAt: now,
      blueSeenAt: now,
      redSeenAt: now,
    });
  for (const player of [q, opponent])
    await tx.update(matchQueue).set({ roomId: id }).where(eq(matchQueue.userId, player.userId));
  return { status: "matched" as const, roomId: id, joinedAt: q.joinedAt };
}
export const search = (
  who: { id: string; name: string },
  config?: { size: number; minutes: number },
) => db.transaction((tx) => seek(tx, who, config));
