import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  GraduationCap,
  Lightbulb,
  RotateCcw,
  ScanLine,
  Undo2,
  ShieldCheck,
  HardDrive,
} from "lucide-react";
import { OnlineShell } from "../components/online-shell";
import { GameBoard } from "../components/game-board";
import { TrainingAnalysisPanel } from "../components/training-analysis-panel";
import { useTrainingAnalysis } from "../hooks/use-training-analysis";
import { createGame, legal, play, replay, scores, type Game } from "../lib/kropki";
import { gameFeedback, type Feedback } from "../lib/game-feedback";
import { EXERCISES, attemptExercise } from "../lib/training-exercises";
import { coordinate } from "../lib/training-analysis";
import {
  completeExercise,
  PROGRESS_KEY,
  SANDBOX_KEY,
  restoreProgress,
  restoreSandbox,
  serializeProgress,
  serializeSandbox,
  TRAINING_SIZES,
  type Progress,
} from "../lib/training-storage";

function loadLocal() {
  try {
    return {
      progress: restoreProgress(localStorage.getItem(PROGRESS_KEY)),
      sandbox: restoreSandbox(localStorage.getItem(SANDBOX_KEY)),
      error: false,
    };
  } catch {
    return { progress: {} as Progress, sandbox: createGame(9, 9), error: true };
  }
}

