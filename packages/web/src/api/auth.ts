import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { runableManagedAuth } from "@runablehq/managed-auth/server";
import { db } from "./database";
import { emailEnabled, sendPasswordResetEmail, sendVerificationEmail } from "./email";
import { trustedOrigins } from "./trusted-origins";

const canSendEmail = emailEnabled();
const requireEmailVerification =
  canSendEmail && process.env.REQUIRE_EMAIL_VERIFICATION?.trim().toLowerCase() === "true";

function reportEmailFailure(error: unknown) {
  // Les erreurs sont expurgées : aucune URL ni aucun jeton n'est journalisé.
  const message = error instanceof Error ? error.message : "Erreur d’envoi inconnue.";
  console.error("[auth-email]", message);
}

export const auth = betterAuth({
  basePath: "/api/auth",
  baseURL: process.env.WEBSITE_URL,
  database: drizzleAdapter(db, { provider: "sqlite" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    resetPasswordTokenExpiresIn: 60 * 60,
    requireEmailVerification,
    ...(canSendEmail
      ? {
          sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) => {
            void sendPasswordResetEmail(user.email, url).catch(reportEmailFailure);
          },
        }
      : {}),
  },
  ...(canSendEmail
    ? {
        emailVerification: {
          sendOnSignUp: true,
          expiresIn: 60 * 60,
          sendVerificationEmail: async ({ user, url }: { user: { email: string }; url: string }) => {
            void sendVerificationEmail(user.email, url).catch(reportEmailFailure);
          },
        },
      }
    : {}),
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins,
  plugins: [
    ...runableManagedAuth({
      applicationId: process.env.APPLICATION_ID!,
      issuer: process.env.VITE_RUNABLE_AUTH_ISSUER!,
    }),
  ],
});
