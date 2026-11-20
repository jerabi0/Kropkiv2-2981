/** Origins allowed to use cookie-backed API/auth flows. Configure additional
 * trusted sites explicitly with TRUSTED_ORIGINS (comma-separated). */
function normalizeOrigin(value: string): string | null {
  try {
    return new URL(value.trim()).origin;
  } catch {
    return null;
  }
}

export const trustedOrigins = Array.from(
  new Set(
    [process.env.WEBSITE_URL, ...(process.env.TRUSTED_ORIGINS ?? "").split(",")]
      .filter((value): value is string => Boolean(value?.trim()))
      .map((value) => normalizeOrigin(value))
      .filter((value): value is string => value !== null),
  ),
);

export function isTrustedOrigin(origin: string) {
  return trustedOrigins.includes(origin);
}
