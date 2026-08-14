"use client";

import Link from "next/link";
import type { Route } from "next";
import { useDeferredValue, useEffect, useState, useTransition } from "react";

import { Badge, EmptyState, Input, Spinner } from "@/design-system";
import { cx } from "@/design-system/utils/cx";
import type { Locale } from "@/config/locales";
import { getAppMessages } from "@/i18n/app-messages";
import { createTranslator } from "@/i18n/translate";
import { searchPlatformAction } from "@/server/platform/search-actions";
import type { PlatformResult, SearchCategory, SearchResultSet } from "@/server/platform/types";

type SearchTab = SearchCategory | "all";

const TAB_ORDER: SearchTab[] = [
  "all",
  "users",
  "posts",
  "products",
  "services",
  "jobs",
  "groups",
];

export function SearchExperience({ locale, initialQuery = "" }: { locale: Locale; initialQuery?: string }) {
  const app = getAppMessages(locale);
  const { t } = createTranslator(locale);
  const [query, setQuery] = useState(initialQuery);
  const deferredQuery = useDeferredValue(query);
  const [result, setResult] = useState<PlatformResult<SearchResultSet> | null>(null);
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<SearchTab>("all");

  useEffect(() => {
    const value = deferredQuery.trim();
    if (value.length < 2) {
      return;
    }
    const timer = window.setTimeout(() => {
      startTransition(() => {
        void searchPlatformAction(value).then(setResult);
      });
    }, 280);
    return () => window.clearTimeout(timer);
  }, [deferredQuery]);

  const labels: Record<SearchCategory, string> = {
    users: t("navigation.profile"),
    posts: app.postsCategory,
    products: t("navigation.products"),
    services: t("navigation.services"),
    jobs: t("navigation.jobs"),
    groups: t("navigation.groups"),
  };

  const tabLabels: Record<SearchTab, string> = {
    all: app.searchAll,
    ...labels,
  };

  function hrefFor(path: string) {
    return path.replace(/^\/en(?=\/|$)/, `/${locale}`) as Route;
  }

  return (
    <div className="search-experience">
      <div className="search-experience__field">
        <Input
          label={app.searchPlaceholder}
          placeholder={app.searchPlaceholder}
          value={query}
          onChange={(value) => {
            setQuery(value);
            if (!value.trim()) setResult(null);
          }}
          inputProps={{ inputMode: "search", autoComplete: "off" }}
        />
        {query && (
          <button
            type="button"
            className="search-experience__clear"
            onClick={() => setQuery("")}
            aria-label={t("common.close")}
          >
            ×
          </button>
        )}
      </div>
      {isPending && (
        <div className="search-experience__loading" role="status">
          <Spinner size="sm" ariaHidden />
          {t("common.loading")}
        </div>
      )}
      {deferredQuery.trim().length < 2 && !result && (
        <EmptyState title={app.searchTitle} description={app.searchDescription} />
      )}
      {result?.status === "unavailable" && (
        <EmptyState title={app.unavailable} description={t("common.configurationDescription")} />
      )}
      {result?.status === "error" && (
        <EmptyState title={t("errors.unexpected")} description={t("errors.reload")} />
      )}
      {result?.status === "ok" && result.data.total === 0 && (
        <EmptyState title={t("common.noResults")} description={app.emptyContent} />
      )}
      {result?.status === "ok" && result.data.total > 0 && (
        <div className="search-results">
          <div className="search-tabs" role="tablist" aria-label={app.searchTitle}>
            {TAB_ORDER.map((tab) => {
              const count =
                tab === "all"
                  ? result.data.total
                  : result.data.results[tab as SearchCategory].length;
              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  className={cx("search-tab", activeTab === tab && "search-tab--active")}
                  aria-selected={activeTab === tab}
                  onClick={() => setActiveTab(tab)}
                >
                  {tabLabels[tab]}
                  <span className="search-tab__count">{count}</span>
                </button>
              );
            })}
          </div>
          {(
            Object.entries(result.data.results) as Array<
              [SearchCategory, SearchResultSet["results"][SearchCategory]]
            >
          )
            .filter(([category]) => activeTab === "all" || category === activeTab)
            .map(([category, items]) =>
              items.length ? (
                <section
                  key={category}
                  className="search-results__section"
                  aria-labelledby={`search-${category}`}
                >
                  <div className="search-results__heading">
                    <h2 id={`search-${category}`}>{labels[category]}</h2>
                    <Badge variant="neutral">{items.length}</Badge>
                  </div>
                  <div className="search-results__list">
                    {items.map((item) => (
                      <Link
                        key={`${category}-${item.id}`}
                        className="search-result"
                        href={hrefFor(item.href)}
                      >
                        <span className="search-result__avatar" aria-hidden="true">
                          {item.title.slice(0, 1).toUpperCase()}
                        </span>
                        <span>
                          <strong>{item.title}</strong>
                          <small>
                            {item.subtitle}
                            {item.locationLabel ? ` · ${item.locationLabel}` : ""}
                          </small>
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null,
            )}
        </div>
      )}
    </div>
  );
}