export default function Training() {
  const [stored] = useState(loadLocal);
  const [progress, setProgress] = useState(stored.progress);
  const [sandbox, setSandbox] = useState(stored.sandbox);
  const [storageError, setStorageError] = useState(stored.error);
  const [mode, setMode] = useState<"exercises" | "sandbox">("exercises");
  const [index, setIndex] = useState(0);
  const exercise = EXERCISES[index];
  const [position, setPosition] = useState<Game>(() => EXERCISES[0].create());
  const [attempt, setAttempt] = useState<"playing" | "success" | "failed" | "solution">("playing");
  const [message, setMessage] = useState("");
  const [sandboxMessage, setSandboxMessage] = useState("");
  const [assisted, setAssisted] = useState(false);
  const seenSolutions = useRef(new Set<string>());
  const [hint, setHint] = useState(false);
  const [target, setTarget] = useState<[number, number] | undefined>();
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [analysisOn, setAnalysisOn] = useState(false);
  const [newSize, setNewSize] = useState(stored.sandbox.w);
  const game = mode === "exercises" ? position : sandbox;
  const analysis = useTrainingAnalysis(sandbox, mode === "sandbox" && analysisOn);
  const score = scores(game),
    completed = Object.keys(progress).length;

  useEffect(() => {
    try {
      localStorage.setItem(PROGRESS_KEY, serializeProgress(progress));
      localStorage.setItem(SANDBOX_KEY, serializeSandbox(sandbox));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [progress, sandbox]);
  useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(() => setFeedback(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  function selectExercise(next: number) {
    setIndex(next);
    setPosition(EXERCISES[next].create());
    setAttempt("playing");
    setAssisted(seenSolutions.current.has(EXERCISES[next].id));
    setHint(false);
    setTarget(undefined);
    setFeedback(null);
    setMessage("");
  }
  function switchMode(next: "exercises" | "sandbox") {
    setMode(next);
    setSandboxMessage("");
    setFeedback(null);
    setTarget(
      next === "exercises" && hint && attempt === "playing" ? exercise.solution : undefined,
    );
  }
  function move(x: number, y: number) {
    if (!legal(game, x, y)) {
      if (mode === "sandbox") setSandboxMessage("Cette intersection n’est pas disponible.");
      else setMessage("Cette intersection n’est pas disponible.");
      return;
    }
    setTarget(undefined);
    if (mode === "sandbox") {
      const next = play(sandbox, x, y);
      setFeedback(gameFeedback(sandbox, next));
      setSandbox(next);
      setSandboxMessage("");
      return;
    }
    if (attempt !== "playing") return;
    const result = attemptExercise(exercise, position, x, y);
    setFeedback(gameFeedback(position, result.game));
    setPosition(result.game);
    setMessage(result.message);
    setAttempt(result.success ? "success" : "failed");
    if (result.success) setProgress((p) => completeExercise(p, exercise.id, assisted));
  }
  function showSolution() {
    seenSolutions.current.add(exercise.id);
    const initial = exercise.create(),
      result = attemptExercise(exercise, initial, ...exercise.solution);
    setAssisted(true);
    setHint(false);
    setTarget(undefined);
    setAttempt("solution");
    setPosition(result.game);
    setFeedback(gameFeedback(initial, result.game));
    setMessage(
      `Démonstration : les bleus jouent ${coordinate(...exercise.solution)}. ${result.message} Cette démonstration ne valide pas l’exercice.`,
    );
  }

  return (
    <OnlineShell>
      <div className="page-heading training-heading">
        <div>
          <span className="eyebrow">L’ATELIER KROPKI</span>
          <h1>
            Un coup. Un déclic<span>.</span>
          </h1>
          <p>Comprendre les captures, anticiper les menaces, reprendre le terrain.</p>
        </div>
        <div className="training-progress">
          <GraduationCap size={24} />
          <strong>
            {completed}
            <span> / {EXERCISES.length}</span>
          </strong>
          <small>exercices réussis ici</small>
          <progress
            value={completed}
            max={EXERCISES.length}
            aria-label="Progression des exercices"
          />
        </div>
      </div>
      <div
        className="training-tabs"
        role="tablist"
        tabIndex={-1}
        aria-label="Mode d’entraînement"
        onKeyDown={(event) => {
          if (
            event.key === "ArrowLeft" ||
            event.key === "ArrowRight" ||
            event.key === "Home" ||
            event.key === "End"
          ) {
            event.preventDefault();
            const next =
              event.key === "Home"
                ? "exercises"
                : event.key === "End"
                  ? "sandbox"
                  : mode === "exercises"
                    ? "sandbox"
                    : "exercises";
            switchMode(next);
            document.getElementById(next === "exercises" ? "exercise-tab" : "sandbox-tab")?.focus();
          }
        }}
      >
        <button
          id="exercise-tab"
          role="tab"
          tabIndex={mode === "exercises" ? 0 : -1}
          aria-selected={mode === "exercises"}
          aria-controls="training-panel"
          onClick={() => switchMode("exercises")}
        >
          <GraduationCap size={18} /> Exercices
        </button>
        <button
          id="sandbox-tab"
          role="tab"
          tabIndex={mode === "sandbox" ? 0 : -1}
          aria-selected={mode === "sandbox"}
          aria-controls="training-panel"
          onClick={() => switchMode("sandbox")}
        >
          <ScanLine size={18} /> Plateau libre
        </button>
      </div>
      <div className="training-local-note">
        <HardDrive size={15} />
        <span>
          {storageError
            ? "Stockage indisponible : la progression et le plateau restent seulement dans cette session."
            : "Progression sur cet appareil uniquement. Partie habituelle conservée. Aucun effet sur l’Elo."}
        </span>
      </div>
      <section
        id="training-panel"
        role="tabpanel"
        aria-labelledby={mode === "exercises" ? "exercise-tab" : "sandbox-tab"}
      >
        {mode === "exercises" && (
          <nav className="exercise-picker" aria-label="Choisir un exercice">
            {EXERCISES.map((e, i) => (
              <button
                key={e.id}
                aria-current={index === i ? "step" : undefined}
                onClick={() => selectExercise(i)}
                className={(index === i ? "current " : "") + (progress[e.id] ? "completed" : "")}
              >
                <span className="exercise-number">
                  {progress[e.id] ? <Check size={16} /> : String(i + 1).padStart(2, "0")}
                </span>
                <span>
                  <small>
                    {e.category} · {e.level}
                  </small>
                  <strong>{e.title}</strong>
                  {progress[e.id] && (
                    <small>
                      {progress[e.id].unassisted ? "Réussi sans aide" : "Réussi avec aide"}
                    </small>
                  )}
                </span>
              </button>
            ))}
          </nav>
        )}
        <div className="training-layout">
          <div className="training-board-column">
            <div className="training-board-banner">
              <span>
                <ShieldCheck size={19} />{" "}
                {mode === "exercises"
                  ? "À toi de jouer les bleus"
                  : `Au tour des ${game.turn === 1 ? "bleus" : "rouges"}`}
              </span>
              <strong>Sans chrono</strong>
            </div>
            <div className="training-scores">
              <span>
                <i className="blue-dot" /> Bleus <strong>{score[1]}</strong>
                <small>capturé{score[1] > 1 ? "s" : ""}</small>
              </span>
              <span>
                <i className="red-dot" /> Rouges <strong>{score[2]}</strong>
                <small>capturé{score[2] > 1 ? "s" : ""}</small>
              </span>
            </div>
            <GameBoard
              game={game}
              onMove={move}
              locked={mode === "exercises" ? attempt !== "playing" : game.ended}
              target={target}
              feedback={feedback}
              ariaLabel="Plateau d’entraînement Kropki"
            />
            <p className="training-board-caption">
              {mode === "exercises"
                ? "Position composée pour cet exercice · Un coup pour atteindre l’objectif."
                : `Tu contrôles les deux couleurs · ${game.moves.length} coup(s) joué(s) · ${game.w} × ${game.h}`}
            </p>
            {mode === "sandbox" && (
              <div className="training-board-actions">
                <button
                  className="small-button"
                  disabled={!sandbox.moves.length}
                  onClick={() => {
                    setSandbox(replay(sandbox.moves.slice(0, -1), sandbox.w, sandbox.h));
                    setFeedback(null);
                    setTarget(undefined);
                    setSandboxMessage("");
                  }}
                >
                  <Undo2 size={16} /> Annuler le dernier coup
                </button>
                <button
                  className="small-button"
                  onClick={() => {
                    setSandbox(createGame(sandbox.w, sandbox.h));
                    setFeedback(null);
                    setTarget(undefined);
                    setSandboxMessage("");
                  }}
                >
                  <RotateCcw size={16} /> Vider ce plateau
                </button>
              </div>
            )}
          </div>
          <aside className="training-workshop">
            {mode === "exercises" ? (
              <>
                <span className="eyebrow">
                  EXERCICE {index + 1} / {EXERCISES.length} · {exercise.category}
                </span>
                <h2>{exercise.title}</h2>
                <p className="training-objective">{exercise.objective}</p>
                {message && (
                  <output className={`training-result ${attempt}`}>
                    <strong>
                      {attempt === "success"
                        ? "Bien joué !"
                        : attempt === "failed"
                          ? "Une autre piste à explorer"
                          : attempt === "solution"
                            ? "La solution, démontrée"
                            : "À vérifier"}
                    </strong>
                    <p>{message}</p>
                  </output>
                )}
                {(attempt === "success" || attempt === "solution") && (
                  <div className="training-lesson">
                    <Lightbulb size={20} />
                    <div>
                      <strong>Ce qu’il faut retenir</strong>
                      <p>{exercise.lesson}</p>
                    </div>
                  </div>
                )}
                {hint && attempt === "playing" && (
                  <output className="training-tip">
                    <Lightbulb size={20} />
                    <div>
                      <strong>Un indice</strong>
                      <p>{exercise.hint}</p>
                      <p>L’intersection {coordinate(...exercise.solution)} est repérée en jaune.</p>
                    </div>
                  </output>
                )}
                <div className="training-controls">
                  {attempt === "playing" && (
                    <>
                      <button
                        className="small-button"
                        disabled={hint}
                        onClick={() => {
                          setAssisted(true);
                          setHint(true);
                          setTarget(exercise.solution);
                        }}
                      >
                        <Lightbulb size={16} /> Afficher un indice
                      </button>
                      <button className="small-button" onClick={showSolution}>
                        Voir la solution
                      </button>
                    </>
                  )}
                  {attempt !== "playing" && (
                    <button className="primary-button" onClick={() => selectExercise(index)}>
                      <RotateCcw size={16} />{" "}
                      {attempt === "solution" ? "Essayer moi-même" : "Recommencer"}
                    </button>
                  )}
                  {attempt === "failed" && (
                    <button className="small-button" onClick={showSolution}>
                      Voir la solution
                    </button>
                  )}
                  {attempt === "success" && index < EXERCISES.length - 1 && (
                    <button className="primary-button" onClick={() => selectExercise(index + 1)}>
                      Exercice suivant <ArrowRight size={16} />
                    </button>
                  )}
                  {attempt === "success" && completed === EXERCISES.length && (
                    <button className="small-button" onClick={() => switchMode("sandbox")}>
                      Explorer le plateau libre <ArrowRight size={16} />
                    </button>
                  )}
                </div>
                <p className="training-muted">
                  Tous les exercices sont accessibles. Un indice compte comme une aide ; voir la
                  solution ne marque pas l’exercice comme réussi.
                </p>
              </>
            ) : (
              <>
                <span className="eyebrow">TON LABORATOIRE</span>
                <h2>Essaie. Observe. Rejoue.</h2>
                <p className="training-objective">
                  Pose les points des deux joueurs pour construire une position et observer les
                  captures.
                </p>
                <label className="field-label" htmlFor="training-size">
                  Taille du nouveau plateau
                </label>
                <select
                  id="training-size"
                  value={newSize}
                  onChange={(e) => setNewSize(Number(e.target.value))}
                >
                  {TRAINING_SIZES.map((s) => (
                    <option key={s.w} value={s.w}>
                      {s.w} × {s.h}
                    </option>
                  ))}
                </select>
                <button
                  className="small-button"
                  onClick={() => {
                    const s = TRAINING_SIZES.find((s) => s.w === newSize)!;
                    setSandbox(createGame(s.w, s.h));
                    setFeedback(null);
                    setTarget(undefined);
                    setSandboxMessage("");
                  }}
                >
                  Créer ce plateau vide
                </button>
                <p className="training-muted">
                  Cette action remplace uniquement le plateau libre d’entraînement.
                </p>
                <button
                  className="primary-button"
                  aria-pressed={analysisOn}
                  onClick={() => {
                    setAnalysisOn(!analysisOn);
                    setTarget(undefined);
                  }}
                >
                  <ScanLine size={17} /> {analysisOn ? "Masquer l’analyse" : "Analyser la position"}
                </button>
                {analysisOn && <TrainingAnalysisPanel {...analysis} onTarget={setTarget} />}
                {sandboxMessage && <output>{sandboxMessage}</output>}
                {sandbox.ended && (
                  <output className="training-result">
                    Le plateau est plein. Annule un coup ou crée un nouveau plateau pour continuer.
                  </output>
                )}
              </>
            )}
          </aside>
        </div>
      </section>
    </OnlineShell>
  );
}
