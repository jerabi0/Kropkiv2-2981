import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Trophy, Target, Swords, ArrowUpRight, ArrowRight } from "lucide-react";
import { OnlineShell, RequireAccount } from "../components/online-shell";
import { rankedStats } from "../queries/ranked";
export default function Statistics() {
  return (
    <RequireAccount>
      <Stats />
    </RequireAccount>
  );
}
function Stats() {
  const query = useQuery(rankedStats()),
    data = query.data;
  return (
    <OnlineShell>
      <div className="page-heading">
        <div>
          <span className="eyebrow">CHAQUE DUEL TE FAIT GRANDIR</span>
          <h1>
            Ta progression<span>.</span>
          </h1>
          <p>Tes vrais résultats. Ton prochain objectif.</p>
        </div>
        <Link className="rules-shortcut" href="/en-ligne">
          <Swords size={17} />
          <span>Jouer en ligne</span>
        </Link>
      </div>
      {!data ? (
        <section className="online-card">
          <p>
            {query.isError
              ? "Impossible de charger tes statistiques."
              : "Chargement de tes résultats…"}
          </p>
          {query.isError && (
            <button className="copy-link" onClick={() => void query.refetch()}>
              Réessayer
            </button>
          )}
        </section>
      ) : (
        <>
          <div className="stats-grid">
            <article className="stat-tile elo-tile">
              <span>
                <Trophy size={19} /> TON ELO
              </span>
              <strong data-testid="elo-value">{data.elo}</strong>
              <p>
                {data.provisional
                  ? `Provisoire · ${data.ranked.total}/10 parties`
                  : "Classement établi"}
              </p>
            </article>
            <article className="stat-tile">
              <span>
                <Swords size={19} /> DUELS CLASSÉS
              </span>
              <strong>{data.ranked.total}</strong>
              <p>
                {data.ranked.wins} victoires · {data.ranked.draws} nuls · {data.ranked.losses}{" "}
                défaites
              </p>
            </article>
            <article className="stat-tile coral-tile">
              <span>
                <Target size={19} /> TAUX DE VICTOIRE
              </span>
              <strong>
                {data.ranked.total
                  ? Math.round((100 * data.ranked.wins) / data.ranked.total) + "%"
                  : "—"}
              </strong>
              <p>
                {data.ranked.total
                  ? "Sur tes parties classées terminées"
                  : "Joue ton premier duel classé"}
              </p>
            </article>
          </div>
          <div className="stats-layout">
            <section className="online-card results-card">
              <div className="online-card-title">
                <ArrowUpRight size={22} />
                <h2>Les derniers duels</h2>
              </div>
              <p>Les 20 derniers résultats classés. Les invitations restent non classées.</p>
              {!data.history.length ? (
                <div className="online-empty">
                  <Trophy size={35} />
                  <h3>Tout commence à 1 200.</h3>
                  <p>Ton premier adversaire t’attend dans le salon.</p>
                  <Link className="copy-link" href="/en-ligne">
                    Trouver un adversaire <ArrowRight size={17} />
                  </Link>
                </div>
              ) : (
                <div className="ranked-results">
                  {data.history.map((g) => (
                    <Link key={g.id} href={"/partie/" + g.id}>
                      <div>
                        <strong>{g.opponent}</strong>
                        <small>
                          {new Date(g.finishedAt).toLocaleDateString("fr-FR")} · {g.minutes} min
                        </small>
                      </div>
                      <span
                        className={
                          "outcome outcome-" +
                          (g.outcome === "Victoire"
                            ? "win"
                            : g.outcome === "Défaite"
                              ? "loss"
                              : "draw")
                        }
                      >
                        {g.outcome}
                      </span>
                      <div className="result-elo">
                        <strong>
                          {g.delta > 0 ? "+" : ""}
                          {g.delta}
                        </strong>
                        <small>
                          {g.before} → {g.before + g.delta}
                        </small>
                      </div>
                      <ArrowRight size={17} />
                    </Link>
                  ))}
                </div>
              )}
            </section>
            <aside className="online-card private-stats">
              <span className="eyebrow">POUR LE PLAISIR</span>
              <h2>Duels entre amis</h2>
              <strong>{data.private.total}</strong>
              <p>
                {data.private.wins} victoires · {data.private.draws} nuls · {data.private.losses}{" "}
                défaites
              </p>
              <p>
                Les parties privées ne changent pas ton Elo. Le jeu local reste enregistré
                uniquement sur ton appareil.
              </p>
              <Link className="copy-link" href="/en-ligne">
                Inviter un ami <ArrowRight size={17} />
              </Link>
            </aside>
          </div>
          <div className="elo-explainer">
            <Trophy size={24} />
            <div>
              <h3>Un classement qui suit tes duels.</h3>
              <p>
                Départ à 1 200 · coefficient 32 · gain calculé selon le niveau adverse. Un abandon
                après le départ compte comme une défaite ; à zéro, les captures décident. Sans
                capture de plus : nul.
              </p>
            </div>
          </div>
        </>
      )}
    </OnlineShell>
  );
}
