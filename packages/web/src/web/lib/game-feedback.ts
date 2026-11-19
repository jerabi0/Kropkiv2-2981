import { captured, scores, type Game, type Zone } from "./kropki";
export const zoneKey = (z: Zone) => `${z.player}:${z.cells.join(",")}`;
export type Feedback = {
  id: number;
  deltas: number[];
  captured: number[];
  liberated: number[];
  zones: string[];
};
export function gameFeedback(before: Game, after: Game): Feedback | null {
  const bs = scores(before),
    as = scores(after);
  const newlyCaptured: number[] = [],
    liberated: number[] = [];
  for (let i = 0; i < after.board.length; i++) {
    if (captured(after, i) && (!captured(before, i) || before.territory[i] !== after.territory[i]))
      newlyCaptured.push(i);
    if (captured(before, i) && !captured(after, i)) liberated.push(i);
  }
  if (!newlyCaptured.length && !liberated.length) return null;
  const previous = new Set(before.zones.map(zoneKey));
  return {
    id: after.moves.length,
    deltas: as.map((v, i) => v - bs[i]),
    captured: newlyCaptured,
    liberated,
    zones: after.zones.map(zoneKey).filter((k) => !previous.has(k)),
  };
}
export function reviewPosition(g: Game, count: number) {
  return Math.max(0, Math.min(g.moves.length, Math.trunc(count)));
}
