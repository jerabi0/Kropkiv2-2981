import { useState } from "react";
import "../capture-effects.css";
import { captured, legal, type Game } from "../lib/kropki";
import { zoneKey, type Feedback } from "../lib/game-feedback";
export const playerColors = ["", "#255bfa", "#f26367"];
export function GameBoard({
  game,
  locked = false,
  onMove,
  feedback = null,
  target,
  selection,
  previewGame,
  ariaLabel = "Plateau Kropki : sélectionne une intersection pour poser un point",
}: {
  game: Game;
  locked?: boolean;
  onMove: (x: number, y: number) => void;
  feedback?: Feedback | null;
  target?: [number, number];
  selection?: [number, number];
  previewGame?: Game;
  ariaLabel?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const spacing = 32,
    pad = 26,
    vw = (game.w - 1) * spacing + pad * 2,
    vh = (game.h - 1) * spacing + pad * 2,
    last = game.moves.at(-1);
  return (
    <div className={"board-paper " + (locked ? "board-locked" : "")}>
      <svg
        className="game-board"
        viewBox={`0 0 ${vw} ${vh}`}
        aria-label={ariaLabel}
        onMouseLeave={() => setHover(null)}
      >
        {Array.from({ length: game.w }, (_, x) => (
          <text
            key={"cx" + x}
            x={pad + x * spacing}
            y={12}
            className="coordinate"
            textAnchor="middle"
          >
            {String.fromCharCode(65 + x)}
          </text>
        ))}
        {Array.from({ length: game.h }, (_, y) => (
          <text
            key={"cy" + y}
            x={9}
            y={pad + y * spacing + 3}
            className="coordinate"
            textAnchor="middle"
          >
            {y + 1}
          </text>
        ))}
        {Array.from({ length: game.w }, (_, x) => (
          <line
            key={"v" + x}
            x1={pad + x * spacing}
            x2={pad + x * spacing}
            y1={pad}
            y2={vh - pad}
            className="grid-line"
          />
        ))}
        {Array.from({ length: game.h }, (_, y) => (
          <line
            key={"h" + y}
            y1={pad + y * spacing}
            y2={pad + y * spacing}
            x1={pad}
            x2={vw - pad}
            className="grid-line"
          />
        ))}
        {game.zones.map((z) => {
          const key = zoneKey(z),
            fresh = feedback?.zones.includes(key);
          return (
            <g key={key} pointerEvents="none" className={fresh ? "new-capture-zone" : ""}>
              {z.cells.map((c, cellIndex) => {
                const rw = game.w * 2 + 3;
                return (
                  <rect
                    key={c}
                    x={pad + (((c % rw) - 2) * spacing) / 2 - spacing / 4}
                    y={pad + ((Math.floor(c / rw) - 2) * spacing) / 2 - spacing / 4}
                    width={spacing / 2 + 0.1}
                    height={spacing / 2 + 0.1}
                    fill={playerColors[z.player]}
                    fillOpacity={fresh ? ".19" : ".10"}
                    className={fresh ? "territory-fill capture-cell" : "territory-fill"}
                    style={fresh ? { animationDelay: `${Math.min(cellIndex, 24) * 18}ms` } : undefined}
                  />
                );
              })}
              {z.edges.map(([x, y, nx, ny], j) => (
                <line
                  key={j}
                  x1={pad + x * spacing}
                  y1={pad + y * spacing}
                  x2={pad + nx * spacing}
                  y2={pad + ny * spacing}
                  stroke={playerColors[z.player]}
                  strokeWidth={fresh ? "2.8" : "2"}
                  pathLength="1"
                  className="territory-border"
                  style={fresh ? { animationDelay: `${Math.min(j, 12) * 35}ms` } : undefined}
                />
              ))}
            </g>
          );
        })}
        {previewGame?.zones.filter(z => !game.zones.some(old => zoneKey(old) === zoneKey(z))).map(z => (
          <g key={"preview-" + zoneKey(z)} className="preview-boundary" pointerEvents="none">
            {z.edges.map(([x,y,nx,ny],i) => <line key={i} x1={pad+x*spacing} y1={pad+y*spacing} x2={pad+nx*spacing} y2={pad+ny*spacing} stroke={playerColors[z.player]} strokeWidth="3" strokeDasharray="5 4" />)}
          </g>
        ))}
        {game.board.map((p, i) => {
          const x = i % game.w,
            y = Math.floor(i / game.w),
            cx = pad + x * spacing,
            cy = pad + y * spacing,
            available = legal(game, x, y) && !locked;
          const focused = target?.[0] === x && target?.[1] === y;
          const changed = feedback?.captured.includes(i) || feedback?.liberated.includes(i);
          return (
            <g key={i}>
              {p ? (
                <>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={captured(game, i) ? 4.6 : 6.2}
                    fill={playerColors[p]}
                    opacity={captured(game, i) ? 0.42 : 1}
                    className={changed ? "changed-point" : ""}
                  />
                  {captured(game, i) && (
                    <path
                      d={`M${cx - 2} ${cy - 2}l4 4m-4 0l4-4`}
                      stroke="#fffdf5"
                      strokeWidth="1"
                    />
                  )}
                  {last?.x === x && last?.y === y && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r="11"
                      fill="none"
                      stroke={playerColors[p]}
                      strokeWidth="1"
                      opacity=".55"
                    />
                  )}
                </>
              ) : (
                <circle
                  cx={cx}
                  cy={cy}
                  r="1.3"
                  fill={game.territory[i] ? playerColors[game.territory[i]] : "#a7b9d4"}
                  opacity=".7"
                />
              )}
              {changed && (
                <circle
                  key={feedback?.id}
                  cx={cx}
                  cy={cy}
                  r="13"
                  fill="none"
                  stroke={playerColors[feedback?.liberated.includes(i) ? p : game.territory[i]]}
                  strokeWidth="2"
                  className={`capture-ring ${feedback?.liberated.includes(i) ? "capture-ring-liberated" : "capture-ring-captured"}`}
                />
              )}
              {focused && available && (
                <g pointerEvents="none">
                  <circle
                    cx={cx}
                    cy={cy}
                    r="12"
                    fill="#fff1a8"
                    fillOpacity=".8"
                    stroke="#255bfa"
                    strokeWidth="2"
                    className="tutorial-target"
                  />
                  <circle cx={cx} cy={cy} r="3" fill="#255bfa" />
                </g>
              )}
              {selection?.[0] === x && selection?.[1] === y && available && (
                <g pointerEvents="none" className="selected-point">
                  <circle cx={cx} cy={cy} r="13" fill="none" stroke={playerColors[game.turn]} strokeWidth="2" />
                  <circle cx={cx} cy={cy} r="6.2" fill={playerColors[game.turn]} opacity=".7" />
                </g>
              )}
              {hover === i && available && (
                <circle cx={cx} cy={cy} r="6.2" fill={playerColors[game.turn]} opacity=".4" />
              )}
              <foreignObject
                x={cx - spacing / 2}
                y={cy - spacing / 2}
                width={spacing}
                height={spacing}
              >
                <button
                  data-cell={`${x}-${y}`}
                  tabIndex={available ? 0 : -1}
                  disabled={locked}
                  aria-label={`${String.fromCharCode(65 + x)}${y + 1}${focused ? ", intersection conseillée" : ""}${p ? ", occupée" : game.territory[i] ? ", capturée" : ""}`}
                  aria-disabled={!available}
                  className={"cell-button " + (available ? "intersection" : "unavailable")}
                  onMouseEnter={() => setHover(i)}
                  onClick={() => onMove(x, y)}
                />
              </foreignObject>
            </g>
          );
        })}
      </svg>
      {feedback && (
        <output className={`capture-toast ${feedback.liberated.length ? "capture-toast-reconquest" : "capture-toast-capture"}`} key={feedback.id} aria-live="polite">
          <span className="capture-toast-title">
            {feedback.liberated.length ? "Territoire reconquis !" : "Capture !"}
          </span>
          <div>
            {([1, 2] as const)
              .filter((p) => feedback.deltas[p] !== 0)
              .map((p) => (
                <span key={p} className={"capture-delta player-" + p}>
                  <i style={{ background: playerColors[p] }} />
                  {feedback.deltas[p] > 0 ? "+" : ""}
                  {feedback.deltas[p]} {Math.abs(feedback.deltas[p]) === 1 ? "point" : "points"}
                  <small>{p === 1 ? "Bleus" : "Rouges"}</small>
                </span>
              ))}
          </div>
          {feedback.liberated.length > 0 && (
            <small>
              {feedback.liberated.length}{" "}
              {feedback.liberated.length === 1 ? "point libéré" : "points libérés"}
            </small>
          )}
        </output>
      )}
    </div>
  );
}
