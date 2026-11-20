import { eq, or, desc } from "drizzle-orm";
import { z } from "zod";
import { authed } from "../middleware/auth";
import { db } from "../database";
import { privateGames } from "../database/online-schema";
import { matchQueue, ratingResults } from "../database/ranked-schema";
import { search } from "../services/matchmaking";
import { profile, loadRoom } from "../services/rooms";
import { type OnlineGame } from "../services/online-game";
const config = z.object({
  size: z.union([z.literal(13), z.literal(17), z.literal(21)]),
  minutes: z.union([
    z.literal(3),
    z.literal(5),
    z.literal(7),
    z.literal(10),
    z.literal(30),
  ]),
});
export const ranked = {
  search: authed.input(config).handler(({ input, context }) => search(context.user, input)),
  status: authed.handler(({ context }) => search(context.user)),
  cancel: authed.handler(({ context }) =>
    db.transaction(async (tx) => {
      const [q] = await tx.select().from(matchQueue).where(eq(matchQueue.userId, context.user.id));
      if (q?.roomId) {
        const { state } = await loadRoom(tx, q.roomId);
        if (!state.result && !state.cancelled) return { roomId: q.roomId };
      }
      await tx.delete(matchQueue).where(eq(matchQueue.userId, context.user.id));
      return { roomId: null };
    }),
  ),
  stats: authed.handler(({ context }) =>
    db.transaction(async (tx) => {
      // Settle only overdue/unrated games. Finished legacy private rooms stay private.
      const own = await tx
        .select()
        .from(privateGames)
        .where(
          or(eq(privateGames.blueId, context.user.id), eq(privateGames.redId, context.user.id)),
        )
        .orderBy(desc(privateGames.createdAt));
      const games: { row: typeof privateGames.$inferSelect; state: OnlineGame }[] = [];
      for (const row of own) games.push(await loadRoom(tx, row.id));
      const p = await profile(tx, context.user.id);
      const ledger = await tx
        .select()
        .from(ratingResults)
        .where(
          or(eq(ratingResults.blueId, context.user.id), eq(ratingResults.redId, context.user.id)),
        )
        .orderBy(desc(ratingResults.finishedAt))
        .limit(20);
      const completed = games.filter((g) => g.state.result);
      const tally = (list: typeof games) => ({
        total: list.length,
        wins: list.filter(
          (g) => g.state.result?.winner === (g.row.blueId === context.user.id ? 1 : 2),
        ).length,
        draws: list.filter((g) => g.state.result?.winner === null).length,
        losses: list.filter(
          (g) =>
            g.state.result?.winner !== null &&
            g.state.result?.winner !== (g.row.blueId === context.user.id ? 1 : 2),
        ).length,
      });
      const classified = tally(completed.filter((g) => g.state.ranked));
      return {
        elo: p.elo,
        provisional: p.games < 10,
        ranked: classified,
        private: tally(completed.filter((g) => !g.state.ranked)),
        history: ledger.map((l) => {
          const g = games.find((g) => g.row.id === l.roomId)!;
          const blue = l.blueId === context.user.id;
          const delta = blue ? l.delta : -l.delta;
          return {
            id: l.roomId,
            opponent: blue ? g.state.red!.name : g.state.blue.name,
            before: blue ? l.blueBefore : l.redBefore,
            delta,
            finishedAt: l.finishedAt,
            minutes: g.state.minutes,
            outcome:
              g.state.result!.winner === null
                ? "Nul"
                : g.state.result!.winner === (blue ? 1 : 2)
                  ? "Victoire"
                  : "Défaite",
          };
        }),
      };
    }),
  ),
};
