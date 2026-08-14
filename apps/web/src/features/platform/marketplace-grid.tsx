"use client";

import { useState } from "react";

import { Card } from "@/design-system";
import type { Locale } from "@/config/locales";
import { getAppMessages } from "@/i18n/app-messages";
import { PlatformFeedCard } from "@/features/feed/feed-cards";
import type { ProductRecord, ServiceRecord } from "@/server/platform/types";

type MarketplaceGridProps = {
  locale: Locale;
  kind: "product" | "service";
  items: Array<ProductRecord | ServiceRecord>;
};

export function MarketplaceGrid({ locale, kind, items }: MarketplaceGridProps) {
  const app = getAppMessages(locale);
  const categories = [
    ...new Set(
      items.map((item) => item.category).filter((value): value is string => Boolean(value)),
    ),
  ];
  const [category, setCategory] = useState("");
  const filtered = category ? items.filter((item) => item.category === category) : items;

  return (
    <div className="marketplace-grid-wrap">
      {categories.length > 1 && (
        <div className="marketplace-filter">
          <label className="marketplace-filter__label" htmlFor="marketplace-category">
            {app.categoryFilter}
          </label>
          <select
            id="marketplace-category"
            className="marketplace-filter__select"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">{app.allCategories}</option>
            {categories.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      )}
      {filtered.length > 0 ? (
        <div className="marketplace-grid">
          {filtered.map((item) => (
            <PlatformFeedCard key={item.id} kind={kind} item={item} locale={locale} />
          ))}
        </div>
      ) : (
        <Card className="feed-empty">
          <p className="feed-empty__title">{app.emptyContent}</p>
        </Card>
      )}
    </div>
  );
}