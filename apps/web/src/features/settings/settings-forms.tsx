"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { getAuthSchemas } from "@/auth/validation";
import { Button, Card, EmptyState, Input, Select, Stack } from "@/design-system";
import { createSupabaseBrowserClient } from "@/supabase/browser";
import { getLocaleConfig, locales, type Locale } from "@/config/locales";
import { getAuthMessages } from "@/i18n/auth-messages";
import { getIdentitySchemas } from "@/domains/identity/validation";
import type { IdentityMessages } from "@/i18n/identity-messages";
import {
  cancelAccountDeletion,
  registerCurrentDevice,
  requestAccountDeletion,
  revokeDevice,
  updatePrivacySettings,
  updateSettings,
} from "@/server/identity/actions";
import type {
  AccountDeletionRequestRecord,
  DeviceRecord,
  UserSettingsRecord,
} from "@/server/identity/types";

function operationMessage(code: string | undefined, messages: IdentityMessages) {
  if (code === "unavailable") return messages.common.unavailable;
  if (code === "conflict") return messages.account.deletionRequested;
  return messages.common.error;
}

function platformLabel(platform: DeviceRecord["platform"], messages: IdentityMessages) {
  const labels = {
    web: messages.devices.platformWeb,
    ios: messages.devices.platformIos,
    android: messages.devices.platformAndroid,
    desktop: messages.devices.platformDesktop,
    other: messages.devices.platformOther,
  };

  return labels[platform];
}

type PreferencesFormProps = {
  locale: Locale;
  messages: IdentityMessages;
  settings: UserSettingsRecord | null;
  unavailable: boolean;
};

export function PreferencesForm({ locale, messages, settings, unavailable }: PreferencesFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedLocale, setSelectedLocale] = useState<Locale>(settings?.locale ?? locale);
  const [themePreference, setThemePreference] = useState<"system" | "light" | "dark">(
    settings?.theme_preference ?? "system",
  );
  const [status, setStatus] = useState<string | null>(null);

  function applyTheme(nextTheme: "system" | "light" | "dark") {
    const resolvedTheme =
      nextTheme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : nextTheme;
    document.documentElement.dataset.theme = resolvedTheme;
    window.localStorage.setItem("xowaak-theme", resolvedTheme);
  }

  function savePreferences() {
    const result = getIdentitySchemas(messages).settings.safeParse({
      locale: selectedLocale,
      themePreference,
    });

    if (!result.success) {
      setStatus(messages.common.error);
      return;
    }

    applyTheme(themePreference);

    startTransition(() => {
      void (async () => {
        const response = await updateSettings(result.data);
        setStatus(response.ok ? messages.common.saved : operationMessage(response.code, messages));
        if (response.ok) router.refresh();
      })();
    });
  }

  return (
    <Card>
      <Stack gap={4}>
        <div>
          <h2 className="settings-section-title">{messages.nav.settings}</h2>
          <p className="settings-form__hint">{messages.profile.description}</p>
        </div>
        <Select
          label={messages.common.language}
          options={locales.map((option) => ({
            id: option,
            label: getLocaleConfig(option).nativeName,
          }))}
          selectedKey={selectedLocale}
          onSelectionChange={(key) => setSelectedLocale(String(key) as Locale)}
          isDisabled={unavailable || isPending}
        />
        <Select
          label={messages.common.appearance}
          options={[
            { id: "system", label: messages.common.system },
            { id: "light", label: messages.common.light },
            { id: "dark", label: messages.common.dark },
          ]}
          selectedKey={themePreference}
          onSelectionChange={(key) => {
            const nextTheme = String(key) as "system" | "light" | "dark";
            setThemePreference(nextTheme);
            applyTheme(nextTheme);
          }}
          isDisabled={unavailable || isPending}
        />
        <Button
          type="button"
          onPress={savePreferences}
          loading={isPending}
          isDisabled={unavailable || isPending}
        >
          {messages.common.save}
        </Button>
        {status && (
          <p className="settings-status" role="status">
            {status}
          </p>
        )}
      </Stack>
    </Card>
  );
}

type PrivacyFormProps = {
  locale: Locale;
  messages: IdentityMessages;
  visibility: "public" | "private";
  discoverability: "discoverable" | "not_discoverable";
  contactPrivacy: "anyone" | "authenticated" | "nobody";
  unavailable: boolean;
};

