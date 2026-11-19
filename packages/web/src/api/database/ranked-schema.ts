import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { user } from "./auth-schema";
import { privateGames } from "./online-schema";
export const ratings = sqliteTable("kropki_rating", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  elo: integer("elo").notNull().default(1200),
  games: integer("games").notNull().default(0),
});
export const matchQueue = sqliteTable(
  "kropki_queue",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    size: integer("size").notNull(),
    minutes: integer("minutes").notNull(),
    elo: integer("elo").notNull(),
    joinedAt: integer("joined_at").notNull(),
    expiresAt: integer("expires_at").notNull(),
    roomId: text("room_id").references(() => privateGames.id, { onDelete: "cascade" }),
  },
  (t) => [index("kropki_queue_pool").on(t.size, t.minutes, t.expiresAt)],
);
export const ratingResults = sqliteTable(
  "kropki_rating_result",
  {
    roomId: text("room_id")
      .primaryKey()
      .references(() => privateGames.id, { onDelete: "cascade" }),
    blueId: text("blue_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    redId: text("red_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    blueBefore: integer("blue_before").notNull(),
    redBefore: integer("red_before").notNull(),
    delta: integer("delta").notNull(),
    finishedAt: integer("finished_at").notNull(),
  },
  (t) => [index("kropki_result_blue").on(t.blueId), index("kropki_result_red").on(t.redId)],
);
