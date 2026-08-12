"use client";

import { useState, useTransition } from "react";

import { Button } from "@/design-system";
import type { Locale } from "@/config/locales";
import { createTranslator } from "@/i18n/translate";
import { toggleFavorite } from "@/server/platform/actions";

export function FavoriteButton({
  locale,
  targetType,
  targetId,
}: {
  locale: Locale;
  targetType: "product" | "service" | "job" | "group";
  targetId: string;
}) {
  const { t } = createTranslator(locale);
  const [active, setActive] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    startTransition(() => {
      void toggleFavorite({ targetType, targetId }).then((result) => {
        if (result.ok) setActive(result.active);
      });
    });
  }

  return (
    <Button
      type="button"
      variant={active ? "secondary" : "outline"}
      size="sm"
      loading={isPending}
      isDisabled={isPending}
      onPress={toggle}
    >
      {active ? t("identity.common.saved") : t("common.save")}
    </Button>
  );
}
