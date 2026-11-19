import { createGame, legal, play } from "./kropki";
import { createMatch, restoreMatch } from "./timed-game";

export function restoreLocalMatch(raw: string | null, now = Date.now()) {
  const fallback = (warning = "") => ({
    match: createMatch(createGame(), 3, now), mode: "computer", level: "normal", warning,
  });
  if (raw === null) return fallback();
  try {
    const s = JSON.parse(raw);
    const sizes = [{w:13,h:11},{w:17,h:13},{w:21,h:17}];
    if (!s || !sizes.some(v => v.w === s.game?.w && v.h === s.game?.h) ||
        !Array.isArray(s.game.moves) || s.game.moves.length > s.game.w * s.game.h ||
        typeof s.game.ended !== "boolean") throw new Error("Invalid save");
    let game = createGame(s.game.w, s.game.h);
    for (const m of s.game.moves) {
      if (!m || !Number.isInteger(m.x) || !Number.isInteger(m.y) ||
          m.player !== game.turn || !legal(game, m.x, m.y)) throw new Error("Invalid move");
      game = play(game, m.x, m.y);
    }
    // Board, territories and scores are recomputed; saved arrays are never trusted.
    return { match: restoreMatch({...game, ended: game.ended || s.game.ended}, s, now),
      mode: s.mode === "local" ? "local" : "computer",
      level: s.level === "easy" ? "easy" : "normal", warning: "" };
  } catch {
    return fallback("Sauvegarde locale illisible : une nouvelle partie a été ouverte.");
  }
}