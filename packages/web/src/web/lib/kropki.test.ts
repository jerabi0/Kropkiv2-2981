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

test("Tactique trouve une capture sur un 21x17 dense même si le score bon marché la classe bas", () => {
  const g = createGame(21, 17);

  // 152 isolated-in-the-topology filler points: eight open horizontal lines.
  for (let y = 8; y < 16; y++)
    for (let x = 0; x < 19; x++)
      g.board[y * g.w + x] = y % 2 === 0 ? 1 : 2;

  // A five-point blue chain with a one-cell gap encloses a red centre.
  for (const [x, y] of [
    [3, 2],
    [4, 2],
    [5, 3],
    [4, 4],
    [3, 4],
  ])
    g.board[y * g.w + x] = 1;
  g.board[3 * g.w + 3] = 2;

  // A separate four-neighbour cluster gives a higher cheap-neighbour score.
  for (const [x, y] of [
    [10, 3],
    [11, 4],
    [10, 5],
    [9, 4],
  ])
    g.board[y * g.w + x] = 1;

  const cheapScore = (x: number, y: number) => {
    let own = 0;
    let enemy = 0;
    let near = 0;
    for (let i = 0; i < g.board.length; i++) {
      if (!g.board[i] || captured(g, i)) continue;
      const dx = Math.abs((i % g.w) - x);
      const dy = Math.abs(Math.floor(i / g.w) - y);
      const distance = Math.max(dx, dy);
      if (distance === 1) {
        if (g.board[i] === g.turn) own++;
        else enemy++;
      }
      if (distance === 2 && g.board[i] === g.turn) near++;
    }
    return own * 2.5 + enemy * 3 + near * 0.3 - (own > 4 ? 10 : 0);
  };

  const before = scores(g);
  const immediateCapture = play(g, 2, 3);
  expect(scores(immediateCapture)[1] - before[1]).toBe(1);
  expect(cheapScore(2, 3)).toBeLessThan(cheapScore(10, 4));
  expect(computerMove(g, "normal", () => 0)).toEqual([2, 3]);
});

test("Tactique conserve les captures sur 21x17 avec plus de 300 candidats", () => {
  const g = createGame(21, 17);
  g.turn = 1;

  // Dispersed points cover the board's candidate radius while leaving
  // more than 300 legal candidate cells. Keep the capture pattern area open.
  const xs = [0, 3, 6, 9, 12, 15, 18, 20];
  const ys = [0, 3, 6, 9, 12, 15, 16];
  let filler = 0;
  for (const y of ys)
    for (const x of xs) {
      if (Math.abs(x - 4) <= 3 && Math.abs(y - 3) <= 3) continue;
      g.board[y * g.w + x] = filler++ % 2 === 0 ? 1 : 2;
    }

  // Immediate capture at (2, 3), enclosing the red point at (3, 3).
  for (const [x, y] of [
    [3, 2],
    [4, 2],
    [5, 3],
    [4, 4],
    [3, 4],
  ])
    g.board[y * g.w + x] = 1;
  g.board[3 * g.w + 3] = 2;

  const occupied = g.board.map((value, i) => value ? i : -1).filter((i) => i >= 0);
  const candidates = g.board.filter((value, i) =>
    !value && !g.territory[i] && occupied.some((j) =>
      Math.max(
        Math.abs((j % g.w) - (i % g.w)),
        Math.abs(Math.floor(j / g.w) - Math.floor(i / g.w)),
      ) <= 2,
    ),
  );
  expect(candidates.length).toBeGreaterThan(300);

  const before = scores(g);
  const after = play(g, 2, 3);
  expect(scores(after)[1] - before[1]).toBe(1);

  let candidateSimulations = 0;
  let threatSimulations = 0;
  const move = computerMove(g, "normal", () => 0, 600, (kind) => {
    if (kind === "candidate") candidateSimulations++;
    if (kind === "threat") threatSimulations++;
  });
  expect(candidateSimulations).toBe(candidates.length);
  expect(threatSimulations).toBe(candidates.length);
  expect(move).toEqual([2, 3]);
});

