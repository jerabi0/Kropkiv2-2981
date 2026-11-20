import { randomBytes } from "node:crypto";
import { ORPCError } from "@orpc/server";
import { and, eq, or, desc } from "drizzle-orm";
import { z } from "zod";
import { db } from "../database";
import { privateGames as table } from "../database/online-schema";
import { authed } from "../middleware/auth";
import { readRoom as read, loadRoom, saveRoom } from "../services/rooms";
import {
  newOnlineGame,
  joinGame,
  act,
  publicState,
  side,
  type OnlineGame,
  PRESENCE_TIMEOUT_MS,
  DISCONNECT_GRACE_MS,
} from "../services/online-game";
const room = z.object({ id: z.string().regex(/^[a-f0-9]{48}$/) });
async function touchPresence(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  row: typeof table.$inferSelect,
  userId: string,
  now: number,
) {
  if (row.blueId === userId) {
    const [updated] = await tx.update(table).set({ blueSeenAt: now }).where(eq(table.id, row.id)).returning();
    return updated ?? row;
  }
  if (row.redId === userId) {
    const [updated] = await tx.update(table).set({ redSeenAt: now }).where(eq(table.id, row.id)).returning();
    return updated ?? row;
  }
  return row;
}
function response(row: typeof table.$inferSelect, state: OnlineGame, id: string) {
  const player = side(state, id);
  return {
    id: row.id,
    revision: row.revision,
    serverNow: Date.now(),
    ...publicState(state, id),
    presence: player
      ? {
          blueLastSeenAt: row.blueSeenAt,
          redLastSeenAt: row.redSeenAt,
          heartbeatTimeoutMs: PRESENCE_TIMEOUT_MS,
          disconnectGraceMs: DISCONNECT_GRACE_MS,
        }
      : null,
  };
}
export const privateGames = {
  create: authed
    .input(
      z.object({
        size: z.union([z.literal(13), z.literal(17), z.literal(21)]),
        minutes: z.union([
          z.literal(3),
          z.literal(5),
          z.literal(7),
          z.literal(10),
          z.literal(30),
        ]),
      }),
    )
    .handler(async ({ input, context }) => {
      const id = randomBytes(24).toString("hex"),
        now = Date.now();
      const state = newOnlineGame(
        { id: context.user.id, name: context.user.name.slice(0, 24) },
        input.size,
        input.minutes,
        now,
      );
      await db
        .insert(table)
        .values({ id, blueId: context.user.id, state: JSON.stringify(state), createdAt: now, blueSeenAt: now });
      return { id };
    }),
  get: authed.input(room).handler(async ({ input, context }) =>
    db.transaction(async (tx) => {
      const { row, state } = await loadRoom(tx, input.id);
      const current = state.result || state.cancelled ? row : await touchPresence(tx, row, context.user.id, Date.now());
      return response(current, state, context.user.id);
    }),
  ),
  join: authed.input(room).handler(async ({ input, context }) => {
    const { row, state } = await read(input.id);
    const next = joinGame(
      state,
      { id: context.user.id, name: context.user.name.slice(0, 24) },
      Date.now(),
    );
    if (next === state) return response(row, state, context.user.id);
    const [saved] = await db
      .update(table)
      .set({ redId: context.user.id, redSeenAt: Date.now(), state: JSON.stringify(next), revision: row.revision + 1 })
      .where(and(eq(table.id, row.id), eq(table.revision, row.revision)))
      .returning();
    if (!saved)
      throw new ORPCError("CONFLICT", { message: "La salle vient de changer. Actualise-la." });
    return response(saved, next, context.user.id);
  }),
  action: authed
    .input(
      room.extend({
        revision: z.number().int().min(0),
        requestId: z.string().uuid(),
        action: z.discriminatedUnion("type", [
          z.object({ type: z.literal("ready") }),
          z.object({ type: z.literal("resign") }),
          z.object({
            type: z.literal("move"),
            x: z.number().int().min(0).max(20),
            y: z.number().int().min(0).max(16),
          }),
        ]),
      }),
    )
    .handler(async ({ input, context }) =>
      db.transaction(async (tx) => {
        const { row, state } = await loadRoom(tx, input.id);
        if (!side(state, context.user.id)) throw new ORPCError("FORBIDDEN");
        if (
          state.result ||
          state.cancelled ||
          state.requests.includes(context.user.id + ":" + input.requestId)
        )
          return response(row, state, context.user.id);
        const activeRow = await touchPresence(tx, row, context.user.id, Date.now());
        if (input.action.type === "move" && row.revision !== input.revision)
          throw new ORPCError("CONFLICT", {
            message: "La partie a changé : attends sa synchronisation.",
          });
        const next = act(state, context.user.id, input.action, input.requestId, Date.now());
        const saved = await saveRoom(tx, activeRow, next);
        return response(saved.row, saved.state, context.user.id);
      }),
    ),
  list: authed.handler(async ({ context }) =>
    db.transaction(async (tx) => {
      const rows = await tx
        .select()
        .from(table)
        .where(or(eq(table.blueId, context.user.id), eq(table.redId, context.user.id)))
        .orderBy(desc(table.createdAt))
        .limit(50);
      const games: { row: typeof table.$inferSelect; state: OnlineGame }[] = [];
      for (const row of rows) games.push(await loadRoom(tx, row.id));
      return games.map(({ row, state: s }) => ({
        id: row.id,
        blue: s.blue.name,
        red: s.red?.name ?? null,
        minutes: s.minutes,
        createdAt: row.createdAt,
        result: s.result,
        ranked: !!s.ranked,
        expired: !s.red && Date.now() >= s.expiresAt,
        status: s.cancelled
          ? "Annulée"
          : s.result
            ? "Terminée"
            : s.startedAt
              ? "En cours"
              : "En attente",
      }));
    }),
  ),
};
