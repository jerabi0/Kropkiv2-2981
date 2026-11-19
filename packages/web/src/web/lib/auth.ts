import { createAuthClient } from "better-auth/react";
import { managedAuthClient } from "@runablehq/managed-auth/client";
import { readStorage, writeStorage, removeStorage } from "./browser-storage";
export const authClient = createAuthClient({
  baseURL: window.location.origin,
  basePath: "/api/auth",
  fetchOptions: {
    onSuccess: (context) => {
      const token = context.response.headers.get("set-auth-token");
      if (token) writeStorage(() => localStorage, "runable.managed-auth.token", token);
    },
  },
  plugins: [
    managedAuthClient({
      applicationId: import.meta.env.VITE_APPLICATION_ID,
      issuer: import.meta.env.VITE_RUNABLE_AUTH_ISSUER,
    }),
  ],
});
export const GOOGLE_RETURN_KEY = "kropki.auth.return";
export const authReady = authClient.managedAuth
  .handleRedirect()
  .then((result) => {
    if (!result) return;
    const target = readStorage(() => sessionStorage, GOOGLE_RETURN_KEY) ?? "/en-ligne";
    removeStorage(() => sessionStorage, GOOGLE_RETURN_KEY);
    const safe = target.startsWith("/") && !target.startsWith("//") ? target : "/en-ligne";
    if (result.data) window.history.replaceState(null, "", safe);
    if (result.error)
      window.history.replaceState(
        null,
        "",
        "/connexion?authErreur=google&retour=" + encodeURIComponent(safe),
      );
  })
  .catch(() => {
    window.history.replaceState(null, "", "/connexion?authErreur=google");
  });
