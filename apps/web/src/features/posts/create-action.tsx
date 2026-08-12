"use client";

import Link from "next/link";
import type { Route } from "next";
import { useState } from "react";

import { Badge } from "@/design-system";
import type { Locale } from "@/config/locales";
import { getAppMessages } from "@/i18n/app-messages";
import { createTranslator } from "@/i18n/translate";

export function CreateAction({
  locale,
  profileComplete,
}: {
  locale: Locale;
  profileComplete: boolean;
}) {
  const app = getAppMessages(locale);
  const { t } = createTranslator(locale);
  const [isOpen, setIsOpen] = useState(false);

  function focusComposer() {
    setIsOpen(false);
    window.requestAnimationFrame(() => {
      const composer = document.getElementById("post-composer");
      composer?.scrollIntoView({ behavior: "smooth", block: "center" });
      composer?.querySelector("textarea")?.focus();
    });
  }

  return (
    <div className="create-action">
      {isOpen && (
        <div className="create-action__menu" role="dialog" aria-labelledby="create-action-title">
          <div className="create-action__heading">
            <div>
              <p className="showcase-eyebrow">XOWAAK / {t("navigation.create")}</p>
              <h2 id="create-action-title">{app.createMenuTitle}</h2>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} aria-label={t("common.close")}>
              ×
            </button>
          </div>
          {profileComplete ? (
            <button className="create-action__option" type="button" onClick={focusComposer}>
              <span className="create-action__option-icon" aria-hidden="true">
                +
              </span>
              <span>
                <strong>{app.createPost}</strong>
                <small>{app.createPostDescription}</small>
              </span>
            </button>
          ) : (
            <Link
              className="create-action__option"
              href={`/${locale}/settings/profile` as Route}
              onClick={() => setIsOpen(false)}
            >
              <span className="create-action__option-icon" aria-hidden="true">
                !
              </span>
              <span>
                <strong>{app.completeProfileAction}</strong>
                <small>{app.completeProfileDescription}</small>
              </span>
            </Link>
          )}
          <div className="create-action__notice">
            <Badge variant="neutral">{app.planned}</Badge>
            <span>{app.createUnavailable}</span>
          </div>
        </div>
      )}
      <button
        className="create-action__trigger"
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-label={isOpen ? t("common.close") : app.createMenuTitle}
      >
        <span aria-hidden="true">{isOpen ? "×" : "+"}</span>
        <span>{isOpen ? t("common.close") : t("navigation.create")}</span>
      </button>
    </div>
  );
}
