import { useState } from "react";
import { Redirect } from "wouter";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { authClient, GOOGLE_RETURN_KEY } from "../lib/auth";
import { OnlineShell } from "../components/online-shell";
import { writeStorage, removeStorage } from "../lib/browser-storage";
export default function SignIn() {
  const searchParams = new URLSearchParams(window.location.search);
  const [signup, setSignup] = useState(false),
    [busy, setBusy] = useState(false),
    [forgot, setForgot] = useState(false),
    [resetToken, setResetToken] = useState(searchParams.get("token")),
    [verificationError] = useState(
      ["INVALID_TOKEN", "invalid_token", "TOKEN_EXPIRED", "token_expired"].includes(
        searchParams.get("error") ?? "",
      ) && searchParams.get("verified") === "1",
    ),
    [verificationResult] = useState(searchParams.get("verified") === "1"),
    [resetInvalid, setResetInvalid] = useState(
      searchParams.get("error") === "INVALID_TOKEN" && searchParams.get("verified") !== "1",
    ),
    [resetDone, setResetDone] = useState(false),
    [notice, setNotice] = useState(
      searchParams.get("verified") === "1"
        ? "Ton adresse e-mail a été confirmée. Tu peux maintenant te connecter."
        : "",
    ),
    [error, setError] = useState(
      searchParams.has("authErreur")
        ? "La connexion Google n’a pas abouti. Réessaie ou utilise ton e-mail."
        : searchParams.get("error") === "INVALID_TOKEN" && searchParams.get("verified") !== "1"
          ? "Ce lien est invalide ou a expiré."
          : "",
    );
  const { data } = authClient.useSession();
  const target = new URLSearchParams(window.location.search).get("retour") ?? "/en-ligne";
  const safe = target.startsWith("/") && !target.startsWith("//") ? target : "/en-ligne";
  if (data && !resetToken && !resetInvalid && !resetDone && !verificationResult)
    return <Redirect to={safe} />;
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget),
      email = String(f.get("email")),
      password = String(f.get("password"));
    try {
      const result = signup
        ? await authClient.signUp.email({
            email,
            password,
            name: String(f.get("name")).trim(),
            callbackURL: `${window.location.origin}/connexion?verified=1`,
          })
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
  async function requestReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email")).trim();
    try {
      const result = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/connexion`,
      });
      if (result.error) {
        setError("La récupération par e-mail n'est pas disponible pour le moment. Réessaie plus tard.");
      } else {
        setNotice("Si un compte correspond à cette adresse, un lien de réinitialisation vient d’être envoyé. Il est valable une heure.");
      }
    } catch {
      setError("Impossible d’envoyer le lien pour le moment. Réessaie plus tard.");
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!resetToken) return;
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const password = String(form.get("new-password"));
    const confirmation = String(form.get("confirm-password"));
    if (password !== confirmation) {
      setError("Les deux mots de passe ne correspondent pas.");
      setBusy(false);
      return;
    }
    try {
      const result = await authClient.resetPassword({ newPassword: password, token: resetToken });
      if (result.error) {
        window.history.replaceState(null, "", "/connexion?error=INVALID_TOKEN");
        setResetInvalid(true);
        setResetToken(null);
        setError("Ce lien de réinitialisation est invalide ou a expiré. Demande un nouveau lien.");
      } else {
        window.history.replaceState(null, "", "/connexion");
        setResetToken(null);
        setResetDone(true);
        setNotice("");
      }
    } catch {
      window.history.replaceState(null, "", "/connexion?error=INVALID_TOKEN");
      setResetInvalid(true);
      setResetToken(null);
      setError("Ce lien de réinitialisation est invalide ou a expiré. Demande un nouveau lien.");
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
          {verificationResult ? (
            <div className="auth-reset">
              <h2>{verificationError ? "Adresse non confirmée." : "Adresse confirmée."}</h2>
              <p>
                {verificationError
                  ? "Ce lien est invalide ou a expiré. Demande un nouvel e-mail de confirmation."
                  : data
                    ? "Ton adresse e-mail est confirmée. Tu peux accéder à tes parties."
                    : "Ton adresse e-mail est confirmée. Tu peux maintenant te connecter."}
              </p>
              {data && !verificationError ? (
                <a className="primary-button" href="/en-ligne">
                  Accéder à Kropki <ArrowRight size={17} />
                </a>
              ) : (
                <a className="primary-button" href="/connexion">
                  Aller à la connexion <ArrowRight size={17} />
                </a>
              )}
            </div>
          ) : resetToken || resetInvalid || resetDone ? (
            <div className="auth-reset">
              <h2>{resetDone ? "Mot de passe modifié." : "Nouveau mot de passe"}</h2>
              {resetDone ? (
                <p>Tu peux maintenant te connecter avec ton nouveau mot de passe.</p>
              ) : resetInvalid ? (
                <output className="online-error" aria-live="polite">
                  Ce lien est invalide ou a expiré.
                </output>
              ) : (
                <form onSubmit={resetPassword}>
                  <label htmlFor="new-password">Nouveau mot de passe</label>
                  <input
                    id="new-password"
                    name="new-password"
                    type="password"
                    required
                    minLength={8}
                    maxLength={128}
                    autoComplete="new-password"
                  />
                  <label htmlFor="confirm-password">Confirmer le mot de passe</label>
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    required
                    minLength={8}
                    maxLength={128}
                    autoComplete="new-password"
                  />
                  <output className="online-error" aria-live="polite">{error}</output>
                  <button className="primary-button" disabled={busy}>
                    {busy ? "Enregistrement…" : "Enregistrer le nouveau mot de passe"}
                    <ArrowRight size={17} />
                  </button>
                </form>
              )}
              <output className="online-notice" aria-live="polite">{notice}</output>
              <a href="/connexion">Retour à la connexion</a>
            </div>
          ) : forgot ? (
            <div className="auth-reset">
              <h2>Mot de passe oublié ?</h2>
              <p>Indique l’adresse e-mail associée à ton compte. Nous t’enverrons un lien valable une heure.</p>
              <form onSubmit={requestReset}>
                <label htmlFor="reset-email">E-mail</label>
                <input id="reset-email" name="email" type="email" required autoComplete="email" />
                <output className="online-error" aria-live="polite">{error}</output>
                <output className="online-notice" aria-live="polite">{notice}</output>
                <button className="primary-button" disabled={busy}>
                  {busy ? "Envoi…" : "Envoyer le lien"}
                  <ArrowRight size={17} />
                </button>
              </form>
              <button type="button" className="text-button" onClick={() => { setForgot(false); setError(""); setNotice(""); }}>
                Retour à la connexion
              </button>
            </div>
          ) : (
          <>
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
            {!signup && (
              <button type="button" className="text-button" onClick={() => { setForgot(true); setError(""); setNotice(""); }}>
                Mot de passe oublié ?
              </button>
            )}
            {signup && (
              <small>Au moins 8 caractères. Ne réutilise pas un mot de passe important.</small>
            )}
            <output className="online-error" aria-live="polite">
              {error}
            </output>
            <output className="online-notice" aria-live="polite">{notice}</output>
            <button className="primary-button" disabled={busy}>
              {busy ? "Connexion…" : signup ? "Créer mon compte" : "Me connecter"}
              <ArrowRight size={17} />
            </button>
          </form>
          <p className="auth-note">
            Les parties privées nécessitent un compte. Le jeu local reste libre.
          </p>
          </>
          )}
        </section>
      </div>
    </OnlineShell>
  );
}
