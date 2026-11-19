import { useEffect, useMemo, useState, type ComponentProps } from "react";
import { Check, X, Crosshair } from "lucide-react";
import { legal, play, scores, type Game } from "../lib/kropki";
import { gameFeedback } from "../lib/game-feedback";
import { readStorage, writeStorage } from "../lib/browser-storage";
import { GameBoard } from "./game-board";
import { ArenaBoard } from "./arena-board";

type Props = ComponentProps<typeof ArenaBoard> & { arena?: boolean; guided?: boolean; positionToken?: number };
export function TacticalBoard({arena = true, guided = false, positionToken, ...props}: Props) {
  const [direct, setDirect] = useState(() => !guided && readStorage(() => localStorage, "kropki-direct-placement") === "true");
  const [selection, setSelection] = useState<{game: Game; token?: number; x: number; y: number} | null>(null);
  useEffect(() => {if (props.locked) setSelection(null);}, [props.locked]);
  const current = selection && (positionToken === undefined ? selection.game === props.game : selection.token === positionToken);
  const candidate = current && !props.locked && legal(props.game, selection.x, selection.y) ? selection : null;
  const preview = useMemo(() => candidate ? play(props.game, candidate.x, candidate.y) : null, [props.game, candidate]);
  const feedback = preview ? gameFeedback(props.game, preview) : null;
  const before = scores(props.game), after = preview ? scores(preview) : before;
  const player = props.game.turn;
  function select(x: number, y: number) {
    if (props.locked || !legal(props.game, x, y)) return;
    if (direct) { props.onMove(x, y); return; }
    setSelection({game: props.game, token: positionToken, x, y});
  }
  const boardProps = {...props, onMove: select, previewGame: preview ?? undefined, selection: candidate ? [candidate.x, candidate.y] as [number, number] : undefined};
  return <div className={`tactical-board turn-${player}`}>
    <div className="turn-banner">
      <Crosshair size={19} />
      <div><strong>{props.game.ended ? "Partie terminée" : props.locked ? "Plateau en attente" : `À toi · ${player === 1 ? "Bleus" : "Rouges"}`}</strong>
      <span>{props.game.ended ? "Consulte le résultat ou la relecture." : props.locked ? "Les commandes seront disponibles à ton tour." : direct ? "Placement direct activé" : "Sélectionne · Observe · Confirme"}</span></div>
    </div>
    {arena ? <ArenaBoard {...boardProps} /> : <GameBoard {...boardProps} />}
    <section className="move-intent" aria-label="Aperçu du coup">
      <output aria-live="polite">
        {candidate ? <><strong>{String.fromCharCode(65 + candidate.x)}{candidate.y + 1} · Coup sélectionné</strong><span>{after[player] - before[player] > 0 ? `+${after[player] - before[player]} point(s) capturé(s)` : "Aucun point gagné sur ce coup"}{feedback?.liberated.length ? ` · ${feedback.liberated.length} point(s) libéré(s)` : ""}{after[player === 1 ? 2 : 1] > before[player === 1 ? 2 : 1] ? " · Attention : point capturé par l’adversaire" : ""}</span></> : <><strong>{direct ? "Pose immédiate" : "Prépare ton prochain point"}</strong><span>{guided ? "Choisis l’intersection conseillée, puis confirme." : "Aperçu d’un seul coup, sans prédiction des réponses adverses."}</span></>}
      </output>
      {!direct && <div className="intent-actions"><button type="button" aria-label="Annuler la sélection" disabled={!candidate} onClick={() => setSelection(null)}><X size={17} /> Annuler</button><button type="button" className="primary-button" disabled={!candidate} onClick={() => {if (!candidate) return; setSelection(null); props.onMove(candidate.x, candidate.y);}}><Check size={18} /> Confirmer le coup</button></div>}
      {!guided && <label className="direct-placement"><input aria-label="Placement direct (sans confirmation)" type="checkbox" checked={direct} onChange={e => {setDirect(e.target.checked);setSelection(null);writeStorage(() => localStorage,"kropki-direct-placement",String(e.target.checked));}} /> Placement direct (sans confirmation)</label>}
      {candidate && !guided && <p className="intent-clock">Le temps continue pendant l’aperçu. Aucun point n’est posé avant confirmation.</p>}
    </section>
  </div>;
}