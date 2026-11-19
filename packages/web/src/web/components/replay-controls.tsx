import {
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  ArrowRight,
  History,
} from "lucide-react";
export function ReplayControls({
  position,
  total,
  playing,
  onChange,
  onPlay,
  onExit,
}: {
  position: number;
  total: number;
  playing: boolean;
  onChange: (n: number) => void;
  onPlay: () => void;
  onExit: () => void;
}) {
  return (
    <div className="replay-controls">
      <div className="replay-top">
        <span>
          <History size={15} /> RELECTURE{" "}
          <strong>
            {position} / {total}
          </strong>
        </span>
        <button onClick={onExit}>
          Retour à la partie <ArrowRight size={14} />
        </button>
      </div>
      <div className="replay-navigation">
        <button
          aria-label="Début de la partie"
          title="Début"
          disabled={position === 0}
          onClick={() => onChange(0)}
        >
          <SkipBack size={17} />
        </button>
        <button
          aria-label="Coup précédent"
          title="Précédent"
          disabled={position === 0}
          onClick={() => onChange(position - 1)}
        >
          <ChevronLeft size={20} />
        </button>
        <button
          className="replay-play"
          aria-label={playing ? "Mettre en pause" : "Lire la partie"}
          onClick={onPlay}
        >
          {playing ? <Pause size={17} /> : <Play size={17} />}
        </button>
        <button
          aria-label="Coup suivant"
          title="Suivant"
          disabled={position === total}
          onClick={() => onChange(position + 1)}
        >
          <ChevronRight size={20} />
        </button>
        <button
          aria-label="Fin de la partie"
          title="Fin"
          disabled={position === total}
          onClick={() => onChange(total)}
        >
          <SkipForward size={17} />
        </button>
        <label className="sr-only" htmlFor="replay-position">
          Position dans la partie
        </label>
        <input
          id="replay-position"
          aria-label="Position dans la partie"
          type="range"
          min={0}
          max={total}
          value={position}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-valuetext={`Coup ${position} sur ${total}`}
        />
      </div>
      <p>
        Lecture seule : plateau conservé, compte à rebours commun en pause. Le temps déjà dépensé
        reste acquis.
      </p>
    </div>
  );
}
