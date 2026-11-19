import { useState } from "react";
import { ArrowRight, ArrowLeft, Check, RotateCcw, X, GraduationCap } from "lucide-react";
import { createGame, play, scores, type Game } from "../lib/kropki";
import { gameFeedback, type Feedback } from "../lib/game-feedback";
import { TacticalBoard } from "./tactical-board";
export function tutorialStart() {
  return createGame(7, 7);
}
export function tutorialCapture(g: Game) {
  let n = play(g, 4, 3);
  n = play(n, 6, 6);
  n = play(n, 3, 4);
  return play(n, 5, 6);
}
export function tutorialClose(g: Game) {
  return play(g, 2, 3);
}
export function Tutorial({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0),
    [game, setGame] = useState(tutorialStart),
    [feedback, setFeedback] = useState<Feedback | null>(null),
    [hint, setHint] = useState("");
  const target: [number, number] | undefined =
    step === 0 ? [3, 2] : step === 2 ? [2, 3] : undefined;
  const copy = [
    {
      title: "Un point, une intersection.",
      text: "Tu joues les bleus. Sélectionne D3, observe le point fantôme puis clique sur Confirmer le coup. La sélection seule ne pose rien.",
    },
    {
      title: "Chacun son tour.",
      text: "Le rouge vient de répondre en D4. Les points voisins peuvent se relier horizontalement, verticalement ou en diagonale.",
    },
    {
      title: "Ferme le piège.",
      text: "Trois points bleus entourent D4. Sélectionne C4 : l’aperçu annonce +1 et trace la future frontière. Confirme pour fermer la boucle en diagonale.",
    },
    {
      title: "Un point capturé, un point gagné.",
      text: "Le point rouge est capturé : +1 pour les bleus. La frontière s’est tracée automatiquement. Tu connais maintenant le geste essentiel de Kropki.",
    },
  ];
  function move(x: number, y: number) {
    if (!target || x !== target[0] || y !== target[1]) {
      setHint("Choisis l’intersection mise en évidence pour cette étape.");
      return;
    }
    setHint("");
    if (step === 0) {
      let n = play(game, x, y);
      n = play(n, 3, 3);
      setGame(n);
      setStep(1);
    } else if (step === 2) {
      const n = tutorialClose(game);
      setFeedback(gameFeedback(game, n));
      setGame(n);
      setStep(3);
    }
  }
  function reset() {
    setGame(tutorialStart());
    setStep(0);
    setFeedback(null);
    setHint("");
  }
  return (
    <section className="tutorial-panel" aria-label="Tutoriel interactif Kropki">
      <div className="tutorial-header">
        <span>
          <GraduationCap size={21} /> Ton premier territoire
        </span>
        <button aria-label="Quitter le tutoriel" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      <div className="tutorial-progress" aria-label={`Étape ${step + 1} sur 4`}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={i <= step ? "done" : ""}>
            {i < step ? <Check size={12} /> : i + 1}
          </span>
        ))}
      </div>
      <div className="tutorial-layout">
        <div className="tutorial-board">
          <TacticalBoard
            arena={false}
            guided
            game={game}
            onMove={move}
            locked={step === 1 || step === 3}
            target={target}
            feedback={feedback}
            ariaLabel="Plateau du tutoriel : joue sur l’intersection conseillée"
          />
          <div className="tutorial-scores">
            <span>
              <i className="blue-dot" /> Bleus <strong>{scores(game)[1]}</strong>
            </span>
            <span>
              <i className="red-dot" /> Rouges <strong>{scores(game)[2]}</strong>
            </span>
          </div>
        </div>
        <div className="tutorial-instructions">
          <span className="field-caption">ÉTAPE {step + 1} SUR 4</span>
          <h2>{copy[step].title}</h2>
          <p>{copy[step].text}</p>
          {step === 0 || step === 2 ? (
            <div className="tutorial-action">
              <span className="target-mini" />À toi : joue en{" "}
              <strong>{step === 0 ? "D3" : "C4"}</strong>
            </div>
          ) : null}
          <output className="tutorial-hint" aria-live="polite">
            {hint}
          </output>
          {step === 1 && (
            <button
              className="primary-button"
              onClick={() => {
                setGame(tutorialCapture(game));
                setStep(2);
              }}
            >
              Préparer la capture <ArrowRight size={16} />
            </button>
          )}
          {step === 3 && (
            <>
              <div className="tutorial-success">
                <Check size={17} /> Premier territoire conquis !
              </div>
              <button className="primary-button" onClick={onClose}>
                Retour à ma partie <ArrowRight size={17} />
              </button>
              <button className="tutorial-restart" onClick={reset}>
                <RotateCcw size={14} /> Recommencer
              </button>
            </>
          )}
          <p className="tutorial-preservation">
            Exercice séparé : ta partie est conservée et son compte à rebours commun est en pause.
          </p>
        </div>
      </div>
      <button className="tutorial-back" onClick={onClose}>
        <ArrowLeft size={15} /> Revenir sans terminer
      </button>
    </section>
  );
}
