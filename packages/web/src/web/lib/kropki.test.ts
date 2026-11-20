import { test, expect } from "bun:test";
import { createGame, play, legal, scores, captured, computerMove, replay } from "./kropki";
test("alternance et intersection occupée", () => {
  const g = play(createGame(), 4, 4);
  expect(g.turn).toBe(2);
  expect(play(g, 4, 4)).toBe(g);
  expect(g.moves.length).toBe(1);
});
test("legal refuse les coordonnées non entières, non finies et hors plateau", () => {
  const g = createGame(7, 7);
  for (const [x, y] of [
    [1.5, 2],
    [2, 1.5],
    [-1, 0],
    [0, -1],
    [7, 0],
    [0, 7],
    [NaN, 0],
    [0, NaN],
    [Infinity, 0],
    [0, Infinity],
    [-Infinity, 0],
    [0, -Infinity],
  ]) {
    expect(legal(g, x, y)).toBe(false);
    expect(play(g, x, y)).toBe(g);
  }
});
test("capture diagonale et territoire fermé", () => {
  const g = createGame(7, 7);
  g.board[3 * 7 + 3] = 2;
  for (const [x, y] of [
    [3, 2],
    [4, 3],
    [3, 4],
  ])
    g.board[y * 7 + x] = 1;
  const n = play(g, 2, 3);
  expect(scores(n)[1]).toBe(1);
  expect(captured(n, 24)).toBe(true);
  expect(n.zones.length).toBe(1);
});
test("une boucle ouverte ne capture pas", () => {
  const g = createGame(7, 7);
  g.board[24] = 2;
  g.board[2 * 7 + 3] = 1;
  g.board[3 * 7 + 4] = 1;
  const n = play(g, 3, 4);
  expect(scores(n)[1]).toBe(0);
  expect(n.zones.length).toBe(0);
});
test("maison vide et intrusion", () => {
  let g = createGame(7, 7);
  for (const [x, y] of [
    [3, 2],
    [4, 3],
    [3, 4],
  ])
    g.board[y * 7 + x] = 1;
  g = play(g, 2, 3);
  expect(legal(g, 3, 3)).toBe(true);
  expect(g.zones.length).toBe(0);
  g = play(g, 3, 3);
  expect(scores(g)[1]).toBe(1);
});
test("libération par une capture extérieure", () => {
  let g = createGame(9, 9);
  g.turn = 2;
  g.board[4 * 9 + 4] = 1;
  for (const [x, y] of [
    [4, 3],
    [5, 4],
    [4, 5],
  ])
    g.board[y * 9 + x] = 2;
  g = play(g, 3, 4);
  expect(scores(g)[2]).toBe(1);
  for (let i = 1; i <= 7; i++) {
    g.board[1 * 9 + i] = 1;
    g.board[7 * 9 + i] = 1;
    g.board[i * 9 + 1] = 1;
    g.board[i * 9 + 7] = 1;
  }
  g.board[1 * 9 + 4] = 0;
  g.turn = 1;
  g = play(g, 4, 1);
  expect(scores(g)[2]).toBe(0);
  expect(scores(g)[1]).toBe(4);
  expect(captured(g, 4 * 9 + 4)).toBe(false);
  expect(g.zones.every((z) => z.player === 1)).toBe(true);
  expect(legal(g, 2, 2)).toBe(false);
});
test("replay conserve une partie", () => {
  let g = createGame();
  for (const [x, y] of [
    [5, 5],
    [6, 5],
    [5, 6],
    [6, 6],
  ])
    g = play(g, x, y);
  expect(replay(g.moves, g.w, g.h)).toEqual(g);
});
test("ordinateur trouve une capture immédiate", () => {
  const g = createGame(7, 7);
  g.turn = 2;
  g.board[3 * 7 + 3] = 1;
  for (const [x, y] of [
    [3, 2],
    [4, 3],
    [3, 4],
  ])
    g.board[y * 7 + x] = 2;
  expect(computerMove(g, "normal", () => 0)).toEqual([2, 3]);
});
test("Tactique bloque une capture adverse imminente", () => {
  const g = createGame(7, 7);
  g.turn = 1;
  g.board[3 * 7 + 3] = 1;
  for (const [x, y] of [
    [3, 2],
    [4, 3],
    [3, 4],
  ])
    g.board[y * 7 + x] = 2;
  expect(computerMove(g, "normal", () => 0)).toEqual([2, 3]);
});
test("Tactique préfère bloquer une capture ailleurs plutôt que prendre un gain exposé", () => {
  const g = createGame(11, 7);
  g.turn = 1;

  // P can capture the opponent's centre at (3, 3) with (2, 3).
  g.board[3 * 11 + 3] = 2;
  g.board[2 * 11 + 3] = 1;
  g.board[3 * 11 + 4] = 1;
  g.board[4 * 11 + 3] = 1;

  // But that capture lets Q close a different loop at (6, 3),
  // taking P's centre at (7, 3). Playing (6, 3) now blocks it.
  g.board[3 * 11 + 7] = 1;
  g.board[2 * 11 + 7] = 2;
  g.board[3 * 11 + 8] = 2;
  g.board[4 * 11 + 7] = 2;

  expect(computerMove(g, "normal", () => 0)).toEqual([6, 3]);
});

