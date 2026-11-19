import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { ArrowRight, Link2, Globe, History } from "lucide-react";
import { CADENCES } from "../lib/timed-game";
import { OnlineShell, RequireAccount } from "../components/online-shell";
import { gameList, createPrivate } from "../queries/private-games";
import { RankedSearch } from "../components/ranked-search";
export default function Online() {
  return (
    <RequireAccount>
      <Lobby />
    </RequireAccount>
  );
}
function Lobby() {
  const [, navigate] = useLocation(),
    [size, setSize] = useState<13 | 17 | 21>(17),
    [minutes, setMinutes] = useState<(typeof CADENCES)[number]>(3);
  const list = useQuery(gameList()),
    create = useMutation(createPrivate());
  return (
    <OnlineShell>
      <div className="page-heading">
        <div>
          <span className="eyebrow">TON PROCHAIN DUEL COMMENCE ICI</span>
          <h1>
            À toi de conquérir<span>.</span>
          </h1>
          <p>Un défi classé ou un duel entre amis. Choisis ton terrain de jeu.</p>
        </div>
      </div>
      <RankedSearch />
      <div className="online-lobby">
        <section className="online-card">
          <div className="online-card-title">
            <Globe size={23} />
            <h2>Créer une partie privée</h2>
          </div>
          <p>Tu joues les bleus. Le lien réserve une place pour ton adversaire.</p>
          <label htmlFor="online-size">Taille du plateau</label>
          <select
            id="online-size"
            value={size}
            onChange={(e) => setSize(Number(e.target.value) as 13 | 17 | 21)}
          >
            <option value={13}>Petit · 13 × 11</option>
            <option value={17}>Classique · 17 × 13</option>
            <option value={21}>Grand · 21 × 17</option>
          </select>
          <label htmlFor="online-duration">Durée totale de la partie</label>
          <select
            id="online-duration"
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value) as (typeof CADENCES)[number])}
          >
            {CADENCES.map((n) => (
              <option key={n} value={n}>
                {n} minute{n > 1 ? "s" : ""} au total
              </option>
            ))}
          </select>
          <div className="online-info">
            <Link2 size={18} />
            <span>
              Le temps démarre quand vous êtes tous les deux prêts. Invitation valable 24 h.
            </span>
          </div>
          <output className="online-error">{create.error?.message}</output>
          <button
            className="primary-button"
            disabled={create.isPending}
            onClick={() =>
              create.mutate({ size, minutes }, { onSuccess: (r) => navigate("/partie/" + r.id) })
            }
          >
            {create.isPending ? "Création…" : "Créer mon lien"}
            <ArrowRight size={18} />
          </button>
        </section>
        <section className="online-card">
          <div className="online-card-title">
            <History size={23} />
            <h2>Mes parties en ligne</h2>
          </div>
          {list.isPending ? (
            <p>Chargement…</p>
          ) : list.isError ? (
            <p className="online-error">
              Impossible de charger tes parties.{" "}
              <button onClick={() => void list.refetch()}>Réessayer</button>
            </p>
          ) : !list.data?.length ? (
            <div className="online-empty">
              <Link2 size={32} />
              <h3>Ton premier duel t’attend.</h3>
              <p>Crée un lien ou ouvre celui d’un ami.</p>
            </div>
          ) : (
            <div className="my-games">
              {list.data.map((g) => (
                <Link key={g.id} href={"/partie/" + g.id}>
                  <div>
                    <strong>
                      {g.blue} <span>contre</span> {g.red ?? "un ami"}
                    </strong>
                    <small>
                      {g.ranked ? "Classée" : "Privée"} · {g.minutes} min au total ·{" "}
                      {g.expired ? "Invitation expirée" : g.status}
                    </small>
                  </div>
                  <ArrowRight size={17} />
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </OnlineShell>
  );
}
