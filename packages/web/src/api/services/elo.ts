export function eloDelta(blue: number, red: number, winner: 1 | 2 | null): number {
  const expected = 1 / (1 + 10 ** ((red - blue) / 400));
  const score = winner === null ? 0.5 : winner === 1 ? 1 : 0;
  return Math.round(32 * (score - expected));
}
export function matchingWindow(joinedAt: number, now: number) {
  return Math.min(1000, 100 + Math.floor(Math.max(0, now - joinedAt) / 15000) * 100);
}
export function eligible(
  a: { userId: string; size: number; minutes: number; elo: number; joinedAt: number },
  b: typeof a,
  now: number,
) {
  return (
    a.userId !== b.userId &&
    a.size === b.size &&
    a.minutes === b.minutes &&
    Math.abs(a.elo - b.elo) <=
      Math.max(matchingWindow(a.joinedAt, now), matchingWindow(b.joinedAt, now))
  );
}
