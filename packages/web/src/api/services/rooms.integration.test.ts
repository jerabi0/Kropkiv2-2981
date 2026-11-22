import { afterEach, beforeAll, expect, test } from "bun:test";
import { eq, sql } from "drizzle-orm";
import { db } from "../database";
import { privateGames } from "../database/online-schema";
import { ratings, ratingResults } from "../database/ranked-schema";
import { act, joinGame, newOnlineGame, type OnlineGame } from "./online-game";
import { loadRoom, PRESENCE_WRITE_INTERVAL_MS } from "./rooms";

const blue = { id: "integration-blue", name: "Bleu" };
const red = { id: "integration-red", name: "Rouge" };

beforeAll(async () => {
  await db.run(sql.raw("CREATE TABLE IF NOT EXISTS user (id TEXT PRIMARY KEY)"));
  await db.run(sql.raw(`CREATE TABLE IF NOT EXISTS kropki_private_game (
    id TEXT PRIMARY KEY,
    blue_id TEXT NOT NULL,
    red_id TEXT,
    state TEXT NOT NULL,
    revision INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    blue_seen_at INTEGER NOT NULL DEFAULT 0,
    red_seen_at INTEGER NOT NULL DEFAULT 0
  )`));
  await db.run(sql.raw(`CREATE TABLE IF NOT EXISTS kropki_rating (
    user_id TEXT PRIMARY KEY,
    elo INTEGER NOT NULL DEFAULT 1200,
    games INTEGER NOT NULL DEFAULT 0
  )`));
  await db.run(sql.raw(`CREATE TABLE IF NOT EXISTS kropki_rating_result (
    room_id TEXT PRIMARY KEY,
    blue_id TEXT NOT NULL,
    red_id TEXT NOT NULL,
    blue_before INTEGER NOT NULL,
    red_before INTEGER NOT NULL,
    delta INTEGER NOT NULL,
    finished_at INTEGER NOT NULL
  )`));
});

afterEach(async () => {
  await db.delete(ratingResults).run();
  await db.delete(ratings).run();
  await db.delete(privateGames).run();
  await db.run(sql.raw("DELETE FROM user"));
});

function startedGame(ranked = false): OnlineGame {
  let state = newOnlineGame(blue, 17, 3, 0);
  state = joinGame(state, red, 1);
  state = act(state, blue.id, { type: "ready" }, "blue-ready", 2);
  state = act(state, red.id, { type: "ready" }, "red-ready", 3);
  state = act(state, blue.id, { type: "move", x: 1, y: 1 }, "first-move", 2_000);
  return { ...state, ranked };
}

async function insertRoom(
  id: string,
  state: OnlineGame,
  blueSeenAt: number,
  redSeenAt: number,
) {
  await db.insert(privateGames).values({
    id,
    blueId: blue.id,
    redId: red.id,
    state: JSON.stringify(state),
    revision: 0,
    createdAt: 0,
    blueSeenAt,
    redSeenAt,
  }).run();
}

test("loadRoom persiste la défaite après expiration de la grâce", async () => {
  const id = "disconnect-integration-room";
  await insertRoom(id, startedGame(), 2_000, 71_999);

  const settled = await db.transaction((tx) => loadRoom(tx, id, 72_000));
  const [stored] = await db.select().from(privateGames).where(eq(privateGames.id, id));

  expect(settled.state.result).toEqual({
    reason: "disconnect",
    winner: 2,
    disconnectedBy: 1,
  });
  expect(stored.revision).toBe(1);
  expect(JSON.parse(stored.state).result).toEqual(settled.state.result);
});

test("loadRoom ne pénalise pas un joueur reconnecté avant la limite", async () => {
  const id = "reconnected-integration-room";
  await insertRoom(id, startedGame(), 72_000, 71_999);

  const settled = await db.transaction((tx) => loadRoom(tx, id, 72_001));
  const [stored] = await db.select().from(privateGames).where(eq(privateGames.id, id));

  expect(settled.state.result).toBeNull();
  expect(stored.revision).toBe(0);
});

