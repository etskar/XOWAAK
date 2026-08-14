import Link from "next/link";
import type { Route } from "next";

import { Card } from "@/design-system";
import type { Locale } from "@/config/locales";
import { getAppMessages } from "@/i18n/app-messages";
import { getPlatformMessages } from "@/i18n/platform-messages";
import { formatDate } from "@/i18n/format";
import type { JobRecord, ProductRecord, ServiceRecord } from "@/server/platform/types";
import { FavoriteButton } from "@/features/platform/favorite-button";

export type FeedPlatformKind = "product" | "service" | "job";

export function platformDetailHref(kind: FeedPlatformKind, locale: Locale, id: string) {
  return `/${locale}/${kind === "product" ? "products" : kind === "service" ? "services" : "jobs"}/${id}` as Route;
}

function formatPrice(value: number | null, currency: string, locale: Locale) {
  if (value === null) return null;
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);
}

type PlatformFeedCardProps = {
  kind: FeedPlatformKind;
  item: ProductRecord | ServiceRecord | JobRecord;
  locale: Locale;
  isAuthenticated?: boolean;
};

export function PlatformFeedCard({
  kind,
  item,
  locale,
  isAuthenticated = true,
}: PlatformFeedCardProps) {
  const app = getAppMessages(locale);
  const platform = getPlatformMessages(locale);
  const isJob = kind === "job";
  const product = item as ProductRecord;
  const job = item as JobRecord;
  const amount = isJob
    ? job.salaryMin !== null
      ? formatPrice(job.salaryMin, job.currency, locale)
      : null
    : formatPrice(product.price, product.currency, locale);
  const kindLabel = isJob ? app.kindJob : kind === "product" ? app.kindProduct : app.kindService;
  const jobTypeLabel =
    isJob && job.jobType
      ? (platform.jobTypes[job.jobType as keyof typeof platform.jobTypes] ?? null)
      : null;

  return (
    <Card as="article" className={`feed-card feed-card--${kind}`}>
      <div className="feed-card__visual" aria-hidden="true">
        {item.imageUrl ? (
          // Signed URLs are generated on the server for visible records only.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt="" loading="lazy" />
        ) : (
          <span>{isJob ? "J" : kind === "product" ? "P" : "S"}</span>
        )}
        <span className="feed-card__kind">{kindLabel}</span>
      </div>
      <div className="feed-card__body">
        {item.locationLabel && <span className="feed-card__location">{item.locationLabel}</span>}
        <h2 className="feed-card__title">{item.title}</h2>
        {item.description && <p className="feed-card__description">{item.description}</p>}
        <div className="feed-card__meta">
          {amount && <strong className="feed-card__price">{amount}</strong>}
          {jobTypeLabel && <span>{jobTypeLabel}</span>}
          {isJob && job.employerName && <span>{job.employerName}</span>}
          <span>{formatDate(item.createdAt, locale)}</span>
        </div>
        <div className="feed-card__actions">
          <Link className="feed-card__link" href={platformDetailHref(kind, locale, item.id)}>
            {app.viewDetails}
          </Link>
          {isAuthenticated && (
            <FavoriteButton locale={locale} targetType={kind} targetId={item.id} />
          )}
        </div>
      </div>
    </Card>
  );
}