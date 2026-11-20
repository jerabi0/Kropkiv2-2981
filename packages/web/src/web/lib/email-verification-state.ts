export function getEmailVerificationState(search: string): {
  isVerificationResult: boolean;
  error: string | null;
} {
  const params = new URLSearchParams(search);
  const verified = params.get("verified") ?? "";
  const embeddedError = verified.match(/^1\\?error=([^&]*)/)?.[1];
  const isVerificationResult = verified === "1" || verified.startsWith("1?error=");
  const hasError = params.has("error") || embeddedError !== undefined;
  const error = params.has("error") ? params.get("error") : embeddedError ?? null;

  return {
    isVerificationResult,
    error: hasError ? error ?? "" : null,
  };
}
