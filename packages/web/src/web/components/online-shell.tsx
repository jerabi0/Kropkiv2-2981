import { Link, Redirect, useLocation } from "wouter";
import { Globe, Grid2X2, LogOut, UserRound, Trophy, GraduationCap } from "lucide-react";
import { authClient } from "../lib/auth";
import { useQueryClient } from "@tanstack/react-query";
export function AccountMenu() {
  const { data } = authClient.useSession();
  const qc = useQueryClient();
  return (
    <div className="account-menu">
      <Link href="/en-ligne">
        <Globe size={15} /> En ligne
      </Link>
      {data ? (
        <>
          <span>
            <UserRound size={15} />
            {data.user.name.slice(0, 24)}
          </span>
          <button
            aria-label="Se déconnecter"
            onClick={() => void authClient.signOut().then(() => qc.clear())}
          >
            <LogOut size={16} />
          </button>
        </>
      ) : (
        <Link href={"/connexion?retour=" + encodeURIComponent(window.location.pathname)}>
          <UserRound size={15} /> Connexion
        </Link>
      )}
    </div>
  );
}
export function OnlineShell({ children }: { children: React.ReactNode }) {
  const [path] = useLocation();
  return (
    <div className="arena">
      <aside className="navigation-rail">
        <Link href="/" className="brand">
          kropki<span className="brand-period">.</span>
        </Link>
        <span className="rail-caption">CHAQUE POINT COMPTE.</span>
        <nav className="rail-nav">
          <Link href="/" className="rail-link">
            <Grid2X2 size={22} />
            <span>Jouer en local</span>
          </Link>
          <Link
            href="/en-ligne"
            aria-label="Jouer en ligne"
            className={
              "rail-link " + (path === "/en-ligne" || path.startsWith("/partie/") ? "selected" : "")
            }
          >
            <Globe size={22} />
            <span>En ligne</span>
          </Link>
          <Link
            href="/statistiques"
            aria-label="Mes statistiques"
            className={"rail-link " + (path === "/statistiques" ? "selected" : "")}
          >
            <Trophy size={22} />
            <span>Ma progression</span>
          </Link>
          <Link
            href="/entrainement"
            className={"rail-link " + (path === "/entrainement" ? "selected" : "")}
          >
            <GraduationCap size={22} />
            <span>Entraînement</span>
          </Link>
        </nav>
        <div className="rail-bottom">
          <p>
            Un lien. Deux joueurs.
            <br />
            Un territoire à conquérir.
          </p>
        </div>
      </aside>
      <div className="arena-workspace">
        <header className="arena-header">
          <div className="breadcrumb">
            <Link href="/">Kropki</Link>
            <span>/</span>
            <strong>
              {path === "/entrainement"
                ? "Entraînement"
                : path === "/statistiques"
                  ? "Ma progression"
                  : path === "/connexion"
                    ? "Mon compte"
                    : "En ligne"}
            </strong>
          </div>
          <AccountMenu />
        </header>
        <main className="arena-main online-main">{children}</main>
      </div>
    </div>
  );
}
export function RequireAccount({ children }: { children: React.ReactNode }) {
  const { data, isPending } = authClient.useSession();
  if (isPending)
    return (
      <OnlineShell>
        <p>Vérification de la connexion…</p>
      </OnlineShell>
    );
  if (!data)
    return <Redirect to={"/connexion?retour=" + encodeURIComponent(window.location.pathname)} />;
  return <>{children}</>;
}
