"use client";

import Link from "next/link";
import type { Route } from "next";
import { useState, useTransition, type FormEvent } from "react";

import { Button, Textarea } from "@/design-system";
import type { Locale } from "@/config/locales";
import { getAppMessages } from "@/i18n/app-messages";
import {
  createJobApplication,
  createOrder,
  type CommerceActionResult,
} from "@/server/platform/commerce-actions";

export function CommerceActionPanel({
  locale,
  kind,
  targetId,
  ownerUsername,
  actionLabel,
}: {
  locale: Locale;
  kind: "product" | "service" | "job";
  targetId: string;
  ownerUsername: string;
  actionLabel: string;
}) {
  const app = getAppMessages(locale);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ ok: true; id: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(() => {
      const action: Promise<CommerceActionResult> =
        kind === "job"
          ? createJobApplication({ jobId: targetId, message })
          : createOrder({ targetType: kind, targetId, message });
      void action.then((result) => {
        if (result.ok) {
          setSuccess(result);
          setOpen(false);
        } else if (result.code === "conflict") {
          setError(app.alreadyRequested);
        } else {
          setError(app.commerceFailed);
        }
      });
    });
  }

  if (success) {
    return (
      <div className="commerce-panel commerce-panel--success">
        <p className="commerce-panel__title">
          {kind === "job" ? app.applicationSuccess : app.orderSuccess}
        </p>
        <p className="commerce-panel__detail">
          {kind === "job" ? app.applicationSuccessDetail : app.commerceSuccessDetail}
        </p>
        <div className="commerce-panel__links">
          {ownerUsername && (
            <Link
              className="showcase-button showcase-button--primary"
              href={`/${locale}/messages?open=${encodeURIComponent(ownerUsername)}`}
            >
              {app.continueInMessages}
            </Link>
          )}
          <Link
            className="showcase-button showcase-button--secondary"
            href={`/${locale}/orders` as Route}
          >
            {app.viewOrders}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="commerce-panel">
      <Button
        type="button"
        variant="primary"
        onPress={() => setOpen((value) => !value)}
        isDisabled={isPending}
      >
        {actionLabel}
      </Button>
      {open && (
        <form className="commerce-panel__form" onSubmit={submit}>
          <Textarea
            label={app.optionalMessage}
            name="message"
            value={message}
            onChange={setMessage}
            maxLength={2000}
          />
          {error && (
            <p className="commerce-panel__error" role="alert">
              {error}
            </p>
          )}
          <div className="commerce-panel__form-actions">
            <Button type="submit" variant="primary" loading={isPending} isDisabled={isPending}>
              {kind === "job" ? app.applyJob : actionLabel}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onPress={() => setOpen(false)}
              isDisabled={isPending}
            >
              {app.cancel}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}