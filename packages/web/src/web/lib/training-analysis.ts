import { captured, legal, other, play, scores, type Game, type Player } from "./kropki";

export type TacticalMove = {
  x: number;
  y: number;
  captured: number;
  liberated: number;
  ownDelta: number;
  enemyDelta: number;
  selfCaptured: boolean;
};
export type PositionAnalysis = {
  player: Player;
  captures: TacticalMove[];
  threats: TacticalMove[];
  suggestion: { x: number; y: number; explanation: string } | null;
  legalCount: number;
};
export const coordinate = (x: number, y: number) => `${String.fromCharCode(65 + x)}${y + 1}`;

export function moveImpact(g: Game, x: number, y: number): TacticalMove | null {
  if (!legal(g, x, y)) return null;
  const n = play(g, x, y),
    p = g.turn,
    q = other(p);
  const before = scores(g),
    after = scores(n);
  let gained = 0,
    liberated = 0;
  for (let i = 0; i < g.board.length; i++) {
    if (n.board[i] === q && captured(n, i) && !captured(g, i)) gained++;
    if (g.board[i] === p && captured(g, i) && !captured(n, i)) liberated++;
  }
  return {
    x,
    y,
    captured: gained,
    liberated,
    ownDelta: after[p] - before[p],
    enemyDelta: after[q] - before[q],
    selfCaptured: captured(n, y * g.w + x),
  };
}

/** Exhaustive immediate captures only, not a prediction of a whole game. */
export function immediateCaptures(g: Game): TacticalMove[] {
  const moves: TacticalMove[] = [];
  for (let y = 0; y < g.h; y++)
    for (let x = 0; x < g.w; x++) {
      const impact = moveImpact(g, x, y);
      if (impact && (impact.captured > 0 || impact.liberated > 0)) moves.push(impact);
    }
  return moves.sort(
    (a, b) =>
      b.ownDelta - b.enemyDelta - (a.ownDelta - a.enemyDelta) ||
      b.liberated - a.liberated ||
      a.y - b.y ||
      a.x - b.x,
  );
}

export function analyzePosition(g: Game): PositionAnalysis {
  const captures = immediateCaptures(g),
    threats = immediateCaptures({ ...g, turn: other(g.turn) });
  const legalCount = g.board.filter((_, i) => legal(g, i % g.w, Math.floor(i / g.w))).length;
  let suggestion: PositionAnalysis["suggestion"] = null;
  const gain = captures.find((c) => !c.selfCaptured && c.ownDelta - c.enemyDelta > 0);
  if (gain) {
    suggestion = {
      x: gain.x,
      y: gain.y,
      explanation: `${coordinate(gain.x, gain.y)} capture ${gain.captured} point(s) adverse(s)${gain.liberated ? ` et libère ${gain.liberated} de tes points` : ""}. C'est un gain immédiat vérifié, pas une garantie sur la suite.`,
    };
  } else if (threats.length) {
    // Verify a blocking move against every immediate opponent reply.
    for (const t of threats) {
      const next = play(g, t.x, t.y);
      if (!captured(next, t.y * g.w + t.x) && !immediateCaptures(next).length) {
        suggestion = {
          x: t.x,
          y: t.y,
          explanation: `Occuper ${coordinate(t.x, t.y)} empêche toutes les captures adverses au coup suivant dans cette position. Cela ne prédit pas les menaces à plusieurs coups.`,
        };
        break;
      }
    }
  }
  return { player: g.turn, captures, threats, suggestion, legalCount };
}
