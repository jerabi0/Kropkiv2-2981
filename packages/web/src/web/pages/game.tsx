import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import {
  ArrowUpRight,
  ArrowRight,
  Undo2,
  CircleHelp,
  X,
  Users,
  Monitor,
  Flag,
  Check,
  ChevronDown,
  Grid2X2,
  Bot,
  UserRound,
  ChevronRight,
  ShieldCheck,
  History,
  Lightbulb,
  Target,
  Swords,
  HardDrive,
  GraduationCap,
  Trophy,
} from "lucide-react";
import { createGame, replay, legal, scores, computerMove } from "../lib/kropki";
import {
  CADENCES,
  createMatch,
  settleMatch,
  moveMatch,
  undoMatch,
  pauseMatch,
  resumeMatch,
  resignMatch,
  type TimedMatch,
} from "../lib/timed-game";
import { restoreLocalMatch } from "../lib/local-match";
import { needsMatchSave, type LocalSave } from "../lib/match-persistence";
import { MatchClock } from "../components/match-clock";
import { LocalArenaAvatar } from "../components/arena-avatar";
import { TacticalBoard } from "../components/tactical-board";
import { AccountMenu } from "../components/online-shell";
import { ReplayControls } from "../components/replay-controls";
import { Tutorial } from "../components/tutorial";
import { gameFeedback, reviewPosition, type Feedback } from "../lib/game-feedback";
const colors = ["", "#255bfa", "#f26367"];
function initial() {
  try { return restoreLocalMatch(localStorage.getItem("kropki-v1")); }
  catch { return {...restoreLocalMatch(null), warning:"Stockage local indisponible : ta partie ne sera pas conservée après fermeture."}; }
}
function Emblem({ small = false }: { small?: boolean }) {
  return (
    <svg viewBox="0 0 210 165" aria-hidden="true" className={small ? "emblem-small" : "emblem"}>
      <defs>
        <pattern id="mini-grid" width="26" height="26" patternUnits="userSpaceOnUse">
          <path d="M26 0H0V26" fill="none" stroke="#d8d9d4" strokeWidth=".8" />
        </pattern>
      </defs>
      <rect x="1" y="1" width="208" height="163" fill="url(#mini-grid)" />
      <path
        d="M53 79L79 27L131 27L157 79L131 131L79 131Z"
        fill="#255bfa"
        fillOpacity=".09"
        stroke="#255bfa"
        strokeWidth="1.8"
      />
      {[
        [53, 79],
        [79, 27],
        [105, 27],
        [131, 27],
        [157, 79],
        [144, 53],
        [144, 105],
        [131, 131],
        [105, 131],
        [79, 131],
        [66, 105],
        [66, 53],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="4" fill={colors[1]} />
      ))}
      {[
        [105, 79],
        [105, 105],
        [131, 79],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="4" fill={colors[2]} />
      ))}
      <circle cx="183" cy="131" r="4" fill={colors[2]} />
    </svg>
  );
}
export default function GamePage() {
  const [stored] = useState(initial);
  const [match, setMatch] = useState<TimedMatch>(stored.match);
  const game = match.game;
  const [cadence, setCadence] = useState(3);
  const [resigning, setResigning] = useState<1 | 2>(1);
  const [mode, setMode] = useState<string>(stored.mode);
  const [level, setLevel] = useState(stored.level);
  const [modal, setModal] = useState<"rules" | "new" | "end" | null>(null);
  const [newMode, setNewMode] = useState(mode);
  const [size, setSize] = useState(game.w);
  const [newLevel, setNewLevel] = useState(level);
  const [notice, setNotice] = useState("");
  const [storageWarning, setStorageWarning] = useState(stored.warning);
  const lastSaved = useRef<LocalSave | null>(null);
  const [panel, setPanel] = useState<"play" | "history">("play");
  const dialog = useRef<HTMLDialogElement>(null);
  const [review, setReview] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [tutorial, setTutorial] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const view = useMemo(
    () =>
      review === null
        ? game
        : {
            ...replay(game.moves.slice(0, review), game.w, game.h),
            ended: review === game.moves.length && game.ended,
          },
    [game, review],
  );
  const score = scores(view);
  const ai = mode === "computer" && game.turn === 2 && !game.ended && review === null && !tutorial;
  const commit = useCallback((x: number, y: number) => {
    setMatch((current) => {
      const next = moveMatch(current, x, y, Date.now());
      setFeedback(gameFeedback(current.game, next.game));
      return next;
    });
  }, []);
  useEffect(() => {
    const paused = review !== null || tutorial;
    setMatch((current) =>
      paused ? pauseMatch(current, Date.now()) : resumeMatch(current, Date.now()),
    );
  }, [review, tutorial]);
  useEffect(() => {
    const tick = () => setMatch((current) => settleMatch(current, Date.now()));
    const timer = setInterval(tick, 200);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", tick);
    };
  }, []);
  function enterReview(position: number) {
    setReview(reviewPosition(game, position));
    setPlaying(false);
    setFeedback(null);
    setPanel("history");
  }
  function exitReview() {
    setReview(null);
    setPlaying(false);
  }
  function launchTutorial() {
    setTutorial(true);
    setModal(null);
    setPlaying(false);
    setFeedback(null);
  }
  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(t);
  }, [feedback]);
  useEffect(() => {
    if (!playing || review === null || tutorial || modal) return;
    if (review >= game.moves.length) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setReview(review + 1), 900);
    return () => clearTimeout(t);
  }, [playing, review, game.moves.length, tutorial, modal]);
  useEffect(() => {
    const next = { match, mode, level };
    if (!needsMatchSave(lastSaved.current, next)) return;
    lastSaved.current = next;
    try {
      localStorage.setItem("kropki-v1", JSON.stringify({ ...match, mode, level }));
    } catch { setStorageWarning("Stockage local indisponible : ta partie ne sera pas conservée après fermeture."); }
  }, [match, mode, level]);
  useEffect(() => {
    if (!ai || modal) {
      return;
    }
    const t = setTimeout(() => {
      const m = computerMove(game, level);
      if (m) commit(...m);
    }, 420);
    return () => clearTimeout(t);
  }, [game, ai, level, modal, commit]);
  useEffect(() => {
    if (modal) dialog.current?.showModal();
    else dialog.current?.close();
  }, [modal]);
  useEffect(() => {
    if (game.ended && match.result?.reason === "time") setModal(null);
  }, [game.ended, match.result?.reason]);
  function move(x: number, y: number) {
    if (ai || game.ended || review !== null || tutorial) return;
    if (!legal(game, x, y)) {
      setNotice("Cette intersection est déjà occupée ou capturée.");
      return;
    }
    setNotice("");
    commit(x, y);
  }
  function undo() {
    if (!game.moves.length || review !== null) return;
    let count = 1;
    if (mode === "computer" && game.moves.at(-1)?.player === 2) count = 2;
    setFeedback(null);
    setMatch((current) => undoMatch(current, count, Date.now()));
    setNotice("Dernier coup annulé.");
  }
  function start() {
    exitReview();
    setTutorial(false);
    setFeedback(null);
    setPanel("play");
    setMode(newMode);
    setLevel(newLevel);
    setMatch(
      createMatch(createGame(size, size === 13 ? 11 : size === 21 ? 17 : 13), cadence, Date.now()),
    );
    setModal(null);
    setNotice("Nouvelle partie. À toi de poser le premier point.");
  }
  const winningPlayer = match.result?.winner ?? null;
  const winner =
    winningPlayer === null
      ? "Égalité parfaite."
      : winningPlayer === 1
        ? "Les bleus remportent la partie."
        : "Les rouges remportent la partie.";
  const resultText =
    match.result?.reason === "time"
      ? "Temps écoulé : le score décide. "
      : match.result?.reason === "resign"
        ? `${match.result.resignedBy === 1 ? "Les bleus abandonnent" : "Les rouges abandonnent"}. `
        : "Plateau terminé. ";
  return (
    <div className="arena" id="top">
      <aside className="navigation-rail" aria-label="Navigation principale">
        <a href="#top" className="brand" aria-label="Kropki accueil">
          <span className="brand-symbol">
            <i />
            <i />
            <i />
            <i />
          </span>
          kropki<span className="brand-period">.</span>
        </a>
        <span className="rail-caption">LE TERRITOIRE T’APPARTIENT.</span>
        <nav className="rail-nav">
          <a href="#plateau" className="rail-link selected" aria-label="Jouer">
            <Grid2X2 size={22} />
            <span>Jouer</span>
          </a>
          <button
            className="rail-link"
            aria-label="Ordinateur"
            onClick={() => {
              setNewMode("computer");
              setNewLevel(level);
              setSize(game.w);
              setModal("new");
            }}
          >
            <Bot size={22} />
            <span>Ordinateur</span>
          </button>
          <button
            className="rail-link"
            aria-label="À deux"
            onClick={() => {
              setNewMode("local");
              setSize(game.w);
              setModal("new");
            }}
          >
            <Users size={22} />
            <span>À deux</span>
          </button>
          <button
            className="rail-link"
            aria-label="Comment jouer"
            onClick={() => setModal("rules")}
          >
            <CircleHelp size={22} />
            <span>Règles du jeu</span>
          </button>
          <button className="rail-link" aria-label="Tutoriel interactif" onClick={launchTutorial}>
            <GraduationCap size={22} />
            <span>Apprendre</span>
          </button>
          <Link href="/entrainement" className="rail-link" aria-label="Entraînement avancé">
            <Target size={22} />
            <span>Entraînement</span>
          </Link>
        </nav>
        <div className="rail-bottom">
          <div className="local-version">
            <span /> VERSION LOCALE
          </div>
          <p>
            Tout le plaisir du jeu.
            <br />
            Sans compte, sans attente.
          </p>
          <button onClick={() => setModal("rules")}>
            <CircleHelp size={16} /> Aide et règles
          </button>
        </div>
      </aside>
      <div className="arena-workspace">
        <header className="arena-header">
          <div className="breadcrumb">
            <span>Jouer</span>
            <ChevronRight size={15} />
            <strong>Kropki</strong>
          </div>
          <div className="saved-label">
            <ShieldCheck size={15} />
            <span>Sauvegarde automatique</span>
          </div>
          <AccountMenu />
        </header>
        <main className="arena-main">
          <div className="page-heading">
            <div>
              <div className="eyebrow">LE JEU DE TERRITOIRE POLONAIS</div>
              <h1>
                Chaque point compte<span>.</span>
              </h1>
              <p>Ferme tes frontières. Capture ses points. Prends l’avantage.</p>
            </div>
            <button className="rules-shortcut" onClick={() => setModal("rules")}>
              <CircleHelp size={18} />
              <span>Les règles</span>
            </button>
          </div>
          {tutorial ? (
            <>
              <MatchClock
                remaining={match.clock.remaining}
                minutes={match.clock.minutes}
                waiting={!match.clock.started}
                    paused={match.clock.paused}
                ended={game.ended}
              />
              <Tutorial onClose={() => setTutorial(false)} />
            </>
          ) : (
            <>
              {storageWarning && <output className="message">{storageWarning}</output>}
              <section id="plateau" className="game-area" data-match-phase={game.ended ? "finished" : match.clock.started ? "active" : "waiting"} data-score-lead={score[1] === score[2] ? "tie" : score[1] > score[2] ? "blue" : "red"}>
                <div className="board-column">
                  <MatchClock
                    remaining={match.clock.remaining}
                    minutes={match.clock.minutes}
                    waiting={!match.clock.started}
                    paused={match.clock.paused}
                    ended={game.ended}
                    historical={review === null ? undefined : (match.snapshots[review] ?? null)}
                  />
                  <div
                    className={
                      "table-player opponent " +
                      (view.turn === 2 && !view.ended ? "is-playing" : "")
                    }
                  >
                    <div className="table-avatar red-avatar">
                      {mode === "computer" ? <Bot size={27} /> : <UserRound size={25} />}
                    </div>
                    <div className="table-name">
                      <strong>{mode === "computer" ? "Ordinateur" : "Joueur 2"}</strong>
                      <span>
                        <i style={{ background: colors[2] }} /> Les rouges ·{" "}
                        {mode === "computer"
                          ? level === "easy"
                            ? "Découverte"
                            : "Tactique"
                          : "Même écran"}
                      </span>
                    </div>
                    <div className="player-taken">
                      <span key={score[2]} className={score[2] > 0 ? "score-value score-value-active" : "score-value"}>{score[2]}</span> points capturés
                    </div>
                    {view.turn === 2 && !view.ended && (
                      <span className="player-turn-indicator">
                        {ai ? "Réfléchit…" : "À son tour"}
                      </span>
                    )}
                  </div>
                  <div className="board-heading">
                    <div className="board-title">
                      <Grid2X2 size={13} />
                      <span>
                        {game.w} × {game.h}
                      </span>
                      <span className="board-variant">Territoire</span>
                    </div>
                    <div className="turn-label" aria-live="polite">
                      <span style={{ background: view.ended ? "#a7a59b" : colors[view.turn] }} />
                      {view.ended
                        ? "Partie terminée"
                        : ai
                          ? "L’ordinateur réfléchit…"
                          : view.turn === 1
                            ? "Aux bleus de jouer"
                            : "Aux rouges de jouer"}
                    </div>
                  </div>
                  {review !== null && (
                    <ReplayControls
                      position={review}
                      total={game.moves.length}
                      playing={playing}
                      onChange={enterReview}
                      onPlay={() => {
                        if (review === game.moves.length) setReview(0);
                        setPlaying(!playing);
                      }}
                      onExit={exitReview}
                    />
                  )}
                  <TacticalBoard
                    game={view}
                    active={review === null}
                    locked={ai || review !== null}
                    onMove={move}
                    feedback={review === null ? feedback : null}
                  />

                  <div
                    className={
                      "table-player you " + (view.turn === 1 && !view.ended ? "is-playing" : "")
                    }
                  >
                    <div className="table-avatar blue-avatar">
                      <LocalArenaAvatar />
                    </div>
                    <div className="table-name">
                      <strong>{mode === "computer" ? "Toi" : "Joueur 1"}</strong>
                      <span>
                        <i style={{ background: colors[1] }} /> Les bleus ·{" "}
                        {mode === "computer" ? "Prêt à conquérir" : "Même écran"}
                      </span>
                    </div>
                    <div className="player-taken">
                      <span key={score[1]} className={score[1] > 0 ? "score-value score-value-active" : "score-value"}>{score[1]}</span> points capturés
                    </div>
                    {view.turn === 1 && !view.ended && (
                      <span className="player-turn-indicator your-turn">À ton tour</span>
                    )}
                  </div>
                  <div className="board-bottom">
                    <span>
                      <span className="ring-key" /> Dernier point joué
                    </span>
                    <span>
                      {view.moves.length} {view.moves.length > 1 ? "coups joués" : "coup joué"}
                    </span>
                  </div>
                  {game.ended && review === null && (
                    <section
                      className={"match-finale " + (winningPlayer === null ? "match-finale-draw" : winningPlayer === 1 ? "match-finale-win" : "match-finale-loss")}
                      aria-live="polite"
                    >
                      <span className="match-finale-icon"><Trophy size={25} /></span>
                      <div className="match-finale-copy">
                        <span className="match-finale-kicker">DUEL TERMINÉ</span>
                        <h2>
                          {winningPlayer === null
                            ? "Égalité parfaite"
                            : mode === "computer"
                              ? match.result?.winner === 1 ? "Victoire !" : "Défaite"
                              : match.result?.winner === 1 ? "Les bleus l’emportent" : "Les rouges l’emportent"}
                        </h2>
                        <p>{resultText}{winner}</p>
                      </div>
                      <div className="match-finale-score" aria-label={`Score final : ${score[1]} à ${score[2]}`}>
                        <strong>{score[1]}</strong><span>—</span><strong>{score[2]}</strong>
                      </div>
                    </section>
                  )}
                  <div
                    className={"message " + (view.ended ? "finished-message" : "")}
                    aria-live="polite"
                  >
                    {view.ended
                      ? resultText + winner
                      : review !== null
                        ? `Relecture : coup ${review} sur ${game.moves.length}. Le plateau est en lecture seule.`
                        : notice || "Sélectionne une intersection libre, puis confirme (ou active le placement direct)."}
                  </div>
                </div>
                <aside className="right-column">
                  <div className="game-sidebar">
                    <div className="panel-heading">
                      <div>
                        <Swords size={21} />
                        <h2>Ta partie</h2>
                      </div>
                      <span className={"live-chip " + (view.ended ? "ended" : "")}>
                        <i />
                        {review !== null ? "Relecture" : view.ended ? "Terminée" : "En cours"}
                      </span>
                    </div>
                    <div className="score-list">
                      {([1, 2] as const).map((p) => (
                        <div
                          key={p}
                          className={
                            "player-score " + (view.turn === p && !view.ended ? "current" : "")
                          }
                        >
                          <div className="score-owner">
                            <span style={{ background: colors[p] }} />
                            <strong>{p === 1 ? "Les bleus" : "Les rouges"}</strong>
                          </div>
                          <div className="score-number">
                            <span key={score[p]} className={score[p] > 0 ? "score-value score-value-active" : "score-value"}>{score[p]}</span>
                            <span>capturés</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="panel-tabs">
                      <button
                        className={panel === "play" ? "active" : ""}
                        aria-pressed={panel === "play"}
                        onClick={() => setPanel("play")}
                      >
                        <Grid2X2 size={15} /> Partie
                      </button>
                      <button
                        className={panel === "history" ? "active" : ""}
                        aria-pressed={panel === "history"}
                        onClick={() => setPanel("history")}
                      >
                        <History size={15} /> Historique <span>{game.moves.length}</span>
                      </button>
                    </div>
                    {panel === "play" ? (
                      <div className="play-panel">
                        <span className="field-caption">MODE DE JEU</span>
                        <div className="mode-selector" aria-label="Mode de jeu">
                          <button
                            className={mode === "computer" ? "active" : ""}
                            onClick={() => {
                              setNewMode("computer");
                              setNewLevel(level);
                              setSize(game.w);
                              setModal("new");
                            }}
                          >
                            <Bot size={18} /> Ordinateur
                          </button>
                          <button
                            className={mode === "local" ? "active" : ""}
                            onClick={() => {
                              setNewMode("local");
                              setSize(game.w);
                              setModal("new");
                            }}
                          >
                            <Users size={18} /> À deux
                          </button>
                        </div>
                        <div className="mode-description">
                          {mode === "computer"
                            ? `Toi contre l’ordinateur · ${level === "easy" ? "Découverte" : "Tactique"}`
                            : "Deux joueurs, un même écran"}
                        </div>
                        <div className="game-facts">
                          <div>
                            <span>Plateau</span>
                            <strong>
                              {game.w} × {game.h}
                            </strong>
                          </div>
                          <div>
                            <span>Règles</span>
                            <strong>Territoire</strong>
                          </div>
                          <div>
                            <span>Durée totale</span>
                            <strong>{match.clock.minutes} min au total</strong>
                          </div>
                          <div>
                            <span>Objectif</span>
                            <strong>Capturer le plus de points</strong>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="history-panel">
                        <div className="history-heading">
                          <span>COUP</span>
                          <span>
                            <i className="blue-dot" /> BLEUS
                          </span>
                          <span>
                            <i className="red-dot" /> ROUGES
                          </span>
                        </div>
                        {game.moves.length ? (
                          <div className="history-scroll">
                            {Array.from({ length: Math.ceil(game.moves.length / 2) }, (_, i) => {
                              const a = game.moves[i * 2],
                                b = game.moves[i * 2 + 1];
                              return (
                                <div className="history-row" key={i}>
                                  <span>{i + 1}.</span>
                                  <button
                                    disabled={!a}
                                    aria-label={`Revoir le coup ${i * 2 + 1} : ${a ? String.fromCharCode(65 + a.x) + (a.y + 1) : "—"}`}
                                    className={review === i * 2 + 1 ? "selected-move" : ""}
                                    onClick={() => enterReview(i * 2 + 1)}
                                  >
                                    {a ? String.fromCharCode(65 + a.x) + (a.y + 1) : "—"}
                                  </button>
                                  <button
                                    disabled={!b}
                                    aria-label={`Revoir le coup ${i * 2 + 2} : ${b ? String.fromCharCode(65 + b.x) + (b.y + 1) : "—"}`}
                                    className={review === i * 2 + 2 ? "selected-move" : ""}
                                    onClick={() => enterReview(i * 2 + 2)}
                                  >
                                    {b ? String.fromCharCode(65 + b.x) + (b.y + 1) : "—"}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="history-empty">
                            <History size={28} />
                            <strong>Le premier point t’attend.</strong>
                            <p>
                              Les coordonnées de chaque coup
                              <br />
                              apparaîtront ici.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="panel-controls">
                      {game.moves.length > 0 && (
                        <button
                          className="review-entry"
                          onClick={() => (review === null ? enterReview(0) : exitReview())}
                        >
                          <History size={16} />
                          {review === null ? "Revoir la partie" : "Retour à la partie"}
                          <ArrowRight size={14} />
                        </button>
                      )}
                      <button
                        className="primary-button"
                        onClick={() => {
                          setNewMode(mode);
                          setSize(game.w);
                          setNewLevel(level);
                          setModal("new");
                        }}
                      >
                        <Grid2X2 size={20} /> Nouvelle partie <ArrowRight size={18} />
                      </button>
                      <div className="secondary-actions">
                        <button
                          disabled={game.ended || !game.moves.length || review !== null}
                          onClick={undo}
                        >
                          <Undo2 size={17} /> Annuler
                        </button>
                        <button
                          disabled={game.ended || review !== null}
                          onClick={() => {
                            setResigning(mode === "computer" ? 1 : game.turn);
                            setModal("end");
                          }}
                        >
                          <Flag size={16} /> Abandonner
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="tip">
                    <div className="tip-title">
                      <Lightbulb size={18} />
                      <span>Le coup d’avance</span>
                    </div>
                    <p>
                      Les diagonales comptent aussi. Relie tes points voisins pour fermer le piège.
                    </p>
                    <svg viewBox="0 0 150 40" aria-hidden="true">
                      <path
                        d="M12 30L40 8L68 30L96 8L124 30"
                        fill="none"
                        stroke="#9bc35d"
                        strokeWidth="2"
                      />
                      {[
                        [12, 30],
                        [40, 8],
                        [68, 30],
                        [96, 8],
                        [124, 30],
                      ].map(([x, y], i) => (
                        <circle key={i} cx={x} cy={y} r="4" fill="#9bc35d" />
                      ))}
                    </svg>
                    <button onClick={() => setModal("rules")}>
                      Découvrir les règles <ArrowUpRight size={14} />
                    </button>
                    <button className="tutorial-entry" onClick={launchTutorial}>
                      <GraduationCap size={16} /> Essayer le tutoriel
                    </button>
                  </div>
                  <div className="device-note">
                    <HardDrive size={14} />
                    <span>Ta partie reste sur cet appareil.</span>
                  </div>
                </aside>
              </section>
              <section className="quick-guide">
                <div className="guide-title">
                  <Target size={19} />
                  <h2>Simple à apprendre. Subtil à maîtriser.</h2>
                </div>
                <div className="steps">
                  <article>
                    <span className="step-num">01</span>
                    <div>
                      <h3>Pose ton point</h3>
                      <p>Une intersection libre, un point. Chacun son tour.</p>
                    </div>
                  </article>
                  <article>
                    <span className="step-num">02</span>
                    <div>
                      <h3>Ferme la boucle</h3>
                      <p>Entoure les points adverses, même en diagonale.</p>
                    </div>
                  </article>
                  <article>
                    <span className="step-num">03</span>
                    <div>
                      <h3>Prends l’avantage</h3>
                      <p>Un point capturé = un point. Le meilleur score gagne.</p>
                    </div>
                  </article>
                </div>
              </section>
              <footer>
                <span>Kropki · Un point. Tout change.</span>
                <span>Mode local · Ordinateur ou deux joueurs</span>
              </footer>
            </>
          )}
        </main>
      </div>
      <dialog ref={dialog} onCancel={() => setModal(null)}>
        <div className="dialog-content">
          <button className="close-button" aria-label="Fermer" onClick={() => setModal(null)}>
            <X size={20} />
          </button>
          {modal === "rules" ? (
            <>
              <span className="tiny-label">LE PLAISIR EST DANS LA STRATÉGIE</span>
              <h2>
                Tout commence
                <br />
                par <em>un point.</em>
              </h2>
              <div className="rules-art">
                <Emblem small />
                <p>
                  Une chaîne fermée.
                  <br />
                  Trois points capturés.
                </p>
              </div>
              <ol className="rules-list">
                <li>
                  <strong>Chacun son tour.</strong> Pose un point sur une intersection libre. Les
                  bleus commencent.
                </li>
                <li>
                  <strong>Entoure pour capturer.</strong> Une boucle de points de ta couleur, reliés
                  horizontalement, verticalement ou en diagonale, capture les points adverses à
                  l’intérieur. Les frontières se tracent automatiquement.
                </li>
                <li>
                  <strong>Le territoire est fermé.</strong> Impossible de jouer dans une zone
                  capturée. Une boucle vide ne rapporte rien ; un adversaire qui y entre est capturé
                  si la boucle est toujours intacte.
                </li>
                <li>
                  <strong>Renverse la situation.</strong> Entourer un territoire adverse peut
                  libérer tes propres points. Les scores sont recalculés.
                </li>
                <li>
                  <strong>Le score décide.</strong> Un point adverse capturé = un point. La partie
                  se termine quand le plateau est plein ou dès que le compte à rebours commun
                  atteint zéro : le meilleur score gagne. À égalité, match nul. Abandonner donne la
                  victoire à l’adversaire, quel que soit le score.
                </li>
                <li>
                  <strong>Une limite pour toute la partie.</strong> 3, 5, 7, 10 ou 30 minutes au
                  total, pour les deux joueurs réunis. Le compte à rebours démarre au premier pion légalement placé
                  de la partie et continue quel que soit le joueur au trait, y compris pendant la
                  réflexion de l’ordinateur. La relecture et le tutoriel mettent cette partie locale
                  en pause. Les fenêtres de règles et de confirmation ne mettent pas en pause.
                  Annuler un coup ne rembourse pas de temps.
                </li>
              </ol>
              <p className="rules-source">
                Variante avec territoire et fermeture automatique.{" "}
                <a
                  href="https://zagram.org/info/kropki-rules.en.html"
                  target="_blank"
                  rel="noreferrer"
                >
                  Référence des règles <ArrowUpRight size={12} />
                </a>
              </p>
              <button className="tutorial-entry rules-tutorial" onClick={launchTutorial}>
                <GraduationCap size={17} /> Apprendre avec le tutoriel interactif{" "}
                <ArrowRight size={15} />
              </button>
              <button className="primary-button" onClick={() => setModal(null)}>
                C’est parti <ArrowRight size={17} />
              </button>
            </>
          ) : modal === "new" ? (
            <>
              <span className="tiny-label">UN PLATEAU. UN NOUVEAU DUEL.</span>
              <h2>
                Une nouvelle
                <br />
                <em>conquête.</em>
              </h2>
              <p className="field-label">Avec qui veux-tu jouer ?</p>
              <div className="dialog-modes">
                <button
                  className={newMode === "computer" ? "chosen" : ""}
                  onClick={() => setNewMode("computer")}
                >
                  <Monitor size={22} />
                  <strong>L’ordinateur</strong>
                  <span>Un duel en solo</span>
                  {newMode === "computer" && <Check size={15} />}
                </button>
                <button
                  className={newMode === "local" ? "chosen" : ""}
                  onClick={() => setNewMode("local")}
                >
                  <Users size={22} />
                  <strong>À deux</strong>
                  <span>Sur le même écran</span>
                  {newMode === "local" && <Check size={15} />}
                </button>
              </div>
              <label className="field-label" htmlFor="board-size">
                Taille du plateau
              </label>
              <div className="select-wrap">
                <select
                  id="board-size"
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                >
                  <option value={13}>Petit · 13 × 11</option>
                  <option value={17}>Classique · 17 × 13</option>
                  <option value={21}>Grand · 21 × 17</option>
                </select>
                <ChevronDown size={16} />
              </div>
              {newMode === "computer" && (
                <>
                  <label className="field-label" htmlFor="difficulty">
                    Niveau de l’ordinateur
                  </label>
                  <div className="select-wrap">
                    <select
                      id="difficulty"
                      value={newLevel}
                      onChange={(e) => setNewLevel(e.target.value)}
                    >
                      <option value="easy">Découverte · pour prendre tes marques</option>
                      <option value="normal">Tactique · attaque et défense</option>
                    </select>
                    <ChevronDown size={16} />
                  </div>
                </>
              )}
              {game.moves.length > 0 && (
                <p className="reset-note">La partie en cours sera remplacée.</p>
              )}
              <label className="field-label" htmlFor="cadence">
                Durée totale de la partie
              </label>
              <div className="select-wrap">
                <select
                  id="cadence"
                  value={cadence}
                  onChange={(e) => setCadence(Number(e.target.value))}
                >
                  {CADENCES.map((minutes) => (
                    <option key={minutes} value={minutes}>
                      {minutes} minute{minutes > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} />
              </div>
              <p className="reset-note">
                À zéro, le score décide. Un abandon donne la victoire à l’adversaire.
              </p>
              <button className="primary-button" onClick={start}>
                Commencer la partie <ArrowRight size={17} />
              </button>
            </>
          ) : (
            <>
              <span className="tiny-label">LE DERNIER MOT</span>
              <h2>
                Abandonner <em>le duel ?</em>
              </h2>
              <p className="end-copy">
                L’adversaire gagne immédiatement, même si le joueur qui abandonne mène au score.
                L’horloge continue pendant cette confirmation.
              </p>
              {mode === "local" && (
                <>
                  <label className="field-label" htmlFor="resigning">
                    Qui abandonne ?
                  </label>
                  <div className="select-wrap">
                    <select
                      id="resigning"
                      value={resigning}
                      onChange={(e) => setResigning(Number(e.target.value) as 1 | 2)}
                    >
                      <option value={1}>Les bleus</option>
                      <option value={2}>Les rouges</option>
                    </select>
                    <ChevronDown size={16} />
                  </div>
                </>
              )}
              <div className="final-score">
                <span style={{ color: colors[1] }}>{score[1]}</span>
                <span>—</span>
                <span style={{ color: colors[2] }}>{score[2]}</span>
              </div>
              <button
                className="primary-button"
                onClick={() => {
                  setMatch((current) => resignMatch(current, resigning, Date.now()));
                  setModal(null);
                }}
              >
                Confirmer l’abandon <Flag size={16} />
              </button>
              <button className="dialog-back" onClick={() => setModal(null)}>
                Continuer à jouer
              </button>
            </>
          )}
        </div>
      </dialog>
    </div>
  );
}