test("Tactique bloque sur un 21x17 dense même si le blocage est hors du top 8 bon marché", () => {
  const g = createGame(21, 17);
  g.turn = 1;

  // Dense but open filler rows: enough occupied cells without closing zones.
  for (let y = 10; y < 16; y++)
    for (let x = 0; x < 19; x++)
      g.board[y * g.w + x] = y % 2 === 0 ? 1 : 2;

  // Nine independent attractive-looking clusters push the defensive move
  // below the first eight candidates under the cheap neighbourhood heuristic.
  for (const cy of [1, 4, 7])
    for (const cx of [7, 12, 17]) {
      for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]])
        g.board[(cy + dy) * g.w + cx + dx] = 1;
      g.board[(cy - 1) * g.w + cx - 1] = 2;
      g.board[(cy + 1) * g.w + cx + 1] = 2;
    }

  // The only safe defensive move is (2, 3): if red plays there, it captures
  // the blue point at (3, 3). The nine clusters are unrelated decoys.
  g.board[3 * g.w + 3] = 1;
  g.board[2 * g.w + 3] = 2;
  g.board[3 * g.w + 4] = 2;
  g.board[4 * g.w + 3] = 2;

  const cheapScore = (x: number, y: number) => {
    let own = 0;
    let enemy = 0;
    let near = 0;
    for (let i = 0; i < g.board.length; i++) {
      if (!g.board[i] || captured(g, i)) continue;
      const dx = Math.abs((i % g.w) - x);
      const dy = Math.abs(Math.floor(i / g.w) - y);
      const distance = Math.max(dx, dy);
      if (distance === 1) {
        if (g.board[i] === g.turn) own++;
        else enemy++;
      }
      if (distance === 2 && g.board[i] === g.turn) near++;
    }
    return own * 2.5 + enemy * 3 + near * 0.3 -
      (own > 4 ? 10 : 0) - Math.hypot(x - g.w / 2, y - g.h / 2) * 0.12;
  };
  const blockScore = cheapScore(2, 3);
  let betterCheapCandidates = 0;
  for (let y = 0; y < g.h; y++)
    for (let x = 0; x < g.w; x++) {
      if (!legal(g, x, y)) continue;
      const nearOccupied = g.board.some((value, i) => value &&
        Math.max(Math.abs((i % g.w) - x), Math.abs(Math.floor(i / g.w) - y)) <= 2);
      if (nearOccupied && cheapScore(x, y) > blockScore) betterCheapCandidates++;
    }

  expect(betterCheapCandidates).toBeGreaterThanOrEqual(8);
  const before = scores(g);
  const opponentThreat = play({ ...g, turn: 2 }, 2, 3);
  expect(scores(opponentThreat)[2] - before[2]).toBe(1);
  expect(computerMove(g, "normal", () => 0)).toEqual([2, 3]);
});

test("Tactique évite un gain immédiat qui ferait perdre deux points au tour adverse", () => {
  const g = createGame(13, 9);
  g.turn = 1;

  // Tempting blue capture at (2, 3): it takes one red point.
  g.board[3 * g.w + 3] = 2;
  for (const [x, y] of [
    [3, 2],
    [4, 3],
    [3, 4],
  ])
    g.board[y * g.w + x] = 1;

  // Red has a nearly closed diamond. Playing (5, 4) closes it and
  // captures both blue points inside; blue can occupy the gap first.
  for (const [x, y] of [
    [7, 2],
    [6, 3],
    [8, 3],
    [9, 4],
    [8, 5],
    [6, 5],
    [7, 6],
  ])
    g.board[y * g.w + x] = 2;
  g.board[4 * g.w + 7] = 1;
  g.board[5 * g.w + 7] = 1;

  const before = scores(g);
  const tempting = play(g, 2, 3);
  expect(scores(tempting)[1] - before[1]).toBe(1);
  const opponentReply = play(tempting, 5, 4);
  expect(scores(opponentReply)[2] - scores(tempting)[2]).toBe(2);

  const safe = play(g, 5, 4);
  expect(scores(safe)[1] - before[1]).toBe(0);
  expect(computerMove(g, "normal", () => 0)).toEqual([5, 4]);
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
  const simulationCounts: number[] = [];
  const simulationBreakdowns: Array<{ candidate: number; threat: number; reply: number; plan: number }> = [];
  let move: [number, number] | null = null;
  for (let run = 0; run < 5; run++) {
    const counts = { candidate: 0, threat: 0, reply: 0, plan: 0 };
    const started = performance.now();
    move = computerMove(g, "normal", () => 0, 600, (kind) => counts[kind]++);
    samples.push(performance.now() - started);
    simulationCounts.push(counts.candidate + counts.threat + counts.reply);
    simulationBreakdowns.push(counts);
  }
  const sorted = [...samples].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const sortedSimulationCounts = [...simulationCounts].sort((a, b) => a - b);
  const medianSimulations = sortedSimulationCounts[Math.floor(sortedSimulationCounts.length / 2)];
  const medianBreakdown = simulationBreakdowns[Math.floor(simulationBreakdowns.length / 2)];

  expect(occupied).toBeGreaterThan(100);
  expect(move).not.toBeNull();
  expect(legal(g, ...move!)).toBe(true);
  console.log(
    `[BENCHMARK 21x17] médiane ${median.toFixed(2)} ms | min ${sorted[0].toFixed(2)} ms | max ${sorted[sorted.length - 1].toFixed(2)} ms | ${occupied} pions | simulations médianes ${medianSimulations} (candidats ${medianBreakdown.candidate}, menaces ${medianBreakdown.threat}, réponses ${medianBreakdown.reply}) | plans analysés ${medianBreakdown.plan}/8 | budget 600`,
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
}, 30_000);
