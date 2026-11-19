import { Timer, Pause } from "lucide-react";
import { formatClock } from "../lib/timed-game";
export function MatchClock({
  remaining,
  minutes,
  paused,
  ended,
  historical,
  waiting = false,
}: {
  remaining: number;
  minutes: number;
  paused: boolean;
  ended: boolean;
  waiting?: boolean;
  historical?: number | null;
}) {
  return (
    <div
      className={
        "match-clock " +
        (!waiting && !paused && !ended ? "running " : "") +
        (remaining <= 10000 && !ended ? "low-time " : "")
      }
      aria-label={`Temps de la partie : ${formatClock(remaining)}${paused ? ", en pause" : ""}`}
    >
      <div className="match-clock-copy">
        <span>{paused ? <Pause size={17} /> : <Timer size={17} />} Temps de la partie</span>
        <small>
          {minutes} min au total ·{" "}
          {ended ? "Partie terminée" : waiting ? "Au premier pion" : paused ? "En pause" : "Compte à rebours commun"}
        </small>
        {historical !== undefined && (
          <small className="historical-time">
            Au coup affiché :{" "}
            {historical === null ? "temps non enregistré" : formatClock(historical)}
          </small>
        )}
      </div>
      <time dateTime={`PT${Math.ceil(remaining / 1000)}S`}>{formatClock(remaining)}</time>
    </div>
  );
}
