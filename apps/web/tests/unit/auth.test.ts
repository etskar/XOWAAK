import { describe, expect, it } from "vitest";

import { getAuthErrorMessage } from "@/auth/errors";
import { getSafeInternalPath } from "@/auth/redirects";
import { isProtectedPath } from "@/auth/routes";
import { getAuthSchemas } from "@/auth/validation";
import { getAuthMessages } from "@/i18n/auth-messages";

describe("authentication foundation", () => {
  it("validates sign-up credentials and password confirmation", () => {
    const messages = getAuthMessages("en");
    const schema = getAuthSchemas(messages).signUp;

    expect(
      schema.safeParse({
        email: "person@example.com",
        password: "correct-horse-battery",
        confirmPassword: "correct-horse-battery",
      }).success,
    ).toBe(true);

    expect(
      schema.safeParse({
        email: "not-an-email",
        password: "short",
        confirmPassword: "different",
      }).success,
    ).toBe(false);
  });

  it("rejects external and cross-locale redirect destinations", () => {
    expect(getSafeInternalPath("https://malicious.example", "en")).toBe("/en/home");
    expect(getSafeInternalPath("//malicious.example", "en")).toBe("/en/home");
    expect(getSafeInternalPath("/ar/home", "en")).toBe("/en/home");
    expect(getSafeInternalPath("/en/auth/sign-in?next=/en/home", "en")).toBe(
      "/en/auth/sign-in?next=/en/home",
    );
  });

  it("classifies protected routes without treating a session as a role", () => {
    expect(isProtectedPath("/en/home", "en")).toBe(true);
    expect(isProtectedPath("/ar/admin/settings", "ar")).toBe(true);
    expect(isProtectedPath("/en/settings/profile", "en")).toBe(true);
    expect(isProtectedPath("/en/auth/sign-in", "en")).toBe(false);
    expect(getAuthErrorMessage(new Error("invalid login credentials"), "ar", "signIn")).toContain(
      "غير صحيحة",
    );
  });
});