test("Tactique renvoie un coup légal avec un budget de simulation nul", () => {
  const g = createGame(21, 17);
  const move = computerMove(g, "normal", () => 0, 0);
  expect(move).not.toBeNull();
  expect(legal(g, ...move!)).toBe(true);
});

test("le générateur aléatoire injectable rend Découverte reproductible", () => {
  const g = createGame(7, 7);
  const rng = () => 0.25;
  expect(computerMove(g, "easy", rng)).toEqual(computerMove(g, "easy", rng));
});
test("Tactique obtient un meilleur score cumulé que Découverte sur 20 parties", () => {
  const seededRandom = (initialSeed: number) => {
    let seed = initialSeed >>> 0;
    return () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0x100000000;
    };
  };
  let tacticalScore = 0;
  let discoveryScore = 0;

  for (let match = 0; match < 20; match++) {
    const tacticalPlayer = match % 2 === 0 ? 1 : 2;
    const rng = seededRandom(match + 1);
    let g = createGame(5, 5);

    for (let turn = 0; turn < 25 && !g.ended; turn++) {
      const level = g.turn === tacticalPlayer ? "normal" : "easy";
      const move = computerMove(g, level, rng);
      if (!move) break;
      g = play(g, ...move);
    }

    const result = scores(g);
    tacticalScore += result[tacticalPlayer];
    discoveryScore += result[tacticalPlayer === 1 ? 2 : 1];
  }

  console.log(
    `[IA - 20 parties] Tactique: ${tacticalScore} points | Découverte: ${discoveryScore} points`,
  );
  expect(tacticalScore).toBeGreaterThan(discoveryScore);
});
test("benchmark IA sur plateau 21x17 en milieu de partie", () => {
  const g = createGame(21, 17);
  let seed = 20261120;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
  for (let i = 0; i < g.board.length; i++) {
    if (random() < 0.42) g.board[i] = random() < 0.5 ? 1 : 2;
  }
  g.turn = 1;
  const occupied = g.board.filter(Boolean).length;
  // Warm-up, then take five real measurements on the same deterministic position.
  computerMove(g, "normal", () => 0);
  const samples: number[] = [];
  let move: [number, number] | null = null;
  for (let run = 0; run < 5; run++) {
    const started = performance.now();
    move = computerMove(g, "normal", () => 0);
    samples.push(performance.now() - started);
  }
  const sorted = [...samples].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];

  expect(occupied).toBeGreaterThan(100);
  expect(move).not.toBeNull();
  expect(legal(g, ...move!)).toBe(true);
  console.log(
    `[BENCHMARK 21x17] médiane ${median.toFixed(2)} ms | min ${sorted[0].toFixed(2)} ms | max ${sorted[sorted.length - 1].toFixed(2)} ms | ${occupied} pions | budget 600 simulations`,
  );
});

test("simulation complète ordinateur sans coup illégal", () => {
  let g = createGame(13, 11);
  for (let i = 0; i < 90 && !g.ended; i++) {
    const m = computerMove(g, "normal", () => 0);
    expect(m).not.toBeNull();
    expect(legal(g, ...m!)).toBe(true);
    g = play(g, ...m!);
  }
  expect(g.moves.length).toBeGreaterThan(20);
});
