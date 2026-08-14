"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button, Dialog, Stack } from "@/design-system";
import type { Locale } from "@/config/locales";
import { getPlatformMessages } from "@/i18n/platform-messages";
import { createTranslator } from "@/i18n/translate";
import {
  deleteGroup,
  deleteJob,
  deleteProduct,
  deleteService,
} from "@/server/platform/actions";
import type { PlatformKind } from "@/features/platform/platform-view";

type PlatformOwnerActionsProps = {
  locale: Locale;
  kind: PlatformKind;
  id: string;
  listHref: string;
};

export function PlatformOwnerActions({ locale, kind, id, listHref }: PlatformOwnerActionsProps) {
  const router = useRouter();
  const messages = getPlatformMessages(locale);
  const { t } = createTranslator(locale);
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function remove() {
    startTransition(() => {
      void (async () => {
        const action =
          kind === "products"
            ? deleteProduct
            : kind === "services"
              ? deleteService
              : kind === "jobs"
                ? deleteJob
                : deleteGroup;
        const result = await action({ id });
        if (!result.ok) {
          setStatus(messages.saveError);
          return;
        }
        router.push(listHref as Route);
        router.refresh();
      })();
    });
  }

  return (
    <div className="platform-owner-actions">
      <Link className="ds-button ds-button--outline ds-button--sm" href={`/${locale}/${kind}/${id}/edit` as Route}>
        {t("common.edit")}
      </Link>
      <Dialog
        trigger={
          <Button type="button" variant="destructive" size="sm">
            {t("common.delete")}
          </Button>
        }
        title={messages.deleteTitle}
        closeLabel={messages.cancel}
      >
        <Stack gap={4}>
          <p>{messages.deleteDescription}</p>
          <Button
            type="button"
            variant="destructive"
            loading={isPending}
            isDisabled={isPending}
            onPress={remove}
          >
            {messages.confirmDelete}
          </Button>
        </Stack>
      </Dialog>
      {status && (
        <span className="post-action-status" role="alert">
          {status}
        </span>
      )}
    </div>
  );
}