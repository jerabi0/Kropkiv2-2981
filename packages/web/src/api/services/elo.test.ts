import { describe, test, expect } from "bun:test";
import { eloDelta, eligible, matchingWindow } from "./elo";
import { newOnlineGame, expire, act } from "./online-game";
describe("Elo et appariement", () => {
  test("égal niveau : victoire +16, défaite -16, nul 0", () => {
    expect(eloDelta(1200, 1200, 1)).toBe(16);
    expect(eloDelta(1200, 1200, 2)).toBe(-16);
    expect(eloDelta(1200, 1200, null)).toBe(0);
  });
  test("une surprise vaut plus, et les variations restent bornées", () => {
    expect(eloDelta(1000, 1400, 1)).toBe(29);
    expect(eloDelta(1400, 1000, 1)).toBe(3);
    for (const w of [1, 2, null] as const)
      for (const a of [400, 1200, 2400])
        expect(Math.abs(eloDelta(a, 1200, w))).toBeLessThanOrEqual(32);
  });
  test("nul défavorable au joueur mieux classé", () => {
    expect(eloDelta(1400, 1000, null)).toBe(-13);
  });
  test("pas d'auto-appariement ou de mélange de critères", () => {
    const a = { userId: "a", size: 17, minutes: 3, elo: 1200, joinedAt: 1000 };
    expect(eligible(a, a, 1000)).toBe(false);
    expect(eligible(a, { ...a, userId: "b" }, 1000)).toBe(true);
    expect(eligible(a, { ...a, userId: "b", size: 13 }, 1000)).toBe(false);
    expect(eligible(a, { ...a, userId: "b", minutes: 5 }, 1000)).toBe(false);
  });
  test("fenêtre élargie après attente, borne et ordre des horloges", () => {
    const a = { userId: "a", size: 17, minutes: 3, elo: 1200, joinedAt: 0 },
      b = { ...a, userId: "b", elo: 1500 };
    expect(eligible(a, b, 0)).toBe(false);
    expect(eligible(a, b, 30000)).toBe(true);
    expect(matchingWindow(0, 1000000)).toBe(1000);
    expect(matchingWindow(1000, 0)).toBe(100);
  });
  test("salle classée non prête annulée sans résultat Elo", () => {
    const g = {
      ...newOnlineGame({ id: "a", name: "A" }, 17, 3, 0),
      red: { id: "b", name: "B" },
      ranked: true,
      expiresAt: 1000,
    };
    expect(() => act(g, "a", { type: "resign" }, "r", 500)).toThrow();
    const s = expire(g, 1000);
    expect(s.cancelled).toBe(true);
    expect(s.result).toBeNull();
    expect(act(s, "b", { type: "ready" }, "r", 1100).startedAt).toBeNull();
  });
});
