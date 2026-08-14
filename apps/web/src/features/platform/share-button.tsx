"use client";

import { useState, useTransition } from "react";

import { Button } from "@/design-system";
import type { Locale } from "@/config/locales";
import { getAppMessages } from "@/i18n/app-messages";

type ShareButtonProps = {
  locale: Locale;
  title: string;
  url: string;
};

export function ShareButton({ locale, title, url }: ShareButtonProps) {
  const app = getAppMessages(locale);
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function share() {
    startTransition(() => {
      void (async () => {
        try {
          if (typeof navigator !== "undefined" && navigator.share) {
            await navigator.share({ title, text: title, url });
            return;
          }
          await navigator.clipboard.writeText(url);
          setStatus(app.share);
        } catch {
          setStatus(app.share);
        }
      })();
    });
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" loading={isPending} onPress={share}>
        {app.share}
      </Button>
      {status && (
        <span className="platform-share-status" role="status">
          {status}
        </span>
      )}
    </>
  );
}