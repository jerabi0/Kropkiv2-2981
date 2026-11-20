import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Copy, Check, Flag, History, RefreshCw, Trophy } from "lucide-react";
import { OnlineShell, RequireAccount } from "../components/online-shell";
import { LocalArenaAvatar } from "../components/arena-avatar";
import { TacticalBoard } from "../components/tactical-board";
import { MatchClock } from "../components/match-clock";
import { ReplayControls } from "../components/replay-controls";
import { roomQuery, joinPrivate, actionPrivate } from "../queries/private-games";
import { replay, scores, type Game } from "../lib/kropki";
import { gameFeedback, type Feedback } from "../lib/game-feedback";
export default function PrivateGame({ params }: { params: { id: string } }) {
  return (
    <RequireAccount>
      <Room key={params.id} id={params.id} />
    </RequireAccount>
  );
}
function Room({ id }: { id: string }) {
  const query = useQuery(roomQuery(id)),
    join = useMutation(joinPrivate()),
    action = useMutation(actionPrivate()),
    qc = useQueryClient();
  const [copied, setCopied] = useState(false),
    [confirm, setConfirm] = useState(false),
    [now, setNow] = useState(Date.now()),
    [offset, setOffset] = useState(0),
    [review, setReview] = useState<number | null>(null),
    [playing, setPlaying] = useState(false),
    [feedback, setFeedback] = useState<Feedback | null>(null);
  const previous = useRef<Game | null>(null);
  const data = query.data;
  const game = data && "game" in data ? data.game : null;
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (data) setOffset(Date.now() - data.serverNow);
  }, [data]);
  useEffect(() => {
    if (game) {
      if (previous.current) setFeedback(gameFeedback(previous.current, game));
      previous.current = game;
    }
  }, [game]);
  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(t);
  }, [feedback]);
  useEffect(() => {
    if (review === null || !playing || !game) return;
    if (review >= game.moves.length) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setReview(review + 1), 900);
    return () => clearTimeout(t);
  }, [review, playing, game]);
  const refresh = () => qc.invalidateQueries({ queryKey: roomQuery(id).queryKey });
  function send(
    a: { type: "ready" } | { type: "resign" } | { type: "move"; x: number; y: number },
  ) {
    if (!data) return;
    action.mutate(
      { id, revision: data.revision, requestId: crypto.randomUUID(), action: a },
      { onSettled: () => void refresh() },
    );
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }
  if (!data)
    return (
      <OnlineShell>
        <h1>
          Ta partie privée<span>.</span>
        </h1>
        <p>{query.isError ? query.error.message : "Chargement de la salle…"}</p>
        {query.isError && (
          <button className="primary-button" onClick={() => void query.refetch()}>
            Réessayer <RefreshCw size={16} />
          </button>
        )}
        <Link href="/en-ligne">Retour aux parties</Link>
      </OnlineShell>
    );
  if (!("game" in data))
    return (
      <OnlineShell>
        <section className="online-card join-card">
          <span className="eyebrow">INVITATION PRIVÉE</span>
          <h1>
            {data.blue.name} t’invite<span>.</span>
          </h1>
          <p>
            {data.w} × {data.h} · {data.minutes} minutes au total
          </p>
          <p>Tu prendras les rouges. Le chrono démarre au premier pion, après les deux confirmations.</p>
          <output className="online-error">{join.error?.message}</output>
          <button
            className="primary-button"
            disabled={data.full || now - offset >= data.expiresAt || join.isPending}
            onClick={() => join.mutate({ id }, { onSuccess: () => void refresh() })}
          >
            {data.full
              ? "Cette salle est complète"
              : now - offset >= data.expiresAt
                ? "Invitation expirée"
                : "Rejoindre la partie"}
          </button>
          <Link href="/en-ligne">Créer ma propre partie</Link>
        </section>
      </OnlineShell>
    );
  const view =
    review === null
      ? data.game
      : replay(data.game.moves.slice(0, review), data.game.w, data.game.h);
  const score = scores(view),
    ended = !!data.result || !!data.cancelled;
  const remaining =
    data.deadline === null
      ? data.minutes * 60000
      : Math.max(0, data.deadline - (ended ? (data.finishedAt ?? data.serverNow) : now - offset));
  const result = data.result
    ? (data.result.reason === "time" ? "Temps écoulé : " : data.result.reason === "disconnect" ? "Déconnexion : " : "") +
      (data.result.winner === null
        ? "Égalité parfaite."
        : data.result.winner === 1
          ? "Les bleus remportent la partie."
          : "Les rouges remportent la partie.") +
      (data.result.reason === "resign" ? " Victoire par abandon." : data.result.reason === "disconnect" ? " Victoire après déconnexion." : "")
    : data.cancelled
      ? "Duel annulé : le premier pion n’a pas été placé à temps. Aucun changement d’Elo."
      : "";
  const opponentSeenAt = data.presence
    ? data.player === 1 ? data.presence.redLastSeenAt : data.presence.blueLastSeenAt
    : null;
  const serverNow = now - offset;
  const disconnectDeadline = opponentSeenAt !== null && data.presence
    ? opponentSeenAt + data.presence.heartbeatTimeoutMs + data.presence.disconnectGraceMs
    : null;
  const opponentDisconnected = !!data.startedAt && !ended && disconnectDeadline !== null &&
    serverNow >= opponentSeenAt! + data.presence!.heartbeatTimeoutMs && serverNow < disconnectDeadline;
  const graceRemaining = disconnectDeadline === null ? 0 : Math.max(0, Math.ceil((disconnectDeadline - serverNow) / 1000));
  return (
    <OnlineShell>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            {data.ranked ? "DUEL CLASSÉ" : "PARTIE PRIVÉE"} ·{" "}
            {data.player === 1 ? "TU JOUES LES BLEUS" : "TU JOUES LES ROUGES"}
          </span>
          <h1>
            {data.ranked ? "Ton prochain défi" : "Un duel, deux écrans"}
            <span>.</span>
          </h1>
          <p>
            {data.startedAt
              ? "Le serveur arbitre les coups et le compte à rebours commun."
              : "Le compte à rebours démarrera au premier pion, une fois les deux joueurs prêts."}
          </p>
        </div>
        <Link href="/en-ligne">Mes parties</Link>
      </div>
      <div className="game-area" data-match-phase={ended ? "finished" : data.startedAt === null ? (data.ready.every(Boolean) ? "ready" : "waiting") : "active"} data-score-lead={score[1] === score[2] ? "tie" : score[1] > score[2] ? "blue" : "red"}>
        <div className="board-column">
          <MatchClock
            minutes={data.minutes}
            remaining={remaining}
            waiting={data.startedAt === null}
            paused={false}
            ended={ended}
            historical={
              review === null
                ? undefined
                : review === 0
                  ? data.minutes * 60000
                  : Math.max(0, (data.deadline ?? 0) - (data.moveTimes[review - 1] ?? 0))
            }
          />
          <div className="online-players">
            <div className={view.turn === 1 && !ended ? "active" : ""}>
              {data.player === 1 ? <LocalArenaAvatar /> : <i className="blue-dot" />}
              <strong>{data.blue.name}</strong>
              <span>
                <span key={score[1]} className={score[1] > 0 ? "score-value score-value-active" : "score-value"}>{score[1]}</span> capturé{score[1] > 1 ? "s" : ""}
              </span>
            </div>
            <div className={view.turn === 2 && !ended ? "active" : ""}>
              {data.player === 2 ? <LocalArenaAvatar /> : <i className="red-dot" />}
              <strong>{data.red?.name ?? "En attente…"}</strong>
              <span>
                <span key={score[2]} className={score[2] > 0 ? "score-value score-value-active" : "score-value"}>{score[2]}</span> capturé{score[2] > 1 ? "s" : ""}
              </span>
            </div>
          </div>
          {review !== null && (
            <ReplayControls
              position={review}
              total={data.game.moves.length}
              playing={playing}
              onChange={(n) => {
                setReview(n);
                setPlaying(false);
              }}
              onPlay={() => {
                if (review === data.game.moves.length) setReview(0);
                setPlaying(!playing);
              }}
              onExit={() => {
                setReview(null);
                setPlaying(false);
              }}
            />
          )}
          <TacticalBoard
            game={view}
            positionToken={data.revision}
            active={review === null}
            ownPlayer={data.player}
            locked={
              !data.ready.every(Boolean) ||
              remaining <= 0 ||
              (data.startedAt === null && now - offset >= data.expiresAt) ||
              ended ||
              view.turn !== data.player ||
              action.isPending ||
              query.fetchStatus === "paused" ||
              query.isError ||
              review !== null
            }
            onMove={(x, y) => send({ type: "move", x, y })}
            feedback={review === null ? feedback : null}
          />
          {ended && review === null && (
            <section
              className={"match-finale " + (data.cancelled ? "match-finale-cancelled" : data.result?.winner === null ? "match-finale-draw" : data.result?.winner === data.player ? "match-finale-win" : "match-finale-loss")}
              aria-live="polite"
            >
              <span className="match-finale-icon"><Trophy size={25} /></span>
              <div className="match-finale-copy">
                <span className="match-finale-kicker">RÉSULTAT DU DUEL</span>
                <h2>
                  {data.cancelled
                    ? "Duel annulé"
                    : data.result?.winner === null
                      ? "Égalité parfaite"
                      : data.result?.winner === data.player ? "Victoire !" : "Défaite"}
                </h2>
                <p>{result}</p>
              </div>
              {!data.cancelled && (
                <div className="match-finale-score" aria-label={`Score final : ${score[1]} à ${score[2]}`}>
                  <strong>{score[1]}</strong><span>—</span><strong>{score[2]}</strong>
                </div>
              )}
            </section>
          )}
          <div className="message" aria-live="polite">
            {ended
              ? result
              : data.ready.every(Boolean)
                ? data.game.turn === data.player
                  ? "À toi de jouer."
                  : "À ton adversaire de jouer."
                : "En attente des deux joueurs prêts."}
          </div>
        </div>
        <aside className="right-column">
          <section className="online-card room-panel">
            <h2>
              {ended ? "Partie terminée" : data.startedAt ? "Duel en cours" : "Salle d’attente"}
            </h2>
            <p className="sync-note">
              {query.isError || query.fetchStatus === "paused"
                ? data.startedAt === null ? "Connexion interrompue — en attente du départ." : "Connexion interrompue — le délai de retour continue."
                : "Synchronisation avec le serveur"}{" "}
              <button aria-label="Actualiser la partie" onClick={() => void query.refetch()}>
                <RefreshCw size={14} />
              </button>
            </p>
            {!data.startedAt && !ended && (
              <>
                {data.ranked ? (
                  <div className="ready-deadline">
                    <strong>Adversaire trouvé !</strong>
                    <p>
                      Confirmez tous les deux et placez le premier pion avant{" "}
                      {Math.max(0, Math.ceil((data.expiresAt - (now - offset)) / 1000))} s. Sinon,
                      aucun Elo ne change.
                    </p>
                  </div>
                ) : (
                  <>
                    <label htmlFor="invite-link">Ton lien privé</label>
                    <input
                      id="invite-link"
                      aria-label="Ton lien privé"
                      readOnly
                      value={window.location.href}
                      onFocus={(e) => e.currentTarget.select()}
                    />
                    <button className="copy-link" onClick={() => void copy()}>
                      {copied ? <Check size={16} /> : <Copy size={16} />}{" "}
                      {copied ? "Lien copié" : "Copier le lien"}
                    </button>
                  </>
                )}
                <ul className="ready-list">
                  <li>
                    {data.blue.name}
                    <strong>{data.ready[0] ? "Prêt" : "Pas encore prêt"}</strong>
                  </li>
                  <li>
                    {data.red?.name ?? "Un ami"}
                    <strong>
                      {data.ready[1] ? "Prêt" : data.red ? "Pas encore prêt" : "À inviter"}
                    </strong>
                  </li>
                </ul>
                <button
                  className="primary-button"
                  disabled={
                    data.ready[data.player - 1] ||
                    action.isPending ||
                    now - offset >= data.expiresAt
                  }
                  onClick={() => send({ type: "ready" })}
                >
                  {data.ready[data.player - 1]
                    ? "Tu es prêt"
                    : now - offset >= data.expiresAt
                      ? "Invitation expirée"
                      : "Je suis prêt"}
                </button>
              </>
            )}
            <output className="online-error" aria-live="polite">
              {action.error?.message ?? join.error?.message}
            </output>
            {ended && data.rating && (
              <div className="rating-change">
                <span>TON ELO</span>
                <strong>
                  {data.player === 1
                    ? data.rating.blueBefore + data.rating.delta
                    : data.rating.redBefore - data.rating.delta}
                  <small>
                    {(data.player === 1 ? data.rating.delta : -data.rating.delta) > 0 ? "+" : ""}
                    {data.player === 1 ? data.rating.delta : -data.rating.delta}
                  </small>
                </strong>
                <p>Résultat classé enregistré une seule fois.</p>
                <Link href="/statistiques">Voir ma progression</Link>
              </div>
            )}
            {data.cancelled && (
              <Link className="copy-link" href="/en-ligne">
                Rechercher un autre adversaire
              </Link>
            )}
            {opponentDisconnected && (
              <div className="ready-deadline" role="status">
                <strong>Adversaire déconnecté</strong>
                <p>Il lui reste {graceRemaining} s pour revenir. Sinon, il perdra la partie.</p>
              </div>
            )}
            {data.startedAt && !ended && (
              <>
                <p>
                  Une déconnexion déclenche une minute de grâce après 10 secondes sans signal de présence.
                </p>
                {confirm ? (
                  <div className="resign-confirm">
                    <p>Abandonner donne la victoire à ton adversaire, quel que soit le score.</p>
                    <button
                      className="primary-button"
                      disabled={action.isPending}
                      onClick={() => {
                        send({ type: "resign" });
                        setConfirm(false);
                      }}
                    >
                      Confirmer l’abandon
                    </button>
                    <button onClick={() => setConfirm(false)}>Continuer à jouer</button>
                  </div>
                ) : (
                  <button className="copy-link" onClick={() => setConfirm(true)}>
                    <Flag size={16} /> Abandonner
                  </button>
                )}
              </>
            )}
            {ended && data.game.moves.length > 0 && (
              <button className="copy-link" onClick={() => setReview(0)}>
                <History size={16} /> Revoir la partie
              </button>
            )}
            <div className="game-facts">
              <div>
                <span>Plateau</span>
                <strong>
                  {view.w} × {view.h}
                </strong>
              </div>
              <div>
                <span>Durée totale</span>
                <strong>{data.minutes} min au total</strong>
              </div>
              <div>
                <span>Coups joués</span>
                <strong>{data.game.moves.length}</strong>
              </div>
            </div>
          </section>
          <p className="device-note">Plateau et résultat sauvegardés côté serveur.</p>
        </aside>
      </div>
    </OnlineShell>
  );
}
