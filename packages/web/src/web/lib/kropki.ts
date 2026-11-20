export type Player = 1 | 2;
export type Move = { x: number; y: number; player: Player };
export type Zone = { player: Player; cells: number[]; edges: number[][] };
export type Game = {
  w: number;
  h: number;
  board: number[];
  territory: number[];
  zones: Zone[];
  moves: Move[];
  turn: Player;
  ended: boolean;
};
export const other = (p: Player): Player => (p === 1 ? 2 : 1);
export const createGame = (w = 17, h = 13): Game => ({
  w,
  h,
  board: Array(w * h).fill(0),
  territory: Array(w * h).fill(0),
  zones: [],
  moves: [],
  turn: 1,
  ended: false,
});
export function captured(g: Game, i: number) {
  return !!g.board[i] && !!g.territory[i] && g.territory[i] !== g.board[i];
}
export function scores(g: Game) {
  const s = [0, 0, 0];
  g.board.forEach((_, i) => {
    if (captured(g, i)) s[g.territory[i]]++;
  });
  return s;
}
export function legal(g: Game, x: number, y: number) {
  return (
    !g.ended &&
    Number.isInteger(x) &&
    Number.isInteger(y) &&
    x >= 0 &&
    x < g.w &&
    y >= 0 &&
    y < g.h &&
    !g.board[y * g.w + x] &&
    !g.territory[y * g.w + x]
  );
}
// Rasterize the 8-neighbour chains at double resolution. Four-way flood fill
// cannot cross a diagonal chain, but can reach any unclosed region from outside.
function enclosures(g: Game, p: Player) {
  const rw = g.w * 2 + 3,
    rh = g.h * 2 + 3,
    wall = new Uint8Array(rw * rh),
    active = (i: number) => g.board[i] === p && !captured(g, i);
  const allEdges: number[][] = [];
  for (let y = 0; y < g.h; y++)
    for (let x = 0; x < g.w; x++) {
      const i = y * g.w + x;
      if (!active(i)) continue;
      const xx = 2 * x + 2,
        yy = 2 * y + 2;
      wall[yy * rw + xx] = 1;
      for (const [dx, dy] of [
        [1, 0],
        [0, 1],
        [1, 1],
        [-1, 1],
      ]) {
        const nx = x + dx,
          ny = y + dy;
        if (nx < 0 || nx >= g.w || ny >= g.h || !active(ny * g.w + nx)) continue;
        wall[(yy + dy) * rw + xx + dx] = 1;
        allEdges.push([x, y, nx, ny]);
      }
    }
  const visited = new Uint8Array(rw * rh),
    zones: Zone[] = [];
  for (let start = 0; start < wall.length; start++) {
    if (wall[start] || visited[start]) continue;
    const stack = [start],
      cells: number[] = [],
      inside: number[] = [],
      touching = new Set<number>();
    visited[start] = 1;
    let outside = false;
    for (let a = 0; a < stack.length; a++) {
      const t = stack[a],
        x = t % rw,
        y = Math.floor(t / rw);
      cells.push(t);
      if (x === 0 || y === 0 || x === rw - 1 || y === rh - 1) outside = true;
      if (x >= 2 && y >= 2 && x <= 2 * g.w && y <= 2 * g.h && x % 2 === 0 && y % 2 === 0)
        inside.push(((y - 2) / 2) * g.w + (x - 2) / 2);
      for (const n of [
        x > 0 ? t - 1 : -1,
        x < rw - 1 ? t + 1 : -1,
        y > 0 ? t - rw : -1,
        y < rh - 1 ? t + rw : -1,
      ]) {
        if (n < 0) continue;
        if (wall[n]) {
          touching.add(n);
          continue;
        }
        if (!visited[n]) {
          visited[n] = 1;
          stack.push(n);
        }
      }
    }
    if (outside || !inside.some((i) => g.board[i] === other(p) && g.territory[i] !== p)) continue;
    inside.forEach((i) => (g.territory[i] = p));
    const edges = allEdges.filter(([x, y, nx, ny]) => touching.has((y + ny + 2) * rw + x + nx + 2));
    zones.push({ player: p, cells, edges });
  }
  if (zones.length) {
    // An outer capture absorbs enclosed older regions (and releases own dots).
    g.zones = g.zones.filter((z) => !z.cells.some((c) => zones.some((n) => n.cells.includes(c))));
    g.zones.push(...zones);
  }
}
export function play(g: Game, x: number, y: number): Game {
  if (!legal(g, x, y)) return g;
  const n: Game = {
    ...g,
    board: [...g.board],
    territory: [...g.territory],
    zones: [...g.zones],
    moves: [...g.moves, { x, y, player: g.turn }],
    turn: other(g.turn),
  };
  n.board[y * g.w + x] = g.turn;
  enclosures(n, g.turn);
  if (!captured(n, y * g.w + x)) enclosures(n, other(g.turn));
  if (!n.board.some((v, i) => !v && !n.territory[i])) n.ended = true;
  return n;
}
export function replay(moves: Move[], w: number, h: number) {
  let g = createGame(w, h);
  for (const m of moves) g = play(g, m.x, m.y);
  return g;
}

type RankedMove = { index: number; value: number };

