import { test, expect } from "bun:test";
import { createGame, play, scores } from "./kropki";
import { gameFeedback, reviewPosition } from "./game-feedback";
function diamond() {
  let g = createGame(7, 7);
  for (const [x, y] of [
    [3, 2],
    [3, 3],
    [4, 3],
    [6, 6],
    [3, 4],
    [5, 6],
  ])
    g = play(g, x, y);
  return g;
}
test("pas de notification pour un coup sans capture", () => {
  const g = createGame();
  expect(gameFeedback(g, play(g, 1, 1))).toBeNull();
});
test("feedback réel de capture bleue : +1, nouveau territoire, point touché", () => {
  const g = diamond(),
    n = play(g, 2, 3),
    f = gameFeedback(g, n)!;
  expect(f.deltas).toEqual([0, 1, 0]);
  expect(f.captured).toEqual([24]);
  expect(f.zones.length).toBe(1);
  expect(f.liberated.length).toBe(0);
});
test("feedback capture rouge identique", () => {
  const g = createGame(7, 7);
  g.turn = 2;
  g.board[24] = 1;
  for (const [x, y] of [
    [3, 2],
    [4, 3],
    [3, 4],
  ])
    g.board[y * 7 + x] = 2;
  expect(gameFeedback(g, play(g, 2, 3))?.deltas).toEqual([0, 0, 1]);
});
test("reconquête : gain bleu, perte rouge, libération", () => {
  let g = createGame(9, 9);
  g.turn = 2;
  g.board[40] = 1;
  for (const [x, y] of [
    [4, 3],
    [5, 4],
    [4, 5],
  ])
    g.board[y * 9 + x] = 2;
  g = play(g, 3, 4);
  for (let i = 1; i <= 7; i++) {
    g.board[9 + i] = 1;
    g.board[63 + i] = 1;
    g.board[i * 9 + 1] = 1;
    g.board[i * 9 + 7] = 1;
  }
  g.board[13] = 0;
  g.turn = 1;
  const n = play(g, 4, 1),
    f = gameFeedback(g, n)!;
  expect(f.deltas).toEqual([0, 4, -1]);
  expect(f.liberated).toEqual([40]);
  expect(f.captured.length).toBe(4);
});
test("relecture bornée et partie source inchangée", () => {
  const g = diamond(),
    before = JSON.stringify(g);
  expect(reviewPosition(g, -3)).toBe(0);
  expect(reviewPosition(g, 200)).toBe(6);
  expect(reviewPosition(g, 2.8)).toBe(2);
  expect(JSON.stringify(g)).toBe(before);
});
test("scénario du tutoriel avec vrais coups : bleu commence et capture", () => {
  let g = createGame(7, 7);
  for (const [x, y] of [
    [3, 2],
    [3, 3],
    [4, 3],
    [6, 6],
    [3, 4],
    [5, 6],
    [2, 3],
  ])
    g = play(g, x, y);
  expect(scores(g)).toEqual([0, 1, 0]);
  expect(g.moves[6].player).toBe(1);
  expect(g.zones.length).toBe(1);
});
