"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { FormEvent } from "react";

import { getIdentityFieldErrors, getIdentitySchemas } from "@/domains/identity/validation";
import { Avatar, Button, Input, Stack, Textarea } from "@/design-system";
import { MediaUpload } from "@/features/media/media-upload";
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
    avatarMediaId: profile?.avatar_media_id ?? null,
    coverMediaId: profile?.cover_media_id ?? null,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(
    unavailable ? messages.profile.unavailable : null,
  );
  const displayName = values.displayName || values.username || messages.profile.title;
  const coverUrl = profile?.cover_url ?? null;
  const shownCover = coverPreview ?? coverUrl;
  const hasCover = Boolean(shownCover);
  const avatarUrl = avatarPreview ?? profile?.avatar_url ?? null;
  const hasAvatar = Boolean(avatarUrl);

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
        const response = await updateProfile({
          ...result.data,
          avatarMediaId: values.avatarMediaId,
          coverMediaId: values.coverMediaId,
        });

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
          <Avatar name={displayName} src={avatarUrl ?? undefined} size="lg" />
          <div>
            <p className="settings-form__label">{messages.profile.avatar}</p>
            <p className="settings-form__hint">{messages.profile.avatarUnavailable}</p>
            {hasAvatar && (
              <button
                type="button"
                className="profile-editor-cover__remove"
                onClick={() => {
                  setValues((current) => ({ ...current, avatarMediaId: null }));
                  setAvatarPreview(null);
                }}
                disabled={unavailable || isPending}
              >
                {messages.profile.removeAvatar}
              </button>
            )}
          </div>
        </div>
        <MediaUpload
          locale={locale}
          bucket="avatars"
          label={messages.profile.avatar}
          uploadLabel={messages.profile.avatar}
          failedLabel={messages.common.error}
          accept="image/*"
          multiple={false}
          maxFiles={1}
          maxSizeBytes={5 * 1024 * 1024}
          disabled={unavailable || isPending}
          onAssetIdsChange={(assetIds) =>
            setValues((current) => ({ ...current, avatarMediaId: assetIds[0] ?? null }))
          }
          onLocalPreview={setAvatarPreview}
        />
        <div className="profile-editor-cover">
          <div className="profile-editor-cover__preview" data-empty={!hasCover || undefined}>
            {shownCover ? (
              // Local previews use object URLs; server covers use signed URLs.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shownCover} alt="" />
            ) : (
              <span>{messages.profile.cover}</span>
            )}
          </div>
          <div>
            <p className="settings-form__label">{messages.profile.cover}</p>
            <p className="settings-form__hint">{messages.profile.coverUnavailable}</p>
            {hasCover && (
              <button
                type="button"
                className="profile-editor-cover__remove"
                onClick={() => {
                  setValues((current) => ({ ...current, coverMediaId: null }));
                  setCoverPreview(null);
                }}
                disabled={unavailable || isPending}
              >
                {messages.profile.removeCover}
              </button>
            )}
          </div>
        </div>
        <MediaUpload
          locale={locale}
          bucket="covers"
          label={messages.profile.cover}
          uploadLabel={messages.profile.cover}
          failedLabel={messages.common.error}
          accept="image/*"
          multiple={false}
          maxFiles={1}
          maxSizeBytes={5 * 1024 * 1024}
          disabled={unavailable || isPending}
          onAssetIdsChange={(assetIds) =>
            setValues((current) => ({ ...current, coverMediaId: assetIds[0] ?? null }))
          }
          onLocalPreview={setCoverPreview}
        />
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
          isDisabled={unavailable || isPending}
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
        <div className="settings-form__actions">
          <Button type="submit" loading={isPending} isDisabled={unavailable || isPending}>
            {messages.profile.save}
          </Button>
          <Link
            className="showcase-button showcase-button--quiet"
            href={
              (profile
                ? `/${locale}/u/${profile.username}`
                : `/${locale}/settings`) as Route
            }
          >
            {messages.common.cancel}
          </Link>
        </div>
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
