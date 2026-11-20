import { afterEach, describe, expect, test } from "bun:test";
import { emailEnabled, sendPasswordResetEmail, sendVerificationEmail } from "../email";

const originalFetch = globalThis.fetch;
const originalKey = process.env.RESEND_API_KEY;
const originalFrom = process.env.EMAIL_FROM;

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = originalKey;
  if (originalFrom === undefined) delete process.env.EMAIL_FROM;
  else process.env.EMAIL_FROM = originalFrom;
});

describe("e-mails d’authentification", () => {
  test("reste désactivé sans les deux paramètres Resend", () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
    expect(emailEnabled()).toBe(false);
  });

  test("active l’envoi lorsque la clé et l’expéditeur sont présents", () => {
    process.env.RESEND_API_KEY = "test_key";
    process.env.EMAIL_FROM = "Kropki <test@example.com>";
    expect(emailEnabled()).toBe(true);
  });

  test("envoie un e-mail de réinitialisation en français via l’API Resend", async () => {
    process.env.RESEND_API_KEY = "test_key";
    process.env.EMAIL_FROM = "Kropki <test@example.com>";
    let request: Request | undefined;
    globalThis.fetch = (async (input, init) => {
      request = new Request(input, init);
      return new Response(null, { status: 200 });
    }) as unknown as typeof fetch;

    await sendPasswordResetEmail("joueur@example.com", "https://kropki.test/connexion?token=secret");

    expect(request?.url).toBe("https://api.resend.com/emails");
    expect(request?.headers.get("Authorization")).toBe("Bearer test_key");
    const body = await request!.json();
    expect(body.to).toBe("joueur@example.com");
    expect(body.subject).toContain("Réinitialisation");
    expect(body.text).toContain("mot de passe");
    expect(body.html).toContain("lang=\"fr\"");
  });

  test("envoie le modèle français de vérification", async () => {
    process.env.RESEND_API_KEY = "test_key";
    process.env.EMAIL_FROM = "Kropki <test@example.com>";
    let payload = "";
    globalThis.fetch = (async (_input, init) => {
      payload = String(init?.body ?? "");
      return new Response(null, { status: 200 });
    }) as unknown as typeof fetch;

    await sendVerificationEmail("joueur@example.com", "https://kropki.test/verify?token=secret");
    expect(payload).toContain("Confirme ton adresse e-mail Kropki");
    expect(payload).toContain("Bienvenue sur Kropki");
  });

  test("ne renvoie pas le lien ou le jeton dans l’erreur du fournisseur", async () => {
    process.env.RESEND_API_KEY = "test_key";
    process.env.EMAIL_FROM = "Kropki <test@example.com>";
    globalThis.fetch = (async () => new Response("secret token body", { status: 500 })) as unknown as typeof fetch;

    await expect(
      sendPasswordResetEmail("joueur@example.com", "https://kropki.test/?token=secret"),
    ).rejects.toThrow("HTTP 500");
  });
});
