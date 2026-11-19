import { useEffect, useRef, useState, type ComponentProps, type CSSProperties } from "react";
import "../seal-styles.css";
import { GameBoard } from "./game-board";
import { ArenaControls } from "./arena-controls";
import { ArenaAvatar } from "./arena-avatar";
import { EFFECT_COLORS, SEAL_STYLES, TERRAINS, TERRAIN_COLORS, useArenaSettings } from "../lib/arena-settings";
import { arenaSound, unlockArenaAudio } from "../lib/arena-audio";
import type { Feedback } from "../lib/game-feedback";
type Event = { id: string; x: number; y: number; player: number; feedback: Feedback | null };
function Seal({ style }: { style: number }) {
  const rays = Array.from({ length: 12 }, (_, i) => i * 30);
  if (style === 0)
    return (
      <>
        <circle r="58" />
        <circle r="48" strokeDasharray="4 5" />
        <path d="M0-45L39 23H-39ZM0 45L-39-23H39Z" />
      </>
    );
  if (style === 1)
    return (
      <>
        {rays.map((a) => (
          <ellipse key={a} rx="8" ry="14" transform={`rotate(${a}) translate(0 -50) rotate(25)`} />
        ))}
      </>
    );
  if (style === 2)
    return (
      <>
        <path d="M-45-45H45V45H-45Z" />
        <path d="M-30-45V45M0-45V45M30-45V45M-45-30H45M-45 0H45M-45 30H45" />
      </>
    );
  if (style === 3)
    return (
      <>
        {[0, 90, 180, 270].map((a) => (
          <g key={a} transform={`rotate(${a}) translate(0 -45)`}>
            <rect x="-10" y="-18" width="20" height="36" rx="2" fill="#fff4ca" />
            <path d="M-5-8H5M0-12V10M-5 4L5 10" stroke="#ea5968" />
          </g>
        ))}
      </>
    );
  if (style === 4)
    return (
      <path d="M0-55L48-28V28L0 55L-48 28V-28ZM0 0L48-28M0 0L-48-28M0 0V55M0 0V-55M0 0L48 28M0 0L-48 28" />
    );
  if (style === 5) return <path d="M18-60L-24 5H3L-18 60L30-8H4Z" fill="currentColor" />;
  if (style === 6)
    return (
      <>
        {rays.map((a) => (
          <ellipse
            key={a}
            cx="0"
            cy="-40"
            rx="6"
            ry="15"
            transform={`rotate(${a})`}
            fill="#ffafcc"
            stroke="#ffd4e4"
          />
        ))}
      </>
    );
  if (style === 7)
    return (
      <>
        {rays.map((a) => (
          <path key={a} d="M0 0V-58" transform={`rotate(${a})`} />
        ))}
        {[20, 35, 50].map((r) => (
          <circle key={r} r={r} />
        ))}
      </>
    );
  if (style === 8)
    return (
      <>
        {[-40, -20, 0, 20, 40].map((x, i) => (
          <path
            key={x}
            d={`M${x - 8} 40Q${x - 22} 8 ${x} ${-30 - (i % 3) * 12}Q${x + 22} 8 ${x + 8} 40Z`}
            fill="#ff873c"
            stroke="#ffe14a"
          />
        ))}
      </>
    );
  if (style === 9)
    return (
      <>
        {[-24, 0, 24].map((y) => (
          <path
            key={y}
            d={`M-60 ${y}Q-45 ${y - 20}-30 ${y}T0 ${y}T30 ${y}T60 ${y}`}
            stroke="#9fe8ff"
          />
        ))}
      </>
    );
  if (style === 10)
    return (
      <>
        <path d="M-32 12V-10A32 32 0 1 1 32-10V12L22 20V40H-22V20Z" fill="#eef0f6" />
        <ellipse cx="-13" cy="-4" rx="8" ry="10" fill="#070a14" />
        <ellipse cx="13" cy="-4" rx="8" ry="10" fill="#070a14" />
        <path d="M0 8L-5 18H5ZM-12 24V40M0 24V40M12 24V40" stroke="#070a14" />
      </>
    );
  return (
    <>
      <path d="M-45-30L10-45L45 0L20 40L-35 28Z M-45-30L20 40M10-45L-35 28" />
      {[
        [-45, -30],
        [10, -45],
        [45, 0],
        [20, 40],
        [-35, 28],
      ].map(([x, y]) => (
        <path
          key={x}
          d="M0-7L2-2L7 0L2 2L0 7L-2 2L-7 0L-2-2Z"
          transform={`translate(${x} ${y})`}
          fill="#fff4bc"
        />
      ))}
    </>
  );
}
function SealTreatment({ edges, style }: { edges: [number, number, number, number][]; style: number }) {
  const vertices = [...new Map(
    edges.flatMap(([x, y, nx, ny]) => [[x, y], [nx, ny]]).map(([x, y]) => [`${x}:${y}`, [x, y]] as const),
  ).values()];
  return (
    <g className={`arena-seal-details seal-style-${style}`}>
      {style === 0 && edges.map(([x, y, nx, ny], i) => {
        const mx = (x + nx) * 16 + 26, my = (y + ny) * 16 + 26;
        return <g key={i}><circle className="seal-rune-ring" cx={mx} cy={my} r="4" /><path className="seal-rune-mark" d={`M${mx} ${my - 5}v10m-5-5h10`} /></g>;
      })}
      {style === 1 && edges.map(([x, y, nx, ny], i) => {
        const mx = (x + nx) * 16 + 26, my = (y + ny) * 16 + 26;
        const angle = Math.atan2(ny - y, nx - x) * 180 / Math.PI;
        return <ellipse key={i} className="seal-chain-link" cx={mx} cy={my} rx="6" ry="3" transform={`rotate(${angle} ${mx} ${my})`} />;
      })}
      {style === 2 && vertices.map(([x, y], i) => <rect key={i} className="seal-barrier-pillar" x={26 + x * 32 - 4} y={26 + y * 32 - 4} width="8" height="8" rx="1" />)}
      {style === 3 && edges.filter((_, i) => i % 2 === 0).map(([x, y, nx, ny], i) => {
        const mx = (x + nx) * 16 + 26, my = (y + ny) * 16 + 26;
        const angle = Math.atan2(ny - y, nx - x) * 180 / Math.PI;
        return <g key={i} className="seal-talisman" transform={`translate(${mx} ${my}) rotate(${angle})`}><rect x="-4" y="-7" width="8" height="14" rx="1" /><path d="M0-4v8m-2-2 2 2 2-2" /></g>;
      })}
      {style === 4 && edges.map(([x, y, nx, ny], i) => <line key={i} className="seal-cube-depth" x1={26 + x * 32 + 3} y1={26 + y * 32 - 3} x2={26 + nx * 32 + 3} y2={26 + ny * 32 - 3} />)}
    </g>
  );
}
export function ArenaBoard({
  active = true,
  ownPlayer = 1,
  ...props
}: ComponentProps<typeof GameBoard> & { active?: boolean; ownPlayer?: number }) {
  const { settings: s } = useArenaSettings();
  const [event, setEvent] = useState<Event | null>(null);
  const previous = useRef(props.game.moves.length),
    lastFeedback = useRef<Feedback | null>(props.feedback ?? null);
  useEffect(() => {
    const count = props.game.moves.length,
      move = props.game.moves.at(-1),
      before = previous.current;
    previous.current = count;
    if (!active || count < before || count > before + 1) {
      setEvent(null);
      lastFeedback.current = props.feedback ?? null;
      return;
    }
    if (count !== before && move && count === before + 1) {
      const feedback = props.feedback?.id === count ? props.feedback : null;
      lastFeedback.current = feedback ?? null;
      setEvent({
        id: `${count}-${move.x}-${move.y}-${Date.now()}`,
        x: move.x,
        y: move.y,
        player: move.player,
        feedback: feedback ?? null,
      });
      if (s.sound) arenaSound(!!feedback, s.element, !!feedback?.liberated.length, s.terrain, s.sealStyle);
    } else if (
      props.feedback &&
      props.feedback !== lastFeedback.current &&
      props.feedback.id === count &&
      move
    ) {
      // Room feedback arrives one render after the authoritative move.
      lastFeedback.current = props.feedback;
      setEvent({
        id: `capture-${count}-${Date.now()}`,
        x: move.x,
        y: move.y,
        player: move.player,
        feedback: props.feedback,
      });
      if (s.sound) arenaSound(true, s.element, !!props.feedback.liberated.length, s.terrain, s.sealStyle);
    }
  }, [props.game.moves, props.feedback, active, s.sound, s.element, s.terrain, s.sealStyle]);
  useEffect(() => {
    if (!event) return;
    const t = setTimeout(() => setEvent(null), 2000);
    return () => clearTimeout(t);
  }, [event]);
  const w = (props.game.w - 1) * 32 + 52,
    h = (props.game.h - 1) * 32 + 52;
  const cells = event?.feedback ? [...event.feedback.captured, ...event.feedback.liberated] : [];
  const center = cells.length
    ? cells.reduce(
        (a, i) => [
          a[0] + ((i % props.game.w) * 32) / cells.length,
          a[1] + (Math.floor(i / props.game.w) * 32) / cells.length,
        ],
        [26, 26],
      )
    : [26 + (event?.x ?? 0) * 32, 26 + (event?.y ?? 0) * 32];
  const radius = Math.max(
    42,
    ...cells.map(
      (i) =>
        Math.hypot(
          26 + (i % props.game.w) * 32 - center[0],
          26 + Math.floor(i / props.game.w) * 32 - center[1],
        ) + 28,
    ),
  );
  useEffect(() => {
    if (!s.sound || !active) return;
    const unlock = () => {
      void unlockArenaAudio();
    };
    document.addEventListener("pointerdown", unlock);
    document.addEventListener("keydown", unlock);
    return () => {
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
    };
  }, [s.sound, active]);
  const color = EFFECT_COLORS[s.element];
  const terrainColor = TERRAIN_COLORS[s.terrain];
  return (
    <div
      className={`arena-presentation terrain-${s.terrain}`}
      aria-label={`Arène Kropki · terrain ${TERRAINS[s.terrain]}`}
      style={{ "--arena-effect": color, "--terrain-glow": terrainColor, "--terrain-base": terrainColor + "18" } as CSSProperties}
    >
      <div className="arena-stage" data-terrain={s.terrain}>
        <GameBoard {...props} />
        {event && s.effects && active && (
          <svg
            key={"fx-" + event.id}
            className={`arena-fx element-${s.element}`}
            viewBox={`0 0 ${w} ${h}`}
            aria-hidden="true"
          >
            <g
              className="arena-strike"
              transform={`translate(${26 + event.x * 32} ${26 + event.y * 32})`}
            >
              <circle r="18" />
              <path
                d={
                  s.element === 3
                    ? "M5-25L-8 0H3L-5 25"
                    : s.element === 1
                      ? "M-9 12Q-18-5 0-24Q22 0 9 12Z"
                      : "M0-22V22M-22 0H22M-15-15L15 15M15-15L-15 15"
                }
              />
            </g>
            {event.feedback && (
              <>
                {props.game.zones
                  .filter((z) => event.feedback?.zones.includes(`${z.player}:${z.cells.join(",")}`))
                  .map((z, i) => (
                    <g key={i} className={`arena-boundary seal-style-${s.sealStyle}`}>
                      {z.edges.map(([x, y, nx, ny], j) => (
                        <line
                          key={j}
                          className="arena-seal-edge"
                          pathLength="1"
                          x1={26 + x * 32}
                          y1={26 + y * 32}
                          x2={26 + nx * 32}
                          y2={26 + ny * 32}
                          style={{
                            animationDelay: `${(j / Math.max(1, z.edges.length)) * 1.15}s`,
                          }}
                        />
                      ))}
                      <SealTreatment edges={z.edges} style={s.sealStyle} />
                    </g>
                  ))}
                <g
                  transform={`translate(${center[0]} ${center[1]}) scale(${Math.min(radius, Math.min(w, h) * 0.3) / 60})`}
                >
                  <g className="arena-seal">
                    <circle className="arena-seal-pulse" r="62" />
                    <Seal style={s.seal} />
                  </g>
                </g>
                {Array.from({ length: 16 }, (_, i) => {
                  const a = (i * Math.PI) / 8;
                  return (
                    <path
                      key={i}
                      className="arena-spark"
                      style={{ animationDelay: `${(i % 4) * 40}ms` }}
                      d={`M${center[0] + Math.cos(a) * radius * 0.5} ${center[1] + Math.sin(a) * radius * 0.5}l${Math.cos(a) * 18} ${Math.sin(a) * 18}`}
                    />
                  );
                })}
              </>
            )}
          </svg>
        )}
        {event?.feedback && s.effects && active && (
          <div key={"cutin-" + event.id} className="arena-cutin" aria-hidden="true">
            {event.player === ownPlayer && <ArenaAvatar settings={s} />}
            <div>
              <strong>{event.feedback.liberated.length ? "RECONQUÊTE !" : "ENCERCLEMENT !"}</strong>
              <span>
                {SEAL_STYLES[s.sealStyle]} · {event.player === 1 ? "Bleus" : "Rouges"}
              </span>
            </div>
          </div>
        )}
      </div>
      <ArenaControls />
    </div>
  );
}
