import { z } from "zod";

import type { AuthMessages } from "@/i18n/auth-messages";

export const minimumPasswordLength = 8;

export function getAuthSchemas(messages: AuthMessages) {
  const email = z
    .string()
    .trim()
    .min(1, messages.validation.emailRequired)
    .email(messages.validation.emailInvalid);
  const password = z
    .string()
    .min(1, messages.validation.passwordRequired)
    .min(minimumPasswordLength, messages.validation.passwordMinimum);

  return {
    signIn: z.object({ email, password }),
    signUp: z
      .object({ email, password, confirmPassword: password })
      .refine((values) => values.password === values.confirmPassword, {
        path: ["confirmPassword"],
        message: messages.validation.passwordMismatch,
      }),
    recovery: z.object({ email }),
    updatePassword: z
      .object({ password, confirmPassword: password })
      .refine((values) => values.password === values.confirmPassword, {
        path: ["confirmPassword"],
        message: messages.validation.passwordMismatch,
      }),
  };
}

export function getValidationErrors(error: z.ZodError) {
  return Object.fromEntries(
    error.issues
      .filter((issue) => issue.path[0])
      .map((issue) => [String(issue.path[0]), issue.message]),
  );
}
