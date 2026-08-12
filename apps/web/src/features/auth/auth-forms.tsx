"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useState, useTransition } from "react";
import type { FormEvent } from "react";

import { getAuthErrorMessage } from "@/auth/errors";
import { buildAuthCallbackPath, getSafeInternalPath } from "@/auth/redirects";
import { getAuthSchemas, getValidationErrors } from "@/auth/validation";
import { Button, Input, Stack } from "@/design-system";
import type { Locale } from "@/config/locales";
import type { AuthMessages } from "@/i18n/auth-messages";
import { confirmSignupEmail } from "@/server/auth/actions";
import { createSupabaseBrowserClient } from "@/supabase/browser";

type AuthFormProps = {
  locale: Locale;
  messages: AuthMessages;
  nextPath?: string;
  initialError?: string | null;
  initialSuccess?: string | null;
};

type FormStatus = {
  kind: "error" | "success";
  message: string;
} | null;

function AuthStatus({ status }: { status: FormStatus }) {
  if (!status) {
    return null;
  }

  return (
    <p
      className={`auth-status auth-status--${status.kind}`}
      role={status.kind === "error" ? "alert" : "status"}
    >
      {status.message}
    </p>
  );
}

function fieldValue(form: HTMLFormElement, name: string) {
  return String(new FormData(form).get(name) ?? "");
}

export function SignInForm({
  locale,
  messages,
  nextPath,
  initialError,
  initialSuccess,
}: AuthFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<FormStatus>(
    initialError
      ? { kind: "error", message: initialError }
      : initialSuccess
        ? { kind: "success", message: initialSuccess }
        : null,
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const result = getAuthSchemas(messages).signIn.safeParse({
      email: fieldValue(form, "email"),
      password: fieldValue(form, "password"),
    });

    setStatus(null);
    setFieldErrors({});

    if (!result.success) {
      setFieldErrors(getValidationErrors(result.error));
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          const supabase = createSupabaseBrowserClient();
          const { error } = await supabase.auth.signInWithPassword(result.data);

          if (error) {
            throw error;
          }

          router.replace(getSafeInternalPath(nextPath, locale) as Route);
        } catch (error) {
          setStatus({ kind: "error", message: getAuthErrorMessage(error, locale, "signIn") });
        }
      })();
    });
  }

  return (
    <form className="auth-form" noValidate onSubmit={handleSubmit}>
      <Stack gap={4}>
        <Input
          label={messages.common.email}
          isRequired
          isInvalid={Boolean(fieldErrors.email)}
          error={fieldErrors.email}
          inputProps={{ type: "email", name: "email", autoComplete: "email" }}
        />
        <Input
          label={messages.common.password}
          isRequired
          isInvalid={Boolean(fieldErrors.password)}
          error={fieldErrors.password}
          inputProps={{ type: "password", name: "password", autoComplete: "current-password" }}
        />
        <Button type="submit" loading={isPending} isDisabled={isPending}>
          {messages.common.signIn}
        </Button>
        <AuthStatus status={status} />
        <div className="auth-form__links">
          <Link href={`/${locale}/auth/recovery`}>{messages.signIn.forgotPassword}</Link>
          <span>
            {messages.signIn.noAccount}{" "}
            <Link href={`/${locale}/auth/sign-up`}>{messages.signIn.signUpLink}</Link>
          </span>
        </div>
      </Stack>
    </form>
  );
}

