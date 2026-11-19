import { useState } from "react";
import { Redirect } from "wouter";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { authClient, GOOGLE_RETURN_KEY } from "../lib/auth";
import { OnlineShell } from "../components/online-shell";
import { writeStorage, removeStorage } from "../lib/browser-storage";
export default function SignIn() {
  const [signup, setSignup] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(
      new URLSearchParams(window.location.search).has("authErreur")
        ? "La connexion Google n’a pas abouti. Réessaie ou utilise ton e-mail."
        : "",
    );
  const { data } = authClient.useSession();
  const target = new URLSearchParams(window.location.search).get("retour") ?? "/en-ligne";
  const safe = target.startsWith("/") && !target.startsWith("//") ? target : "/en-ligne";
  if (data) return <Redirect to={safe} />;
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget),
      email = String(f.get("email")),
      password = String(f.get("password"));
    try {
      const result = signup
        ? await authClient.signUp.email({ email, password, name: String(f.get("name")).trim() })
        : await authClient.signIn.email({ email, password });
      if (result.error)
        setError(
          signup
            ? "Inscription impossible. Vérifie tes informations ou connecte-toi si ce compte existe déjà."
            : "Connexion impossible. Vérifie ton e-mail et ton mot de passe.",
        );
    } catch {
      setError("Connexion au serveur interrompue. Réessaie.");
    } finally {
      setBusy(false);
    }
  }
  async function google() {
    setBusy(true);
    setError("");
    try {
      writeStorage(() => sessionStorage, GOOGLE_RETURN_KEY, safe);
      const r = await authClient.managedAuth.signIn({ provider: "google" });
      if (r.error) removeStorage(() => sessionStorage, GOOGLE_RETURN_KEY);
      if (r.error && r.error.code !== "POPUP_CLOSED")
        setError("Connexion Google indisponible. Réessaie ou utilise ton e-mail.");
    } catch {
      removeStorage(() => sessionStorage, GOOGLE_RETURN_KEY);
      setError("La connexion Google n’a pas abouti.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <OnlineShell>
      <div className="auth-layout">
        <div className="auth-intro">
          <span className="eyebrow">LE DUEL COMMENCE ICI</span>
          <h1>
            Ton prochain
            <br />
            territoire<span>.</span>
          </h1>
          <p>
            Retrouve tes parties. Invite un ami.
            <br />
            Jouez chacun depuis votre écran.
          </p>
          <div className="auth-promise">
            <ShieldCheck size={20} />
            <span>
              Le serveur arbitre les coups et le temps.
              <br />
              Ton e-mail reste privé.
            </span>
          </div>
          <a href="/">
            Continuer à jouer sans compte <ArrowRight size={16} />
          </a>
        </div>
        <section className="auth-card">
          <div className="panel-tabs">
            <button
              aria-pressed={!signup}
              className={!signup ? "active" : ""}
              onClick={() => {
                setSignup(false);
                setError("");
              }}
            >
              Connexion
            </button>
            <button
              aria-pressed={signup}
              className={signup ? "active" : ""}
              onClick={() => {
                setSignup(true);
                setError("");
              }}
            >
              Inscription
            </button>
          </div>
          <h2>{signup ? "Créer ton compte" : "Bon retour."}</h2>
          <button className="google-button" disabled={busy} onClick={() => void google()}>
            Continuer avec Google <ArrowRight size={16} />
          </button>
          <div className="auth-divider">ou avec ton e-mail</div>
          <form onSubmit={submit}>
            {signup && (
              <>
                <label htmlFor="public-name">Pseudonyme public</label>
                <input
                  id="public-name"
                  aria-label="Pseudonyme public"
                  name="name"
                  required
                  minLength={2}
                  maxLength={24}
                  autoComplete="name"
                />
              </>
            )}
            <label htmlFor="auth-email">E-mail</label>
            <input
              id="auth-email"
              aria-label="E-mail"
              name="email"
              type="email"
              required
              autoComplete="email"
            />
            <label htmlFor="auth-password">Mot de passe</label>
            <input
              id="auth-password"
              aria-label="Mot de passe"
              name="password"
              type="password"
              required
              minLength={8}
              maxLength={128}
              autoComplete={signup ? "new-password" : "current-password"}
            />
            {signup && (
              <small>Au moins 8 caractères. Ne réutilise pas un mot de passe important.</small>
            )}
            <output className="online-error" aria-live="polite">
              {error}
            </output>
            <button className="primary-button" disabled={busy}>
              {busy ? "Connexion…" : signup ? "Créer mon compte" : "Me connecter"}
              <ArrowRight size={17} />
            </button>
          </form>
          <p className="auth-note">
            Les parties privées nécessitent un compte. Le jeu local reste libre.
          </p>
        </section>
      </div>
    </OnlineShell>
  );
}