test("loadRoom enregistre la présence avant le calcul et limite les écritures", async () => {
  const id = "presence-heartbeat-integration-room";
  await insertRoom(id, startedGame(), 2_000, 71_999);

  const first = await db.transaction((tx) => loadRoom(tx, id, 71_999, blue.id));
  expect(first.state.result).toBeNull();
  expect(first.row.blueSeenAt).toBe(71_999);
  expect(first.row.revision).toBe(0);

  const throttled = await db.transaction((tx) =>
    loadRoom(tx, id, 71_999 + PRESENCE_WRITE_INTERVAL_MS - 1, blue.id),
  );
  expect(throttled.row.blueSeenAt).toBe(71_999);
  expect(throttled.row.revision).toBe(0);

  const refreshed = await db.transaction((tx) =>
    loadRoom(tx, id, 71_999 + PRESENCE_WRITE_INTERVAL_MS, blue.id),
  );
  expect(refreshed.row.blueSeenAt).toBe(71_999 + PRESENCE_WRITE_INTERVAL_MS);
  expect(refreshed.row.revision).toBe(0);
});

test("un heartbeat à l’échéance ne réanime pas une partie expirée", async () => {
  const id = "late-heartbeat-integration-room";
  await insertRoom(id, startedGame(), 2_000, 71_999);

  const settled = await db.transaction((tx) => loadRoom(tx, id, 72_000, blue.id));
  expect(settled.state.result).toEqual({
    reason: "disconnect",
    winner: 2,
    disconnectedBy: 1,
  });
  expect(settled.row.blueSeenAt).toBe(2_000);
  expect(settled.row.revision).toBe(1);
});

test("deux déconnexions simultanées persistent une égalité", async () => {
  const id = "simultaneous-disconnect-integration-room";
  await db.run(sql.raw(
    "INSERT INTO user (id) VALUES ('integration-blue'), ('integration-red')",
  ));
  await insertRoom(id, startedGame(true), 2_000, 5_000);

  const settled = await db.transaction((tx) => loadRoom(tx, id, 75_000));
  const [stored] = await db.select().from(privateGames).where(eq(privateGames.id, id));
  const persisted = JSON.parse(stored.state) as OnlineGame;
  const profiles = await db.select().from(ratings);

  expect(settled.state.result).toEqual({ reason: "disconnect", winner: null });
  expect(settled.state.finishedAt).toBe(75_000);
  expect(settled.state.rating?.delta).toBe(0);
  expect(profiles).toHaveLength(2);
  expect(profiles.every((profile) => profile.elo === 1200)).toBe(true);
  expect(stored.revision).toBe(1);
  expect(persisted.result).toEqual(settled.state.result);
  expect(persisted.finishedAt).toBe(75_000);
  expect(persisted.rating).toEqual(settled.state.rating);
  const ledger = await db.select().from(ratingResults);
  expect(ledger).toHaveLength(1);
});

test("une déconnexion en partie classée persiste le résultat Elo une seule fois", async () => {
  const id = "ranked-disconnect-integration-room";
  await db.run(sql.raw(
    "INSERT INTO user (id) VALUES ('integration-blue'), ('integration-red')",
  ));
  await insertRoom(id, startedGame(true), 2_000, 71_999);

  const first = await db.transaction((tx) => loadRoom(tx, id, 72_000));
  const second = await db.transaction((tx) => loadRoom(tx, id, 72_001));
  const ledger = await db.select().from(ratingResults);
  const profiles = await db.select().from(ratings);

  expect(first.state.result?.reason).toBe("disconnect");
  expect(first.state.rating).toBeDefined();
  expect(second.state.rating).toEqual(first.state.rating);
  expect(ledger).toHaveLength(1);
  expect(profiles).toHaveLength(2);
  expect(profiles.every((profile) => profile.games === 1)).toBe(true);
});
