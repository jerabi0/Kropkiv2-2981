import { test, expect } from "bun:test";
import { createGame, play } from "./kropki";
import {
  CADENCES,
  createMatch as newMatch,
  moveMatch,
  settleMatch,
  pauseMatch,
  resumeMatch,
  resignMatch,
  undoMatch,
  restoreMatch,
  formatClock,
} from "./timed-game";
function leading() {
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
  return g;
}
// Existing running v2 matches retain their budget and start time, including 1 min.
function createMatch(g = createGame(), minutes = 1, now = 0) {
  return restoreMatch(g, {version: 2, clock: {minutes, remaining: minutes*60000, paused:false, since: g.ended ? null : now}, snapshots: Array.from({length:g.moves.length+1}, (_,i)=>i===0&&!g.moves.length?minutes*60000:null)}, now);
}
test("cinq cadences, défaut 3 et attente du premier pion", () => {
  expect(CADENCES).toEqual([3,5,7,10,30]);
  expect(newMatch(createGame(), 1, 0).clock.minutes).toBe(3);
  for (const minutes of CADENCES) {
    const m = newMatch(createGame(), minutes, 100);
    expect(settleMatch(m, 999999).clock.remaining).toBe(minutes*60000);
    expect(m.clock.started).toBe(false);
  }
});
test("attente persiste au reload et pause ; seul le premier coup légal démarre", () => {
  let m = newMatch(createGame(), 3, 0);
  m = restoreMatch(m.game, m, 999999);
  m = resumeMatch(pauseMatch(m, 1000000), 2000000);
  expect(m.clock.since).toBeNull();
  expect(moveMatch(m, -1, -1, 3000000)).toBe(m);
  m = moveMatch(m, 1, 1, 4000000);
  expect(m.clock.remaining).toBe(180000);
  expect(m.clock.started).toBe(true);
  expect(settleMatch(m, 4001000).clock.remaining).toBe(179000);
  m = undoMatch(m, 1, 4002000);
  expect(m.game.moves).toHaveLength(0);
  expect(restoreMatch(m.game, m, 4003000).clock.remaining).toBe(177000);
});
test("budget commun : changer de joueur ne réinitialise pas le temps", () => {
  let m = moveMatch(createMatch(createGame(), 1, 0), 1, 1, 2500);
  expect(m.clock.remaining).toBe(57500);
  m = moveMatch(m, 2, 1, 3500);
  expect(m.clock.remaining).toBe(56500);
  expect(settleMatch(m, 4000).clock.remaining).toBe(56000);
  expect(m.snapshots).toEqual([60000, 57500, 56500]);
});
test("un coup occupé ne change pas le tour mais consomme le temps", () => {
  const m = moveMatch(createMatch(createGame(), 1, 0), 1, 1, 500);
  const n = moveMatch(m, 1, 1, 1000);
  expect(n.game).toBe(m.game);
  expect(n.clock.remaining).toBe(59000);
});
test("expiration égale : nul, coup tardif rejeté, pas de reprise", () => {
  const m = moveMatch(createMatch(createGame(), 1, 0), 1, 1, 60000);
  expect(m.game.moves).toHaveLength(0);
  expect(m.result).toEqual({ reason: "time", winner: null });
  expect(moveMatch(m, 2, 2, 70000)).toBe(m);
  expect(undoMatch(m, 1, 70000)).toBe(m);
});
test("fin au score indépendante du joueur au trait", () => {
  const g = leading();
  g.turn = 1;
  expect(settleMatch(createMatch(g, 1, 0), 60000).result).toEqual({
    reason: "time",
    winner: 1,
  });
  g.turn = 2;
  expect(settleMatch(createMatch(g, 1, 0), 60000).result?.winner).toBe(1);
});
test("abandon du meneur donne toujours victoire adverse et persiste", () => {
  const m = resignMatch(createMatch(leading(), 3, 0), 1, 1000);
  expect(m.result).toEqual({ reason: "resign", winner: 2, resignedBy: 1 });
  expect(m.game.ended).toBe(true);
  expect(restoreMatch(m.game, JSON.parse(JSON.stringify(m)), 30000).result).toEqual(m.result);
});
test("une expiration déjà atteinte prime sur un abandon tardif", () => {
  expect(resignMatch(createMatch(createGame(), 1, 0), 1, 60001).result?.reason).toBe("time");
});
test("pause locale ne dépense rien, refuse les coups, reprise au même temps", () => {
  const m = pauseMatch(createMatch(createGame(), 1, 0), 2000);
  expect(settleMatch(m, 100000)).toBe(m);
  expect(moveMatch(m, 1, 1, 100000)).toBe(m);
  const n = settleMatch(resumeMatch(m, 100000), 101000);
  expect(n.clock.remaining).toBe(57000);
});
test("annuler ne rembourse jamais les secondes", () => {
  let m = moveMatch(createMatch(createGame(), 1, 0), 1, 1, 2000);
  m = moveMatch(m, 2, 1, 4000);
  m = undoMatch(m, 2, 5000);
  expect(m.game.moves).toHaveLength(0);
  expect(m.clock.remaining).toBe(55000);
  expect(m.snapshots).toHaveLength(1);
});
test("reload prend en compte absence, expiration et reprise de pause", () => {
  const m = createMatch(createGame(), 1, 1000);
  expect(restoreMatch(m.game, m, 5000).clock.remaining).toBe(56000);
  expect(restoreMatch(m.game, m, 61000).result?.reason).toBe("time");
  const paused = pauseMatch(m, 2000);
  const restored = restoreMatch(paused.game, paused, 90000);
  expect(restored.clock.paused).toBe(false);
  expect(restored.clock.remaining).toBe(59000);
});
test("données anciennes ou malformées : migration sûre", () => {
  const g = leading();
  for (const data of [
    null,
    {},
    { clock: { minutes: 1, remaining: [0, -1, 1] } },
    {
      clock: {
        minutes: 1,
        remaining: [0, 60000, 60000],
        started: true,
        paused: false,
        since: "bad",
      },
    },
  ]) {
    const m = restoreMatch(g, data, 2000);
    expect(m.clock.since).toBe(2000);
    expect(m.snapshots).toHaveLength(g.moves.length + 1);
  }
});
test("aucune intersection jouable : résultat au score et horloge figée", () => {
  const g = createGame(2, 2);
  g.board = [1, 2, 1, 0];
  g.turn = 2;
  const m = moveMatch(createMatch(g, 1, 0), 1, 1, 1000);
  expect(m.game.ended).toBe(true);
  expect(m.result?.reason).toBe("full");
  expect(m.result?.winner).toBe(null);
  expect(settleMatch(m, 100000)).toBe(m);
});
test("affichage arrondi sans temps négatif", () => {
  expect(formatClock(60000)).toBe("01:00");
  expect(formatClock(1)).toBe("00:01");
  expect(formatClock(-1)).toBe("00:00");
  expect(formatClock(1800000)).toBe("30:00");
});
test("3 minutes signifient 180 secondes au total après de nombreux coups", () => {
  let m = createMatch(createGame(), 3, 0);
  for (let i = 0; i < 20; i++) m = moveMatch(m, i % 13, Math.floor(i / 13), (i + 1) * 8000);
  expect(m.game.moves.length).toBe(20);
  expect(m.clock.remaining).toBe(20000);
  expect(settleMatch(m, 179999).game.ended).toBe(false);
  expect(settleMatch(m, 180000).result?.reason).toBe("time");
});
test("migration deux pendules : déduire le temps consommé par les deux joueurs et absence", () => {
  const g = leading();
  const saved = {
    clock: { minutes: 3, remaining: [0, 170000, 160000], paused: false, since: 1000 },
    snapshots: Array.from({ length: g.moves.length + 1 }, () => [0, 175000, 175000]),
  };
  const m = restoreMatch(g, saved, 6000);
  expect(m.version).toBe(3);
  expect(m.clock.remaining).toBe(145000);
  expect(m.snapshots.every((t) => t === 170000)).toBe(true);
  expect(m.game).toBe(g);
  expect(
    restoreMatch(g, { ...saved, clock: { ...saved.clock, remaining: [0, 50000, 50000] } }, 6000)
      .result?.reason,
  ).toBe("time");
});
test("migration ancien abandon conserve le résultat adverse", () => {
  const g = { ...leading(), ended: true };
  const m = restoreMatch(
    g,
    {
      clock: { minutes: 1, remaining: [0, 50000, 50000], paused: false, since: null },
      result: { reason: "resign", winner: 2, resignedBy: 1 },
    },
    10000,
  );
  expect(m.result).toEqual({ reason: "resign", winner: 2, resignedBy: 1 });
});
test("absence de données historiques : temps non inventé", () => {
  const m = restoreMatch(leading(), null, 0);
  expect(m.snapshots.every((t) => t === null)).toBe(true);
});
test("temps restant nul expire aussi sans elapsed, pause trop tardive ne ressuscite rien", () => {
  const m = createMatch(createGame(), 1, 0);
  m.clock.remaining = 0;
  expect(settleMatch(m, 0).game.ended).toBe(true);
  expect(pauseMatch(m, 0).clock.paused).toBe(false);
});
test("sauvegarde invalide : pas de NaN, résultat au score recalculé", () => {
  const m = createMatch(leading(), 1, 0);
  expect(
    restoreMatch(m.game, { ...m, clock: { ...m.clock, remaining: NaN } }, 0).clock.remaining,
  ).toBe(180000);
  expect(
    restoreMatch({ ...m.game, ended: true }, { ...m, result: { reason: "time", winner: 2 } }, 0)
      .result?.winner,
  ).toBe(1);
});
