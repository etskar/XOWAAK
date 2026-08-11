"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { FormEvent } from "react";

import { getIdentityFieldErrors, getIdentitySchemas } from "@/domains/identity/validation";
import { Avatar, Button, Input, Stack, Textarea } from "@/design-system";
import type { Locale } from "@/config/locales";
import type { IdentityMessages } from "@/i18n/identity-messages";
import { updateProfile } from "@/server/identity/actions";
import type { ProfileRecord } from "@/server/identity/types";

type ProfileFormProps = {
  locale: Locale;
  messages: IdentityMessages;
  profile: ProfileRecord | null;
  unavailable: boolean;
};

function resultMessage(code: string | undefined, messages: IdentityMessages) {
  if (code === "unavailable") return messages.profile.unavailable;
  if (code === "conflict") return messages.validation.usernameInvalid;
  return messages.common.error;
}

export function ProfileForm({ locale, messages, profile, unavailable }: ProfileFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState({
    username: profile?.username ?? "",
    displayName: profile?.display_name ?? "",
    bio: profile?.bio ?? "",
    locationLabel: profile?.location_label ?? "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<string | null>(
    unavailable ? messages.profile.unavailable : null,
  );
  const displayName = values.displayName || values.username || messages.profile.title;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = getIdentitySchemas(messages).profile.safeParse(values);

    setStatus(null);
    setFieldErrors({});

    if (!result.success) {
      setFieldErrors(getIdentityFieldErrors(result.error));
      return;
    }

    startTransition(() => {
      void (async () => {
        const response = await updateProfile(result.data);

        if (!response.ok) {
          setStatus(resultMessage(response.code, messages));
          return;
        }

        setStatus(messages.profile.saved);
        router.refresh();
      })();
    });
  }

  return (
    <form className="settings-form" data-locale={locale} noValidate onSubmit={handleSubmit}>
      <Stack gap={5}>
        <div className="profile-editor-avatar">
          <Avatar name={displayName} size="lg" />
          <div>
            <p className="settings-form__label">{messages.profile.avatar}</p>
            <p className="settings-form__hint">{messages.profile.avatarUnavailable}</p>
          </div>
        </div>
        <Input
          label={messages.profile.username}
          value={values.username}
          onChange={(value) => setValues((current) => ({ ...current, username: value }))}
          error={fieldErrors.username}
          isInvalid={Boolean(fieldErrors.username)}
          isDisabled={unavailable || isPending}
          inputProps={{ name: "username", autoComplete: "username", type: "text" }}
        />
        <Input
          label={messages.profile.displayName}
          value={values.displayName}
          onChange={(value) => setValues((current) => ({ ...current, displayName: value }))}
          error={fieldErrors.displayName}
          isInvalid={Boolean(fieldErrors.displayName)}
          isDisabled={unavailable || isPending}
          inputProps={{ name: "displayName", autoComplete: "name", type: "text" }}
        />
        <Textarea
          label={messages.profile.bio}
          value={values.bio}
          onChange={(value) => setValues((current) => ({ ...current, bio: value }))}
          error={fieldErrors.bio}
          isInvalid={Boolean(fieldErrors.bio)}
        />
        <Input
          label={messages.profile.location}
          value={values.locationLabel}
          onChange={(value) => setValues((current) => ({ ...current, locationLabel: value }))}
          error={fieldErrors.locationLabel}
          isInvalid={Boolean(fieldErrors.locationLabel)}
          isDisabled={unavailable || isPending}
          inputProps={{ name: "location", autoComplete: "address-level2", type: "text" }}
        />
        <Button type="submit" loading={isPending} isDisabled={unavailable || isPending}>
          {messages.profile.save}
        </Button>
        {status && (
          <p
            className="settings-status"
            role={status === messages.profile.saved ? "status" : "alert"}
          >
            {status}
          </p>
        )}
      </Stack>
    </form>
  );
}
