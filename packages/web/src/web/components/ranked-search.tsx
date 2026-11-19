import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { ArrowRight, Swords, X, Trophy, LoaderCircle } from "lucide-react";
import { CADENCES } from "../lib/timed-game";
import { rankedStatus, rankedStats, startSearch, cancelSearch } from "../queries/ranked";
export function RankedSearch() {
  const [, navigate] = useLocation(),
    qc = useQueryClient();
  const status = useQuery(rankedStatus()),
    stats = useQuery(rankedStats());
  const start = useMutation(startSearch()),
    cancel = useMutation(cancelSearch());
  const [size, setSize] = useState<13 | 17 | 21>(17),
    [minutes, setMinutes] = useState<(typeof CADENCES)[number]>(3),
    [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    // A cached match may already be finished when returning from statistics.
    if (!status.isFetchedAfterMount || status.isFetching || status.isError) return;
    if (status.data?.status === "matched") navigate("/partie/" + status.data.roomId);
    if (status.data?.status === "waiting") {
      setSize(status.data.size as 13 | 17 | 21);
      setMinutes(status.data.minutes as (typeof CADENCES)[number]);
    }
  }, [status.data, status.isFetchedAfterMount, status.isFetching, status.isError, navigate]);
  const waiting = status.data?.status === "waiting";
  const busy = start.isPending || cancel.isPending;
  const refresh = () => qc.invalidateQueries({ queryKey: rankedStatus().queryKey });
  return (
    <section className="online-card ranked-search">
      <div className="online-card-title">
        <Swords size={25} />
        <h2>Un adversaire. Un vrai défi.</h2>
        <span className="ranked-tag">CLASSÉ</span>
      </div>
      <p>Rencontre un joueur de ton niveau. Chaque duel fait évoluer ton Elo.</p>
      <div className="ranked-summary">
        <span>
          <Trophy size={18} /> {stats.data?.elo ?? "—"}{" "}
          <small>Elo {stats.data?.provisional ? "provisoire" : ""}</small>
        </span>
        <Link href="/statistiques">
          Mes statistiques <ArrowRight size={14} />
        </Link>
      </div>
      <div className="search-fields">
        <div>
          <label htmlFor="ranked-size">Plateau</label>
          <select
            id="ranked-size"
            aria-label="Plateau classé"
            value={size}
            disabled={waiting || busy}
            onChange={(e) => setSize(Number(e.target.value) as 13 | 17 | 21)}
          >
            <option value={13}>Petit · 13 × 11</option>
            <option value={17}>Classique · 17 × 13</option>
            <option value={21}>Grand · 21 × 17</option>
          </select>
        </div>
        <div>
          <label htmlFor="ranked-duration">Temps total</label>
          <select
            id="ranked-duration"
            aria-label="Durée classée"
            value={minutes}
            disabled={waiting || busy}
            onChange={(e) => setMinutes(Number(e.target.value) as (typeof CADENCES)[number])}
          >
            {CADENCES.map((n) => (
              <option key={n} value={n}>
                {n} min au total
              </option>
            ))}
          </select>
        </div>
      </div>
      {waiting ? (
        <div className="search-waiting" aria-live="polite">
          <LoaderCircle className="search-spinner" size={22} />
          <div>
            <strong>Recherche d’un adversaire…</strong>
            <p>
              {Math.max(0, Math.floor((now - (status.data?.joinedAt ?? now)) / 1000))} s ·{" "}
              {"minutes" in status.data! ? status.data.minutes : minutes} min · le niveau recherché
              s’élargit avec l’attente.
            </p>
          </div>
        </div>
      ) : (
        <div className="online-info">
          <Swords size={18} />
          <span>
            Deux vrais comptes, même plateau et même durée. Pas de robot, pas de temps estimé
            inventé.
          </span>
        </div>
      )}
      <output className="online-error" aria-live="polite">
        {start.error?.message ??
          cancel.error?.message ??
          (status.isError
            ? "Recherche indisponible. Réessaie."
            : status.fetchStatus === "paused"
              ? "Connexion interrompue. La recherche expire après 60 s sans contact."
              : "")}
      </output>
      {waiting ? (
        <button
          className="copy-link"
          disabled={busy}
          onClick={() =>
            cancel.mutate(undefined, {
              onSuccess: (r) => {
                if (r.roomId) navigate("/partie/" + r.roomId);
                else void refresh();
              },
            })
          }
        >
          <X size={17} />
          Annuler la recherche
        </button>
      ) : (
        <button
          className="primary-button"
          disabled={busy || status.isPending || status.fetchStatus === "paused"}
          onClick={() =>
            start.mutate(
              { size, minutes },
              {
                onSuccess: (r) => {
                  if (r.roomId) navigate("/partie/" + r.roomId);
                  else void refresh();
                },
              },
            )
          }
        >
          {start.isPending ? "Recherche…" : "Trouver un adversaire"}
          <ArrowRight size={18} />
        </button>
      )}
    </section>
  );
}
