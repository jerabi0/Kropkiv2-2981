const RESEND_ENDPOINT = "https://api.resend.com/emails";
type AuthEmail = { to: string; subject: string; text: string; html: string };

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}

export function emailEnabled() {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim());
}

async function sendEmail(message: AuthEmail) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) throw new Error("L’envoi d’e-mails n’est pas configuré.");

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, ...message }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Échec de l’envoi Resend (HTTP ${response.status}).`);
}

function authEmailHtml(title: string, message: string, url: string, action: string) {
  const safeUrl = escapeHtml(url);
  return `<!doctype html><html lang="fr"><body style="margin:0;padding:32px 16px;background:#f4f1ea;color:#1c1a17;font-family:Arial,sans-serif">
<main style="max-width:520px;margin:0 auto;padding:28px;background:#fff;border-radius:16px">
<h1 style="font-size:22px">${title}</h1><p style="line-height:1.6">${message}</p>
<p style="margin:28px 0"><a href="${safeUrl}" style="display:inline-block;padding:13px 20px;background:#1c1a17;color:#fff;text-decoration:none;border-radius:999px">${action}</a></p>
<p style="font-size:13px;color:#666;line-height:1.5">Si tu n’es pas à l’origine de cette demande, tu peux ignorer cet e-mail.</p>
</main></body></html>`;
}

export async function sendPasswordResetEmail(to: string, url: string) {
  await sendEmail({
    to, subject: "Réinitialisation de ton mot de passe Kropki",
    text: `Tu as demandé à réinitialiser ton mot de passe Kropki. Ouvre ce lien pour choisir un nouveau mot de passe : ${url}\n\nSi tu n’es pas à l’origine de cette demande, ignore cet e-mail.`,
    html: authEmailHtml("Réinitialiser ton mot de passe", "Tu as demandé à réinitialiser ton mot de passe Kropki. Ce lien est valable pendant une heure.", url, "Choisir un nouveau mot de passe"),
  });
}

export async function sendVerificationEmail(to: string, url: string) {
  await sendEmail({
    to, subject: "Confirme ton adresse e-mail Kropki",
    text: `Bienvenue sur Kropki ! Confirme ton adresse e-mail en ouvrant ce lien : ${url}\n\nSi tu n’as pas créé de compte Kropki, ignore cet e-mail.`,
    html: authEmailHtml("Bienvenue sur Kropki", "Confirme ton adresse e-mail pour vérifier qu’elle t’appartient.", url, "Confirmer mon adresse e-mail"),
  });
}
