import { createGame, legal, play, type Game } from "./kropki";
import { EXERCISES } from "./training-exercises";

export const PROGRESS_KEY = "kropki-training-progress-v1";
export const SANDBOX_KEY = "kropki-training-sandbox-v1";
export const TRAINING_SIZES = [
  { w: 9, h: 9 },
  { w: 13, h: 11 },
  { w: 17, h: 13 },
] as const;
export type Progress = Record<string, { solved: true; unassisted: boolean }>;

export function restoreProgress(raw: string | null): Progress {
  try {
    const value = JSON.parse(raw ?? "null");
    if (value?.version !== 1 || !value.completed || typeof value.completed !== "object") return {};
    return Object.fromEntries(
      EXERCISES.filter((e) => value.completed[e.id]?.solved === true).map((e) => [
        e.id,
        { solved: true, unassisted: value.completed[e.id].unassisted === true },
      ]),
    );
  } catch {
    return {};
  }
}
export function completeExercise(progress: Progress, id: string, assisted: boolean): Progress {
  if (!EXERCISES.some((e) => e.id === id)) return progress;
  return {
    ...progress,
    [id]: { solved: true, unassisted: progress[id]?.unassisted === true || !assisted },
  };
}
export function restoreSandbox(raw: string | null): Game {
  const fallback = () => createGame(9, 9);
  try {
    const value = JSON.parse(raw ?? "null");
    if (
      value?.version !== 1 ||
      !TRAINING_SIZES.some((s) => s.w === value.w && s.h === value.h) ||
      !Array.isArray(value.moves) ||
      value.moves.length > value.w * value.h
    )
      return fallback();
    let game = createGame(value.w, value.h);
    for (const m of value.moves) {
      if (
        !m ||
        !Number.isInteger(m.x) ||
        !Number.isInteger(m.y) ||
        m.player !== game.turn ||
        !legal(game, m.x, m.y)
      )
        return fallback();
      game = play(game, m.x, m.y);
    }
    return game;
  } catch {
    return fallback();
  }
}
export const serializeSandbox = (g: Game) =>
  JSON.stringify({ version: 1, w: g.w, h: g.h, moves: g.moves });
export const serializeProgress = (p: Progress) => JSON.stringify({ version: 1, completed: p });