export function SignUpForm({ locale, messages }: AuthFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<FormStatus>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const result = getAuthSchemas(messages).signUp.safeParse({
      email: fieldValue(form, "email"),
      password: fieldValue(form, "password"),
      confirmPassword: fieldValue(form, "confirmPassword"),
    });

    setStatus(null);
    setFieldErrors({});

    if (!result.success) {
      setFieldErrors(getValidationErrors(result.error));
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          const supabase = createSupabaseBrowserClient();
          const redirectTo = `${window.location.origin}${buildAuthCallbackPath(locale, `/${locale}/auth/verification`)}`;
          const { data, error } = await supabase.auth.signUp({
            email: result.data.email,
            password: result.data.password,
            options: { emailRedirectTo: redirectTo },
          });

          if (error) {
            throw error;
          }

          if (data.session) {
            router.replace(`/${locale}/home`);
            return;
          }

          if (data.user) {
            const confirmed = await confirmSignupEmail({
              userId: data.user.id,
              email: result.data.email,
            });

            if (confirmed.ok) {
              const { error: signInError } = await supabase.auth.signInWithPassword({
                email: result.data.email,
                password: result.data.password,
              });

              if (!signInError) {
                router.replace(`/${locale}/home`);
                return;
              }
            }
          }

          setStatus({ kind: "success", message: messages.signUp.success });
        } catch (error) {
          setStatus({ kind: "error", message: getAuthErrorMessage(error, locale, "signUp") });
        }
      })();
    });
  }

  return (
    <form className="auth-form" noValidate onSubmit={handleSubmit}>
      <Stack gap={4}>
        <Input
          label={messages.common.email}
          isRequired
          isInvalid={Boolean(fieldErrors.email)}
          error={fieldErrors.email}
          inputProps={{ type: "email", name: "email", autoComplete: "email" }}
        />
        <Input
          label={messages.common.password}
          isRequired
          isInvalid={Boolean(fieldErrors.password)}
          error={fieldErrors.password}
          inputProps={{ type: "password", name: "password", autoComplete: "new-password" }}
        />
        <Input
          label={messages.common.confirmPassword}
          isRequired
          isInvalid={Boolean(fieldErrors.confirmPassword)}
          error={fieldErrors.confirmPassword}
          inputProps={{ type: "password", name: "confirmPassword", autoComplete: "new-password" }}
        />
        <Button type="submit" loading={isPending} isDisabled={isPending}>
          {messages.common.signUp}
        </Button>
        <AuthStatus status={status} />
        <p className="auth-form__hint">{messages.signUp.verification}</p>
        <p className="auth-form__links">
          {messages.signUp.alreadyHaveAccount}{" "}
          <Link href={`/${locale}/auth/sign-in`}>{messages.signUp.signInLink}</Link>
        </p>
      </Stack>
    </form>
  );
}

export function RecoveryForm({ locale, messages }: AuthFormProps) {
  const [isPending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<FormStatus>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const result = getAuthSchemas(messages).recovery.safeParse({
      email: fieldValue(form, "email"),
    });

    setStatus(null);
    setFieldErrors({});

    if (!result.success) {
      setFieldErrors(getValidationErrors(result.error));
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          const supabase = createSupabaseBrowserClient();
          const redirectTo = `${window.location.origin}${buildAuthCallbackPath(locale, `/${locale}/auth/update-password`)}`;
          const { error } = await supabase.auth.resetPasswordForEmail(result.data.email, {
            redirectTo,
          });

          if (error) {
            throw error;
          }

          setStatus({ kind: "success", message: messages.recovery.success });
        } catch (error) {
          setStatus({ kind: "error", message: getAuthErrorMessage(error, locale, "recovery") });
        }
      })();
    });
  }

  return (
    <form className="auth-form" noValidate onSubmit={handleSubmit}>
      <Stack gap={4}>
        <Input
          label={messages.common.email}
          isRequired
          isInvalid={Boolean(fieldErrors.email)}
          error={fieldErrors.email}
          inputProps={{ type: "email", name: "email", autoComplete: "email" }}
        />
        <Button type="submit" loading={isPending} isDisabled={isPending}>
          {messages.common.recovery}
        </Button>
        <AuthStatus status={status} />
        <p className="auth-form__links">
          <Link href={`/${locale}/auth/sign-in`}>{messages.common.backToSignIn}</Link>
        </p>
      </Stack>
    </form>
  );
}

export function UpdatePasswordForm({ locale, messages }: AuthFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<FormStatus>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const result = getAuthSchemas(messages).updatePassword.safeParse({
      password: fieldValue(form, "password"),
      confirmPassword: fieldValue(form, "confirmPassword"),
    });

    setStatus(null);
    setFieldErrors({});

    if (!result.success) {
      setFieldErrors(getValidationErrors(result.error));
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          const supabase = createSupabaseBrowserClient();
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

          if (sessionError || !sessionData.session) {
            throw new Error("session expired");
          }

          const { error } = await supabase.auth.updateUser({ password: result.data.password });

          if (error) {
            throw error;
          }

          router.replace(`/${locale}/auth/sign-in?success=password_updated`);
        } catch (error) {
          setStatus({
            kind: "error",
            message: getAuthErrorMessage(error, locale, "updatePassword"),
          });
        }
      })();
    });
  }

  return (
    <form className="auth-form" noValidate onSubmit={handleSubmit}>
      <Stack gap={4}>
        <Input
          label={messages.common.password}
          isRequired
          isInvalid={Boolean(fieldErrors.password)}
          error={fieldErrors.password}
          inputProps={{ type: "password", name: "password", autoComplete: "new-password" }}
        />
        <Input
          label={messages.common.confirmPassword}
          isRequired
          isInvalid={Boolean(fieldErrors.confirmPassword)}
          error={fieldErrors.confirmPassword}
          inputProps={{ type: "password", name: "confirmPassword", autoComplete: "new-password" }}
        />
        <Button type="submit" loading={isPending} isDisabled={isPending}>
          {messages.common.updatePassword}
        </Button>
        <AuthStatus status={status} />
      </Stack>
    </form>
  );
}