export function PrivacyForm({
  messages,
  visibility: initialVisibility,
  discoverability: initialDiscoverability,
  contactPrivacy: initialContactPrivacy,
  unavailable,
}: PrivacyFormProps) {
  const [isPending, startTransition] = useTransition();
  const [visibility, setVisibility] = useState(initialVisibility);
  const [discoverability, setDiscoverability] = useState(initialDiscoverability);
  const [contactPrivacy, setContactPrivacy] = useState(initialContactPrivacy);
  const [status, setStatus] = useState<string | null>(null);

  function savePrivacy() {
    const result = getIdentitySchemas(messages).privacy.safeParse({
      visibility,
      discoverability,
      contactPrivacy,
    });
    if (!result.success) {
      setStatus(messages.common.error);
      return;
    }

    startTransition(() => {
      void (async () => {
        const response = await updatePrivacySettings(result.data);
        setStatus(response.ok ? messages.privacy.saved : operationMessage(response.code, messages));
      })();
    });
  }

  return (
    <form
      className="settings-form"
      onSubmit={(event) => {
        event.preventDefault();
        savePrivacy();
      }}
    >
      <Stack gap={5}>
        <Select
          label={messages.privacy.visibility}
          description={messages.privacy.visibilityDescription}
          options={[
            { id: "public", label: messages.privacy.public },
            { id: "private", label: messages.privacy.private },
          ]}
          selectedKey={visibility}
          onSelectionChange={(key) => setVisibility(String(key) as "public" | "private")}
          isDisabled={unavailable || isPending}
        />
        <Select
          label={messages.privacy.discoverability}
          options={[
            { id: "discoverable", label: messages.privacy.discoverable },
            { id: "not_discoverable", label: messages.privacy.notDiscoverable },
          ]}
          selectedKey={discoverability}
          onSelectionChange={(key) =>
            setDiscoverability(String(key) as "discoverable" | "not_discoverable")
          }
          isDisabled={unavailable || isPending}
        />
        <Select
          label={messages.privacy.contactPrivacy}
          options={[
            { id: "anyone", label: messages.privacy.anyone },
            { id: "authenticated", label: messages.privacy.authenticated },
            { id: "nobody", label: messages.privacy.nobody },
          ]}
          selectedKey={contactPrivacy}
          onSelectionChange={(key) =>
            setContactPrivacy(String(key) as "anyone" | "authenticated" | "nobody")
          }
          isDisabled={unavailable || isPending}
        />
        <Button type="submit" loading={isPending} isDisabled={unavailable || isPending}>
          {messages.privacy.save}
        </Button>
        {status && (
          <p className="settings-status" role="status">
            {status}
          </p>
        )}
      </Stack>
    </form>
  );
}

type AccountFormProps = {
  locale: Locale;
  messages: IdentityMessages;
  deletionRequest: AccountDeletionRequestRecord | null;
  unavailable: boolean;
};

export function AccountForm({ locale, messages, deletionRequest, unavailable }: AccountFormProps) {
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  function changeEmail() {
    const result = getIdentitySchemas(messages).email.safeParse({ email });
    if (!result.success) {
      setStatus(result.error.issues[0]?.message ?? messages.common.error);
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          const supabase = createSupabaseBrowserClient();
          const { error } = await supabase.auth.updateUser({ email: result.data.email });
          if (error) throw error;
          setStatus(messages.account.emailChanged);
        } catch {
          setStatus(messages.common.unavailable);
        }
      })();
    });
  }

  function requestDeletion() {
    const result = getIdentitySchemas(messages).deletion.safeParse({ confirmation });
    if (!result.success) {
      setStatus(result.error.issues[0]?.message ?? messages.common.error);
      return;
    }

    startTransition(() => {
      void (async () => {
        const response = await requestAccountDeletion(result.data);
        setStatus(
          response.ok
            ? messages.account.deletionRequested
            : operationMessage(response.code, messages),
        );
      })();
    });
  }

  function cancelDeletion() {
    startTransition(() => {
      void (async () => {
        const response = await cancelAccountDeletion();
        setStatus(
          response.ok
            ? messages.account.deletionCancelled
            : operationMessage(response.code, messages),
        );
      })();
    });
  }

  return (
    <Stack gap={6}>
      <div className="settings-form">
        <Stack gap={4}>
          <Input
            label={messages.account.email}
            placeholder={messages.account.emailPlaceholder}
            value={email}
            onChange={setEmail}
            isDisabled={unavailable || isPending}
            inputProps={{ type: "email", autoComplete: "email" }}
          />
          <Button
            type="button"
            onPress={changeEmail}
            loading={isPending}
            isDisabled={unavailable || isPending}
          >
            {messages.account.changeEmail}
          </Button>
        </Stack>
      </div>
      <div className="settings-danger-zone">
        <Stack gap={4}>
          <div>
            <h2 className="settings-section-title">{messages.account.deletionTitle}</h2>
            <p className="settings-form__hint">{messages.account.deletionDescription}</p>
          </div>
          <Input
            label={messages.account.deletionConfirmation}
            value={confirmation}
            onChange={setConfirmation}
            isDisabled={unavailable || isPending || Boolean(deletionRequest)}
            inputProps={{ type: "text", autoComplete: "off" }}
          />
          {deletionRequest ? (
            <Button
              type="button"
              variant="outline"
              onPress={cancelDeletion}
              loading={isPending}
              isDisabled={isPending}
            >
              {messages.account.cancelDeletion}
            </Button>
          ) : (
            <Button
              type="button"
              variant="destructive"
              onPress={requestDeletion}
              loading={isPending}
              isDisabled={unavailable || isPending}
            >
              {messages.account.deletionAction}
            </Button>
          )}
        </Stack>
      </div>
      <form method="post" action={`/${locale}/auth/sign-out`}>
        <Button type="submit" variant="ghost">
          {messages.account.signOut}
        </Button>
      </form>
      {status && (
        <p className="settings-status" role="status">
          {status}
        </p>
      )}
    </Stack>
  );
}

