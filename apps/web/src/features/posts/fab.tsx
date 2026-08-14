"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useRef, useState } from "react";

import { Badge } from "@/design-system";
import type { Locale } from "@/config/locales";
import { getAppMessages } from "@/i18n/app-messages";
import { getPlatformMessages } from "@/i18n/platform-messages";
import { createTranslator } from "@/i18n/translate";

type FabProps = {
  locale: Locale;
  profileComplete: boolean;
};

export function Fab({ locale, profileComplete }: FabProps) {
  const app = getAppMessages(locale);
  const platform = getPlatformMessages(locale);
  const { t } = createTranslator(locale);
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const options = profileComplete
    ? [
        { href: `/${locale}/posts/new` as Route, label: app.createPost },
        { href: `/${locale}/products/new` as Route, label: platform.createProduct },
        { href: `/${locale}/services/new` as Route, label: platform.createService },
        { href: `/${locale}/jobs/new` as Route, label: platform.createJob },
        { href: `/${locale}/groups/new` as Route, label: platform.createGroup },
      ]
    : [{ href: `/${locale}/settings/profile` as Route, label: app.completeProfileAction }];

  return (
    <div className="fab" ref={rootRef}>
      {isOpen && <div className="fab__backdrop" aria-hidden="true" />}
      {isOpen && (
        <div className="fab__menu" role="menu" aria-label={app.createMenuTitle}>
          {options.map((option, index) => (
            <Link
              key={option.href}
              className="fab__option"
              href={option.href}
              role="menuitem"
              style={{ animationDelay: `${index * 40}ms` }}
              onClick={() => setIsOpen(false)}
            >
              <span className="fab__option-mark" aria-hidden="true">
                +
              </span>
              <span>{option.label}</span>
            </Link>
          ))}
          {!profileComplete && <Badge variant="warning">{app.completeProfileTitle}</Badge>}
        </div>
      )}
      <button
        className="fab__trigger"
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={isOpen ? t("common.close") : app.createMenuTitle}
        onClick={() => setIsOpen((current) => !current)}
      >
        <svg
          viewBox="0 0 24 24"
          width="26"
          height="26"
          aria-hidden="true"
          data-open={isOpen || undefined}
        >
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            d="M12 5v14M5 12h14"
          />
        </svg>
      </button>
    </div>
  );
}