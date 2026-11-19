import { test, expect } from "bun:test";
import { restoreLocalMatch } from "./local-match";
import { createGame, play } from "./kropki";
import { createMatch, moveMatch } from "./timed-game";
import { readStorage, writeStorage, removeStorage } from "./browser-storage";

test("local save: exact sizes, legal turns, bounded history", () => {
  const base = { ...createMatch(createGame(), 3, 100), mode:"local", level:"easy" };
  for (const game of [
    {...base.game, h:2}, {...base.game, h:1000000},
    {...base.game, moves:[{x:1.5,y:2,player:1}]},
    {...base.game, moves:[{x:1,y:2,player:2}]},
    {...base.game, moves:[{x:1,y:2,player:1},{x:1,y:2,player:2}]},
    {...base.game, moves:Array(222).fill({x:1,y:1,player:1})},
    {...base.game, moves:null},
  ]) {
    const s=restoreLocalMatch(JSON.stringify({...base,game}),200);
    expect(s.match.game.w).toBe(17); expect(s.match.game.h).toBe(13);
    expect(s.match.game.moves).toHaveLength(0); expect(s.warning).not.toBe("");
  }
  expect(restoreLocalMatch("{broken").warning).not.toBe("");
  expect(restoreLocalMatch(null).warning).toBe("");
});
test("valid saved match recomputes scores and preserves running clock", () => {
  const m=moveMatch(createMatch(createGame(),3,0),3,2,1000);
  const s=restoreLocalMatch(JSON.stringify({...m,mode:"local",level:"easy",game:{...m.game,board:[2],territory:[2]}}),3000);
  expect(s.match.clock.remaining).toBe(178000);
  expect(s.match.game.board).toEqual(m.game.board);
  expect(s.mode).toBe("local"); expect(s.level).toBe("easy");
  expect(s.warning).toBe("");
});
test("legacy one minute running and resignation survive strict restore", () => {
  const game=play(createGame(),1,1);
  const s=restoreLocalMatch(JSON.stringify({version:2,game:{...game,ended:true},clock:{minutes:1,remaining:50000,paused:false,since:null},result:{reason:"resign",winner:2,resignedBy:1}}),999999);
  expect(s.match.result).toEqual({reason:"resign",winner:2,resignedBy:1});
  expect(s.match.clock.minutes).toBe(1);
});
test("blocked storage getters and writes never escape callbacks", () => {
  const blocked=():Storage=>{throw new Error("Denied");};
  expect(readStorage(blocked,"key")).toBeNull();
  expect(writeStorage(blocked,"key","value")).toBe(false);
  expect(()=>removeStorage(blocked,"key")).not.toThrow();
});