import { describe, expect, test } from "bun:test";
import { captured, createGame, legal, other, play, scores } from "./kropki";
import { EXERCISES, attemptExercise } from "./training-exercises";
import { analyzePosition, immediateCaptures, moveImpact } from "./training-analysis";
import {
  completeExercise,
  restoreProgress,
  restoreSandbox,
  serializeProgress,
  serializeSandbox,
} from "./training-storage";

describe("Exercices avec le vrai moteur", () => {
  for (const e of EXERCISES) {
    test(`${e.id} : solution réelle et source intacte`, () => {
      const g = e.create(),
        before = JSON.stringify(g);
      expect(legal(g, ...e.solution)).toBe(true);
      const result = attemptExercise(e, g, ...e.solution);
      expect(result.success).toBe(true);
      expect(result.game.moves.length).toBe(g.moves.length + 1);
      expect(JSON.stringify(g)).toBe(before);
      if (e.goal.defense) {
        expect(immediateCaptures({ ...g, turn: other(g.turn) }).length).toBeGreaterThan(0);
        expect(immediateCaptures(result.game)).toEqual([]);
      }
      if (e.goal.liberations) {
        expect(scores(g)[2]).toBe(1);
        expect(captured(g, 4 * 9 + 4)).toBe(true);
        expect(captured(result.game, 4 * 9 + 4)).toBe(false);
        expect(scores(result.game).slice(1)).toEqual([4, 0]);
      }
    });
    test(`${e.id} : mauvais coup et intersection occupée ne réussissent pas`, () => {
      const g = e.create();
      expect(attemptExercise(e, g, 0, 0).success).toBe(false);
      const i = g.board.findIndex((p) => p !== 0);
      const occupied = attemptExercise(e, g, i % g.w, Math.floor(i / g.w));
      expect(occupied.success).toBe(false);
      expect(occupied.game).toBe(g);
    });
  }
  test("une solution alternative valable est acceptée, sans comparer seulement les coordonnées", () => {
    const e = EXERCISES[1];
    expect(attemptExercise(e, e.create(), 3, 1).success).toBe(true);
  });
});

describe("Analyse tactique déterministe", () => {
  test("chaque suggestion des six positions atteint réellement son objectif", () => {
    for (const e of EXERCISES) {
      const g = e.create(),
        before = JSON.stringify(g),
        a = analyzePosition(g);
      expect(a.suggestion).not.toBeNull();
      expect(attemptExercise(e, g, a.suggestion!.x, a.suggestion!.y).success).toBe(true);
      expect(analyzePosition(g)).toEqual(a);
      expect(JSON.stringify(g)).toBe(before);
    }
  });
  test("captures, libérations et variations sont distinguées", () => {
    const e = EXERCISES[4],
      impact = moveImpact(e.create(), ...e.solution)!;
    expect(impact).toMatchObject({
      captured: 4,
      liberated: 1,
      ownDelta: 4,
      enemyDelta: -1,
      selfCaptured: false,
    });
  });
  test("plateau vide : aucun faux meilleur coup ou menace", () => {
    expect(analyzePosition(createGame(9, 9))).toMatchObject({
      legalCount: 81,
      captures: [],
      threats: [],
      suggestion: null,
    });
  });
  test("plateau terminé : aucune suggestion", () => {
    expect(analyzePosition({ ...createGame(9, 9), ended: true })).toMatchObject({
      legalCount: 0,
      captures: [],
      threats: [],
      suggestion: null,
    });
  });
  test("intrusion dans une maison adverse vide est identifiée comme auto-capture", () => {
    let g = createGame(7, 7);
    for (const [x, y] of [
      [3, 2],
      [4, 3],
      [3, 4],
    ])
      g.board[y * 7 + x] = 1;
    g = play(g, 2, 3);
    expect(moveImpact(g, 3, 3)).toMatchObject({ selfCaptured: true, ownDelta: 0, enemyDelta: 1 });
  });
});

describe("Sauvegardes séparées et validation", () => {
  test("progression réelle, IDs connus uniquement et aide conservée", () => {
    let p = completeExercise({}, EXERCISES[0].id, true);
    expect(p[EXERCISES[0].id].unassisted).toBe(false);
    p = completeExercise(p, EXERCISES[0].id, false);
    p = completeExercise(p, EXERCISES[0].id, true);
    expect(p[EXERCISES[0].id].unassisted).toBe(true);
    expect(completeExercise(p, "fake", false)).toBe(p);
    expect(restoreProgress(serializeProgress(p))).toEqual(p);
    expect(
      restoreProgress(
        '{"version":1,"completed":{"fake":{"solved":true},"capture-diagonale":{"solved":"yes"}}}',
      ),
    ).toEqual({});
  });
  test("JSON absent/malformé/version inconnue restaure un état sûr", () => {
    for (const raw of [null, "{", "null", "[]", '{"version":9}', '{"version":1,"completed":null}'])
      expect(restoreProgress(raw)).toEqual({});
    for (const raw of [
      null,
      "{",
      "null",
      "[]",
      '{"version":9}',
      '{"version":1,"w":10000,"h":10000,"moves":[]}',
    ])
      expect(restoreSandbox(raw)).toEqual(createGame(9, 9));
  });
  test("plateau libre reconstitué depuis ses coups, captures et annulation fidèles", () => {
    let g = createGame(9, 9);
    for (const [x, y] of [
      [3, 2],
      [3, 3],
      [4, 3],
      [7, 7],
      [3, 4],
      [8, 7],
      [2, 3],
    ])
      g = play(g, x, y);
    expect(scores(g)[1]).toBe(1);
    expect(restoreSandbox(serializeSandbox(g))).toEqual(g);
  });
  test("coups répétés, non entiers, mauvais tours ou hors plateau rejetés", () => {
    for (const moves of [
      [{ x: 0, y: 0, player: 2 }],
      [{ x: 1.2, y: 0, player: 1 }],
      [{ x: -1, y: 0, player: 1 }],
      [{ x: 9, y: 0, player: 1 }],
      [null],
      [
        { x: 0, y: 0, player: 1 },
        { x: 0, y: 0, player: 2 },
      ],
    ])
      expect(restoreSandbox(JSON.stringify({ version: 1, w: 9, h: 9, moves }))).toEqual(
        createGame(9, 9),
      );
  });
});
