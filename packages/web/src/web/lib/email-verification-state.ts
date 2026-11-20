const VERIFICATION_ERRORS = new Set([
  "INVALID_TOKEN",
  "invalid_token",
  "TOKEN_EXPIRED",
  "token_expired",
  "USER_NOT_FOUND",
  "user_not_found",
]);

export function getEmailVerificationState(search: string): {
  isVerificationResult: boolean;
  error: string | null;
} {
  const params = new URLSearchParams(search);
  const verified = params.get("verified") ?? "";
  const embeddedError = verified.match(/^1\?error=([^&]+)/)?.[1];
  const error = params.get("error") ?? embeddedError ?? null;
  return {
    isVerificationResult: verified === "1" || verified.startsWith("1?error="),
    error: error && VERIFICATION_ERRORS.has(error) ? error : null,
  };
}
