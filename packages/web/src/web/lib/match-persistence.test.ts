import { expect, test } from "bun:test";
import { createMatch, moveMatch, settleMatch, pauseMatch, resumeMatch, undoMatch, resignMatch } from "./timed-game";
import { restoreLocalMatch } from "./local-match";
import { needsMatchSave } from "./match-persistence";

const save = (match: ReturnType<typeof createMatch>) => ({match, mode:"human", level:"normal"});

test("ticks need no writes and reload still charges the full elapsed time", () => {
  const m = moveMatch(createMatch(undefined, 3, 1000), 3, 2, 1000);
  const anchor = save(m);
  expect(needsMatchSave(null, anchor)).toBe(true);
  for (let t = 1200; t <= 11000; t += 200) {
    expect(needsMatchSave(anchor, save(settleMatch(m, t)))).toBe(false);
  }
  const restored = restoreLocalMatch(JSON.stringify({...m, mode:"human", level:"normal"}), 11000);
  expect(restored.match.clock.remaining).toBe(170000);
  expect(restored.match.game.moves.length).toBe(1);
});

test("moves, undo, pause, resume, result, settings and reset save immediately", () => {
  const empty = createMatch(undefined, 3, 1000);
  const active = moveMatch(empty, 3, 2, 1000);
  const paused = pauseMatch(active, 2000);
  const resumed = resumeMatch(paused, 3000);
  for (const [a,b] of [[empty,active], [active,moveMatch(active,4,2,2000)], [active,undoMatch(active,1,2000)], [active,paused], [paused,resumed], [active,resignMatch(active,1,2000)], [active,settleMatch(active,181000)], [active,createMatch()]]) {
    expect(needsMatchSave(save(a), save(b))).toBe(true);
  }
  expect(needsMatchSave(save(active), {...save(active),mode:"computer"})).toBe(true);
  expect(needsMatchSave(save(active), {...save(active),level:"hard"})).toBe(true);
  const restored = restoreLocalMatch(JSON.stringify({...paused,mode:"human",level:"normal"}),10000);
  expect(restored.match.clock.remaining).toBe(179000);
});