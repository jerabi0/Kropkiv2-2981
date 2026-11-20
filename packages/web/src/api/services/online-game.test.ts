import { test, expect } from "bun:test";
import { newOnlineGame, joinGame, act, expire, expireDisconnected, publicState, PRESENCE_TIMEOUT_MS, DISCONNECT_GRACE_MS } from "./online-game";
const blue = { id: "b", name: "Bleu" },
  red = { id: "r", name: "Rouge" };
function ready() {
  let g = joinGame(newOnlineGame(blue, 17, 3, 0), red, 1);
  g = act(g, "b", { type: "ready" }, "b-ready", 2);
  return act(g, "r", { type: "ready" }, "r-ready", 1000);
}
test("deux prêts attendent le premier coup légal pour démarrer 180s", () => {
  const waiting = ready();
  expect(waiting.startedAt).toBeNull();
  expect(waiting.deadline).toBeNull();
  expect(expire(waiting, 200000).result).toBeNull();
  const g = act(waiting, "b", {type:"move",x:1,y:1}, "first", 1000);
  expect(g.startedAt).toBe(1000);
  expect(g.deadline).toBe(181000);
  expect(g.ready).toEqual([true, true]);
  expect(expire(g, 180999).result).toBeNull();
  expect(expire(g, 181000).result).toEqual({ reason: "time", winner: null });
});
test("un invité non membre ne reçoit ni plateau, ni IDs, ni requêtes", () => {
  const p = publicState(ready(), "outsider");
  expect("game" in p).toBe(false);
  expect("id" in p.blue).toBe(false);
  expect("requests" in p).toBe(false);
});
test("troisième joueur refusé, auto-join idempotent, invitation expirée", () => {
  const g = ready();
  expect(joinGame(g, blue, 10000)).toBe(g);
  expect(() => joinGame(g, { id: "x", name: "X" }, 10000)).toThrow();
  expect(() => joinGame(newOnlineGame(blue, 17, 3, 0), red, 86400000)).toThrow();
});
test("les coups non autorisés et avant le démarrage sont rejetés", () => {
  expect(() =>
    act(newOnlineGame(blue, 17, 3, 0), "b", { type: "move", x: 3, y: 3 }, "1", 0),
  ).toThrow();
  const g = ready();
  expect(() => act(g, "x", { type: "move", x: 3, y: 3 }, "1", 2000)).toThrow();
  expect(() => act(g, "r", { type: "move", x: 3, y: 3 }, "1", 2000)).toThrow();
  expect(() => act(g, "b", { type: "move", x: 3.1, y: 3 }, "1", 2000)).toThrow();
  expect(() => act(g, "b", { type: "move", x: 50, y: 3 }, "1", 2000)).toThrow();
});
test("idempotence et aucune recharge du temps au changement de tour", () => {
  const g = ready(),
    n = act(g, "b", { type: "move", x: 3, y: 3 }, "move1", 2000);
  expect(n.game.moves.length).toBe(1);
  expect(g.deadline).toBeNull();
  expect(n.deadline).toBe(182000);
  expect(act(n, "r", {type:"move", x:4,y:4}, "next", 4000).deadline).toBe(n.deadline);
  expect(act(n, "b", { type: "move", x: 3, y: 3 }, "move1", 3000)).toBe(n);
  expect(() => act(n, "r", { type: "move", x: 3, y: 3 }, "move2", 3000)).toThrow();
});
test("capture, score à expiration, coup tardif refusé", () => {
  let g = ready();
  for (const [i, xy] of [
    [3, 2],
    [3, 3],
    [4, 3],
    [10, 10],
    [3, 4],
    [11, 10],
    [2, 3],
  ].entries())
    g = act(g, i % 2 ? "r" : "b", { type: "move", x: xy[0], y: xy[1] }, "m" + i, 2000 + i * 1000);
  const ended = act(g, "r", { type: "move", x: 0, y: 0 }, "late", 182000);
  expect(ended.game.moves.length).toBe(7);
  expect(ended.result?.winner).toBe(1);
  expect(ended.finishedAt).toBe(182000);
  const resign = act(g, "b", { type: "resign" }, "resign", 10000);
  expect(resign.result?.winner).toBe(2);
  expect(resign.finishedAt).toBe(10000);
});

test("classé prêt sans premier coup : annulation sans résultat ni Elo", () => {
 const g = {...ready(), ranked:true, expiresAt:90000};
 expect(expire(g,89999).cancelled).toBeUndefined();
 const n = act(g,"b",{type:"move",x:1,y:1},"late",90000);
 expect(n.cancelled).toBe(true);
 expect(n.startedAt).toBeNull();
 expect(n.result).toBeNull();
 const started=act(g,"b",{type:"move",x:1,y:1},"start",89999);
 expect(expire(started,90000).cancelled).toBeUndefined();
});

test("une déconnexion donne une minute de grâce après la tolérance réseau", () => {
  const started = act(ready(), "b", { type: "move", x: 1, y: 1 }, "start", 2000);
  const lastSeen: [number, number] = [2000, 2000];
  const deadline = 2000 + PRESENCE_TIMEOUT_MS + DISCONNECT_GRACE_MS;
  expect(expireDisconnected(started, lastSeen, deadline - 1).result).toBeNull();
  expect(expireDisconnected(started, lastSeen, deadline).result).toEqual({
    reason: "disconnect",
    winner: 2,
    disconnectedBy: 1,
  });
});
test("un joueur qui revient pendant la grâce ne perd pas", () => {
  const started = act(ready(), "b", { type: "move", x: 1, y: 1 }, "start", 2000);
  const reconnected: [number, number] = [2000, 2000 + PRESENCE_TIMEOUT_MS + 30000];
  expect(expireDisconnected(started, reconnected, 2000 + PRESENCE_TIMEOUT_MS + DISCONNECT_GRACE_MS + 1).result).toBeNull();
});
test("deux déconnexions simultanées terminent en égalité", () => {
  const started = act(ready(), "b", { type: "move", x: 1, y: 1 }, "start", 2000);
  const deadline = 2000 + PRESENCE_TIMEOUT_MS + DISCONNECT_GRACE_MS;
  expect(expireDisconnected(started, [2000, 2000], deadline).result).toEqual({
    reason: "disconnect",
    winner: null,
  });
});
test("une partie déjà terminée ne change pas de résultat après une déconnexion", () => {
  const started = act(ready(), "b", { type: "move", x: 1, y: 1 }, "start", 2000);
  const resigned = act(started, "b", { type: "resign" }, "resign", 3000);
  expect(expireDisconnected(resigned, [2000, 2000], 200000).result).toEqual({
    reason: "resign",
    winner: 2,
    resignedBy: 1,
  });
});