function candidateIndices(g: Game) {
  const candidates: number[] = [];
  const occupied = g.board.map((v, i) => (v ? i : -1)).filter((i) => i >= 0);
  for (let i = 0; i < g.board.length; i++) {
    const x = i % g.w;
    const y = Math.floor(i / g.w);
    if (
      legal(g, x, y) &&
      (!occupied.length ||
        occupied.some(
          (j) =>
            Math.max(
              Math.abs((j % g.w) - x),
              Math.abs(Math.floor(j / g.w) - y),
            ) <= 2,
        ))
    )
      candidates.push(i);
  }
  if (!candidates.length)
    for (let i = 0; i < g.board.length; i++)
      if (legal(g, i % g.w, Math.floor(i / g.w))) candidates.push(i);
  return { candidates, occupied };
}

function cheapCandidateValue(g: Game, index: number, occupied: number[]) {
  const x = index % g.w;
  const y = Math.floor(index / g.w);
  const p = g.turn;
  let own = 0;
  let enemy = 0;
  let near = 0;
  for (const j of occupied) {
    if (captured(g, j)) continue;
    const dx = Math.abs((j % g.w) - x);
    const dy = Math.abs(Math.floor(j / g.w) - y);
    const distance = Math.max(dx, dy);
    if (distance === 1) {
      if (g.board[j] === p) own++;
      else enemy++;
    }
    if (distance === 2 && g.board[j] === p) near++;
  }
  return (
    own * 2.5 +
    enemy * 3 +
    near * 0.3 -
    (own > 4 ? 10 : 0) -
    Math.hypot(x - g.w / 2, y - g.h / 2) * 0.12
  );
}

function heuristicValue(
  g: Game,
  index: number,
  level: string,
  rng: () => number,
  before: number[],
  occupied: number[],
) {
  const x = index % g.w;
  const y = Math.floor(index / g.w);
  const p = g.turn;
  const q = other(p);
  const next = play(g, x, y);
  const nextScores = scores(next);
  let value = (nextScores[p] - before[p]) * 100 - (nextScores[q] - before[q]) * 110;

  if (level !== "easy") {
    const threat = play({ ...g, turn: q }, x, y);
    const threatScores = scores(threat);
    value += (threatScores[q] - before[q]) * 85;
  }

  value += cheapCandidateValue(g, index, occupied);
  value += rng() * (level === "easy" ? 12 : 1.8);
  return value;
}

export function computerMove(
  g: Game,
  level = "normal",
  rng: () => number = Math.random,
  simulationBudget = 600,
): [number, number] | null {
  const { candidates, occupied } = candidateIndices(g);
  if (!candidates.length) return null;

  const cheapRanked = candidates
    .map((index) => ({ index, value: cheapCandidateValue(g, index, occupied) }))
    .sort((a, b) => b.value - a.value || a.index - b.index);

  const budget = Math.max(0, Math.floor(simulationBudget));
  const classificationBudget = level === "easy" ? budget : Math.floor(budget / 2);
  const replyBudget = level === "easy" ? 0 : budget - classificationBudget;
  const before = scores(g);
  const ranked: RankedMove[] = [];
  let classificationSimulations = 0;
  const simulationsPerCandidate = level === "easy" ? 1 : 2;

  // Cheaply rank the whole board first, then spend the expensive budget on the
  // most promising positions instead of scanning from the top-left corner.
  for (const candidate of cheapRanked) {
    if (classificationSimulations + simulationsPerCandidate > classificationBudget) break;
    ranked.push({
      index: candidate.index,
      value: heuristicValue(g, candidate.index, level, rng, before, occupied),
    });
    classificationSimulations += simulationsPerCandidate;
  }

  // Even a zero budget must produce a legal move whenever one exists.
  if (!ranked.length) {
    const fallback = cheapRanked[0].index;
    return [fallback % g.w, Math.floor(fallback / g.w)];
  }

  ranked.sort((a, b) => b.value - a.value || a.index - b.index);

  // Découverte keeps the original one-ply heuristic and its wider random margin.
  if (level === "easy") {
    const choice = ranked[0].index;
    return [choice % g.w, Math.floor(choice / g.w)];
  }

  // Tactique examines the eight strongest first moves. Each receives an equal
  // reply-simulation allowance, making the search deterministic across devices.
  const shortlist = ranked.slice(0, 8);
  const p = g.turn;
  const q = other(p);
  const perCandidateReplyBudget =
    shortlist.length > 0 ? Math.floor(replyBudget / shortlist.length) : 0;
  let best: RankedMove | null = null;

  for (const candidate of shortlist) {
    const x = candidate.index % g.w;
    const y = Math.floor(candidate.index / g.w);
    const after = play(g, x, y);
    const afterScores = scores(after);
    const { candidates: replies, occupied: replyOccupied } = candidateIndices(after);
    const replyRanked = replies
      .map((index) => ({
        index,
        value: cheapCandidateValue(after, index, replyOccupied),
      }))
      .sort((a, b) => b.value - a.value || a.index - b.index);

    let strongestReply = 0;
    const repliesToCheck = replyRanked.slice(0, perCandidateReplyBudget);
    for (const reply of repliesToCheck) {
      const replyGame = play(after, reply.index % g.w, Math.floor(reply.index / g.w));
      const replyScores = scores(replyGame);
      const replyValue =
        (replyScores[q] - afterScores[q]) * 100 -
        (replyScores[p] - afterScores[p]) * 110;
      if (replyValue > strongestReply) strongestReply = replyValue;
    }

    const value = candidate.value - strongestReply;
    if (!best || value > best.value) best = { index: candidate.index, value };
  }

  const choice = (best ?? ranked[0]).index;
  return [choice % g.w, Math.floor(choice / g.w)];
}
