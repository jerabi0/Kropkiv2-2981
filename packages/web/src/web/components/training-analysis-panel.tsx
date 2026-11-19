import { Lightbulb, ShieldAlert, ScanLine } from "lucide-react";
import { coordinate, type PositionAnalysis } from "../lib/training-analysis";

export function TrainingAnalysisPanel({
  data,
  loading,
  error,
  onTarget,
}: {
  data?: PositionAnalysis;
  loading: boolean;
  error?: string;
  onTarget: (point: [number, number]) => void;
}) {
  return (
    <section className="training-analysis" aria-label="Analyse tactique" aria-busy={loading}>
      <h3>
        <ScanLine size={18} /> La position, à la loupe
      </h3>
      <p className="training-muted">
        Calcul exhaustif à un coup, pour le joueur au trait. Pas une analyse stratégique complète.
      </p>
      {loading && <output>Analyse en cours… Le plateau reste jouable.</output>}
      {error && <p role="alert">{error}</p>}
      {data && (
        <>
          <output className="analysis-summary">
            {data.legalCount} intersections légales · {data.captures.length} coup(s) de capture ·{" "}
            {data.threats.length} menace(s)
          </output>
          {data.suggestion ? (
            <div className="training-tip">
              <Lightbulb size={19} />
              <div>
                <strong>Une piste vérifiée</strong>
                <p>{data.suggestion.explanation}</p>
                <button
                  className="small-button"
                  onClick={() => onTarget([data.suggestion!.x, data.suggestion!.y])}
                >
                  Repérer {coordinate(data.suggestion.x, data.suggestion.y)}
                </button>
              </div>
            </div>
          ) : (
            <p className="training-muted">
              {data.legalCount
                ? "Aucune suggestion de capture ou de blocage sûr à un coup. Construis tes chaînes et surveille la suite."
                : "Aucune intersection légale : ce plateau est terminé."}
            </p>
          )}
          <h4>Captures possibles maintenant</h4>
          {data.captures.length ? (
            <ul className="tactical-list">
              {data.captures.map((c) => (
                <li key={`${c.x}-${c.y}`}>
                  <button onClick={() => onTarget([c.x, c.y])}>{coordinate(c.x, c.y)}</button>
                  <span>
                    {c.captured} capture(s){c.liberated ? ` · ${c.liberated} libération(s)` : ""}
                    {c.selfCaptured ? " · point joué capturé" : ""}
                    <small>
                      Ton score {c.ownDelta >= 0 ? "+" : ""}
                      {c.ownDelta} · Adversaire {c.enemyDelta >= 0 ? "+" : ""}
                      {c.enemyDelta}
                    </small>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="training-muted">Aucune capture immédiate.</p>
          )}
          <h4>
            <ShieldAlert size={16} /> Si l’adversaire jouait maintenant
          </h4>
          <p className="training-muted">
            Ces menaces sont calculées avant ton prochain coup. Jouer peut les modifier.
          </p>
          {data.threats.length ? (
            <ul className="tactical-list threat-list">
              {data.threats.map((c) => (
                <li key={`${c.x}-${c.y}`}>
                  <button onClick={() => onTarget([c.x, c.y])}>{coordinate(c.x, c.y)}</button>
                  <span>
                    {c.captured} de tes points capturés
                    {c.liberated ? ` · ${c.liberated} point(s) adverse(s) libéré(s)` : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="training-muted">Aucune capture adverse immédiate.</p>
          )}
        </>
      )}
    </section>
  );
}
