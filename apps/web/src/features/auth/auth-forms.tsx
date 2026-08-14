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
import {
  confirmSignupEmail,
  createProfileOnSignup,
  isUsernameAvailable,
  resolveUsernameToEmail,
} from "@/server/auth/actions";
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

type PasswordInputProps = {
  label: string;
  name: string;
  autoComplete: string;
  isInvalid: boolean;
  error?: string;
  toggleLabel: string;
};

function PasswordInput({ label, name, autoComplete, isInvalid, error, toggleLabel }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="auth-password-field">
      <Input
        label={label}
        isRequired
        isInvalid={isInvalid}
        error={error}
        inputProps={{ type: visible ? "text" : "password", name, autoComplete }}
      />
      <button
        type="button"
        className="auth-password-field__toggle"
        aria-pressed={visible}
        aria-label={toggleLabel}
        title={toggleLabel}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? (
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"
            />
            <circle cx="12" cy="12" r="2.6" fill="currentColor" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"
            />
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              d="M4 4l16 16"
            />
          </svg>
        )}
      </button>
    </div>
  );
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
      identifier: fieldValue(form, "identifier"),
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
          const identifier = result.data.identifier;
          const isEmail = identifier.includes("@");
          let email: string | null = isEmail ? identifier.toLowerCase() : null;

          if (!isEmail) {
            const resolution = await resolveUsernameToEmail(identifier);
            email = resolution.ok ? resolution.email : null;
          }

          if (!email) {
            setStatus({ kind: "error", message: messages.errors.userNotFound });
            return;
          }

          const { error } = await supabase.auth.signInWithPassword({
            email,
            password: fieldValue(form, "password"),
          });

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
          label={messages.common.identifier}
          isRequired
          isInvalid={Boolean(fieldErrors.identifier)}
          error={fieldErrors.identifier}
          inputProps={{ type: "text", name: "identifier", autoComplete: "username" }}
        />
        <PasswordInput
          label={messages.common.password}
          name="password"
          autoComplete="current-password"
          isInvalid={Boolean(fieldErrors.password)}
          error={fieldErrors.password}
          toggleLabel={messages.common.showPassword}
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
      name: fieldValue(form, "name"),
      username: fieldValue(form, "username"),
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
          const availability = await isUsernameAvailable(result.data.username);

          if (availability.ok && !availability.available) {
            setFieldErrors({ username: messages.validation.usernameTaken });
            return;
          }

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
            await createProfileOnSignup({
              username: result.data.username,
              displayName: result.data.name,
            });
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
                await createProfileOnSignup({
                  username: result.data.username,
                  displayName: result.data.name,
                });
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
          label={messages.common.name}
          isRequired
          isInvalid={Boolean(fieldErrors.name)}
          error={fieldErrors.name}
          inputProps={{ type: "text", name: "name", autoComplete: "name" }}
        />
        <Input
          label={messages.common.username}
          isRequired
          isInvalid={Boolean(fieldErrors.username)}
          error={fieldErrors.username}
          inputProps={{ type: "text", name: "username", autoComplete: "username" }}
        />
        <Input
          label={messages.common.email}
          isRequired
          isInvalid={Boolean(fieldErrors.email)}
          error={fieldErrors.email}
          inputProps={{ type: "email", name: "email", autoComplete: "email" }}
        />
        <PasswordInput
          label={messages.common.password}
          name="password"
          autoComplete="new-password"
          isInvalid={Boolean(fieldErrors.password)}
          error={fieldErrors.password}
          toggleLabel={messages.common.showPassword}
        />
        <PasswordInput
          label={messages.common.confirmPassword}
          name="confirmPassword"
          autoComplete="new-password"
          isInvalid={Boolean(fieldErrors.confirmPassword)}
          error={fieldErrors.confirmPassword}
          toggleLabel={messages.common.showPassword}
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
        <PasswordInput
          label={messages.common.password}
          name="password"
          autoComplete="new-password"
          isInvalid={Boolean(fieldErrors.password)}
          error={fieldErrors.password}
          toggleLabel={messages.common.showPassword}
        />
        <PasswordInput
          label={messages.common.confirmPassword}
          name="confirmPassword"
          autoComplete="new-password"
          isInvalid={Boolean(fieldErrors.confirmPassword)}
          error={fieldErrors.confirmPassword}
          toggleLabel={messages.common.showPassword}
        />
        <Button type="submit" loading={isPending} isDisabled={isPending}>
          {messages.common.updatePassword}
        </Button>
        <AuthStatus status={status} />
      </Stack>
    </form>
  );
}
