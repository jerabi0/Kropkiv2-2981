import { describe, expect, test } from "bun:test";
import { getEmailVerificationState } from "./email-verification-state";

describe("retour de vérification d'adresse", () => {
  test("reconnaît une confirmation réussie", () => {
    expect(getEmailVerificationState("?verified=1")).toEqual({
      isVerificationResult: true,
      error: null,
    });
  });

  test("reconnaît l'erreur ajoutée par Better Auth après le paramètre existant", () => {
    expect(getEmailVerificationState("?verified=1&error=TOKEN_EXPIRED")).toEqual({
      isVerificationResult: true,
      error: "TOKEN_EXPIRED",
    });
  });

  test("tolère aussi une erreur concaténée dans la valeur verified", () => {
    expect(getEmailVerificationState("?verified=1?error=invalid_token")).toEqual({
      isVerificationResult: true,
      error: "invalid_token",
    });
  });

  test("ne traite pas une erreur de réinitialisation comme une vérification", () => {
    expect(getEmailVerificationState("?error=INVALID_TOKEN")).toEqual({
      isVerificationResult: false,
      error: "INVALID_TOKEN",
    });
  });
});
