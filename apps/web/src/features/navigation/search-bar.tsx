"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import type { Locale } from "@/config/locales";
import { getAppMessages } from "@/i18n/app-messages";
import { createTranslator } from "@/i18n/translate";
import { searchPlatformAction } from "@/server/platform/search-actions";
import type { PlatformResult, SearchCategory, SearchResultSet } from "@/server/platform/types";

const SUGGESTION_LIMIT = 3;

export function SearchBar({ locale }: { locale: Locale }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const app = getAppMessages(locale);
  const { t } = createTranslator(locale);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlatformResult<SearchResultSet> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

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
        inputRef.current?.blur();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) {
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setIsLoading(true);
      void searchPlatformAction(value).then((result) => {
        if (cancelled) {
          return;
        }
        setSuggestions(result);
        setIsLoading(false);
      });
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    setIsOpen(false);
    router.push(`/${locale}/search?q=${encodeURIComponent(value)}` as Route);
  }

  const labels: Record<SearchCategory, string> = {
    users: t("navigation.profile"),
    posts: app.postsCategory,
    products: t("navigation.products"),
    services: t("navigation.services"),
    jobs: t("navigation.jobs"),
    groups: t("navigation.groups"),
  };

  function hrefFor(path: string) {
    return path.replace(/^\/en(?=\/|$)/, `/${locale}`) as Route;
  }

  const showPanel = isOpen && query.trim().length >= 2;

  return (
    <div className="search-bar-wrap" ref={rootRef}>
      <form className="search-bar" role="search" onSubmit={handleSubmit}>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <circle
            cx="11"
            cy="11"
            r="6.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            d="M16 16l4.5 4.5"
          />
        </svg>
        <input
          ref={inputRef}
          type="search"
          name="q"
          value={query}
          onChange={(event) => {
            const value = event.target.value;
            setQuery(value);
            setIsOpen(true);
            if (value.trim().length < 2) {
              setSuggestions(null);
              setIsLoading(false);
            }
          }}
          onFocus={() => setIsOpen(true)}
          aria-label={app.searchTitle}
          aria-controls="search-suggestions"
          aria-autocomplete="list"
          placeholder={app.searchPlaceholder}
          autoComplete="off"
          enterKeyHint="search"
        />
      </form>
      {showPanel && (
        <div
          className="search-suggestions"
          id="search-suggestions"
          role="listbox"
          aria-label={app.searchTitle}
        >
          {isLoading && (
            <p className="search-suggestions__status" role="status">
              {t("common.loading")}
            </p>
          )}
          {!isLoading && suggestions?.status === "ok" && suggestions.data.total === 0 && (
            <p className="search-suggestions__status">{t("common.noResults")}</p>
          )}
          {!isLoading && (suggestions?.status === "error" || suggestions?.status === "unavailable") && (
            <p className="search-suggestions__status">{app.unavailable}</p>
          )}
          {suggestions?.status === "ok" && suggestions.data.total > 0 && (
            <>
              <div className="search-suggestions__groups">
                {(
                  Object.entries(suggestions.data.results) as Array<
                    [SearchCategory, SearchResultSet["results"][SearchCategory]]
                  >
                ).map(([category, items]) =>
                  items.length ? (
                    <section key={category} className="search-suggestions__group">
                      <h3>{labels[category]}</h3>
                      <ul>
                        {items.slice(0, SUGGESTION_LIMIT).map((item) => (
                          <li key={`${category}-${item.id}`}>
                            <Link
                              href={hrefFor(item.href)}
                              onClick={() => setIsOpen(false)}
                            >
                              <span className="search-suggestions__avatar" aria-hidden="true">
                                {item.title.slice(0, 1).toUpperCase()}
                              </span>
                              <span className="search-suggestions__text">
                                <strong>{item.title}</strong>
                                <small>
                                  {item.subtitle}
                                  {item.locationLabel ? ` · ${item.locationLabel}` : ""}
                                </small>
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null,
                )}
              </div>
              <Link
                className="search-suggestions__all"
                href={`/${locale}/search?q=${encodeURIComponent(query.trim())}` as Route}
                onClick={() => setIsOpen(false)}
              >
                {app.viewAll} →
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}