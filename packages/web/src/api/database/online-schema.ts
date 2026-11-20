import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { user } from "./auth-schema";
export const privateGames = sqliteTable(
  "kropki_private_game",
  {
    id: text("id").primaryKey(),
    blueId: text("blue_id")
      .notNull()
      .references(() => user.id),
    redId: text("red_id").references(() => user.id),
    state: text("state").notNull(),
    revision: integer("revision").notNull().default(0),
    createdAt: integer("created_at").notNull(),
    blueSeenAt: integer("blue_seen_at").notNull().default(0),
    redSeenAt: integer("red_seen_at").notNull().default(0),
  },
  (table) => [index("kropki_blue_idx").on(table.blueId), index("kropki_red_idx").on(table.redId)],
);