type SecurityFormProps = {
  locale: Locale;
  messages: IdentityMessages;
  unavailable: boolean;
};

export function SecurityForm({ locale, messages, unavailable }: SecurityFormProps) {
  const authMessages = getAuthMessages(locale);
  const [isPending, startTransition] = useTransition();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  function changePassword() {
    const result = getAuthSchemas(authMessages).updatePassword.safeParse({
      password,
      confirmPassword,
    });
    if (!result.success) {
      setStatus(result.error.issues[0]?.message ?? messages.common.error);
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          const supabase = createSupabaseBrowserClient();
          const { error } = await supabase.auth.updateUser({ password: result.data.password });
          if (error) throw error;
          setStatus(messages.security.passwordChanged);
          setPassword("");
          setConfirmPassword("");
        } catch {
          setStatus(messages.common.unavailable);
        }
      })();
    });
  }

  function signOutOthers() {
    startTransition(() => {
      void (async () => {
        try {
          const supabase = createSupabaseBrowserClient();
          const { error } = await supabase.auth.signOut({ scope: "others" });
          if (error) throw error;
          setStatus(messages.security.sessionsEnded);
        } catch {
          setStatus(messages.common.unavailable);
        }
      })();
    });
  }

  return (
    <Stack gap={5}>
      <div className="settings-form">
        <Stack gap={4}>
          <Input
            label={messages.security.newPassword}
            value={password}
            onChange={setPassword}
            isDisabled={unavailable || isPending}
            inputProps={{ type: "password", autoComplete: "new-password" }}
          />
          <Input
            label={messages.security.confirmPassword}
            value={confirmPassword}
            onChange={setConfirmPassword}
            isDisabled={unavailable || isPending}
            inputProps={{ type: "password", autoComplete: "new-password" }}
          />
          <Button
            type="button"
            onPress={changePassword}
            loading={isPending}
            isDisabled={unavailable || isPending}
          >
            {messages.security.changePassword}
          </Button>
        </Stack>
      </div>
      <Button
        type="button"
        variant="outline"
        onPress={signOutOthers}
        loading={isPending}
        isDisabled={unavailable || isPending}
      >
        {messages.security.signOutOthers}
      </Button>
      {status && (
        <p className="settings-status" role="status">
          {status}
        </p>
      )}
    </Stack>
  );
}

type DevicesListProps = {
  locale: Locale;
  messages: IdentityMessages;
  devices: DeviceRecord[];
  unavailable: boolean;
};

function formatDate(value: string | null, locale: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
}

export function DevicesList({ locale, messages, devices, unavailable }: DevicesListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(
    unavailable ? messages.devices.unavailable : null,
  );

  function register() {
    startTransition(() => {
      void (async () => {
        const response = await registerCurrentDevice();
        setStatus(
          response.ok ? messages.devices.registered : operationMessage(response.code, messages),
        );
        if (response.ok) router.refresh();
      })();
    });
  }

  function revoke(id: string) {
    startTransition(() => {
      void (async () => {
        const response = await revokeDevice(id);
        setStatus(
          response.ok ? messages.devices.revoked : operationMessage(response.code, messages),
        );
        if (response.ok) router.refresh();
      })();
    });
  }

  return (
    <Stack gap={5}>
      <Button
        type="button"
        onPress={register}
        loading={isPending}
        isDisabled={unavailable || isPending}
      >
        {messages.devices.register}
      </Button>
      {devices.length === 0 ? (
        <EmptyState title={messages.devices.empty} description={messages.devices.description} />
      ) : (
        <div className="device-list">
          {devices.map((device) => (
            <Card key={device.id}>
              <div className="device-row">
                <div>
                  <h2 className="settings-section-title">
                    {device.device_name || messages.devices.unknownDevice}
                  </h2>
                  <p className="settings-form__hint">{platformLabel(device.platform, messages)}</p>
                  <p className="settings-form__hint">
                    {messages.devices.created}: {formatDate(device.created_at, locale)}
                  </p>
                  <p className="settings-form__hint">
                    {messages.devices.lastActive}: {formatDate(device.last_seen_at, locale)}
                  </p>
                </div>
                <div className="device-row__actions">
                  {device.is_current && (
                    <span className="device-current">{messages.devices.current}</span>
                  )}
                  {device.revoked_at ? (
                    <span className="device-current">{messages.devices.revokedState}</span>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      onPress={() => revoke(device.id)}
                      isDisabled={device.is_current || isPending}
                    >
                      {messages.devices.revoke}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      {status && (
        <p className="settings-status" role="status">
          {status}
        </p>
      )}
    </Stack>
  );
}
