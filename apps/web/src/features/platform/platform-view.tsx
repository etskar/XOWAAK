import Link from "next/link";
import type { Route } from "next";

import { Badge, Card, Container, EmptyState, ErrorState } from "@/design-system";
import type { Locale } from "@/config/locales";
import { getAppMessages } from "@/i18n/app-messages";
import { createTranslator } from "@/i18n/translate";
import type {
  GroupRecord,
  JobRecord,
  PlatformResult,
  ProductRecord,
  ServiceRecord,
} from "@/server/platform/types";
import { getGroupMessages } from "@/server/platform/queries";
import { GroupChat } from "@/features/platform/group-chat";
import { FavoriteButton } from "@/features/platform/favorite-button";

export type PlatformKind = "products" | "services" | "jobs" | "groups";
type PlatformRecord = ProductRecord | ServiceRecord | JobRecord | GroupRecord;

function titleFor(kind: PlatformKind, t: ReturnType<typeof createTranslator>["t"]) {
  const keys = {
    products: "navigation.products",
    services: "navigation.services",
    jobs: "navigation.jobs",
    groups: "navigation.groups",
  } as const;
  return t(keys[kind]);
}

function listHref(kind: PlatformKind, locale: Locale) {
  return `/${locale}/${kind}`;
}

function detailHref(kind: PlatformKind, locale: Locale, id: string) {
  return `/${locale}/${kind}/${id}`;
}

function price(value: number | null, currency: string, locale: Locale) {
  if (value === null) return null;
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);
}

function PlatformCard({
  kind,
  item,
  locale,
}: {
  kind: PlatformKind;
  item: PlatformRecord;
  locale: Locale;
}) {
  const app = getAppMessages(locale);
  const isGroup = kind === "groups";
  const isJob = kind === "jobs";
  const isService = kind === "services";
  const product = item as ProductRecord;
  const service = item as ServiceRecord;
  const job = item as JobRecord;
  const group = item as GroupRecord;
  const contentRecord = item as ProductRecord | ServiceRecord | JobRecord;
  const owner = isGroup ? group.owner : isService ? service.provider : product.owner;
  const itemTitle = isGroup ? group.name : contentRecord.title;
  const description = isGroup ? group.description : contentRecord.description;
  const location = !isGroup && !isJob ? product.locationLabel : isJob ? job.locationLabel : null;
  const amount =
    !isGroup && !isJob
      ? price(product.price, product.currency, locale)
      : isJob && job.salaryMin !== null
        ? price(job.salaryMin, job.currency, locale)
        : null;

  return (
    <Card as="article" className="platform-card">
      <div className="platform-card__visual" aria-hidden="true">
        <span>{isGroup ? "G" : isJob ? "J" : kind === "products" ? "P" : "S"}</span>
      </div>
      <div className="platform-card__body">
        <div className="platform-card__topline">
          <Badge
            variant={
              item.status === "published" || item.status === "active" ? "success" : "neutral"
            }
          >
            {item.status}
          </Badge>
          {location && <span>{location}</span>}
        </div>
        <h2>{itemTitle}</h2>
        {description && <p>{description}</p>}
        <div className="platform-card__meta">
          {amount && <strong>{amount}</strong>}
          {isGroup && (
            <span>
              {group.memberCount} {app.groupsTitle}
            </span>
          )}
          {owner && <span>@{owner.username}</span>}
        </div>
        <div className="platform-card__actions">
          <Link className="platform-card__link" href={detailHref(kind, locale, item.id) as Route}>
            {app.current} →
          </Link>
          <FavoriteButton
            locale={locale}
            targetType={
              kind === "groups"
                ? "group"
                : kind === "products"
                  ? "product"
                  : kind === "services"
                    ? "service"
                    : "job"
            }
            targetId={item.id}
          />
        </div>
      </div>
    </Card>
  );
}

export function PlatformDirectory({
  kind,
  locale,
  result,
}: {
  kind: PlatformKind;
  locale: Locale;
  result: PlatformResult<PlatformRecord[]>;
}) {
  const { t } = createTranslator(locale);
  const app = getAppMessages(locale);
  const title = titleFor(kind, t);

  return (
    <main className="platform-page">
      <Container size="xl">
        <div className="platform-page__header">
          <div>
            <p className="showcase-eyebrow">XOWAAK / {title}</p>
            <h1 className="ds-text-h1">{title}</h1>
            <p>{app.emptyContent}</p>
          </div>
          <Badge variant={result.status === "ok" ? "success" : "warning"}>
            {result.status === "ok" ? app.current : app.unavailable}
          </Badge>
        </div>
        {result.status === "error" && (
          <ErrorState title={t("errors.unexpected")} description={t("errors.reload")} />
        )}
        {result.status === "unavailable" && (
          <EmptyState title={app.unavailable} description={t("common.configurationDescription")} />
        )}
        {result.status === "ok" && result.data.length === 0 && (
          <EmptyState title={app.emptyContent} description={t("common.reserved")} />
        )}
        {result.status === "ok" && result.data.length > 0 && (
          <div className="platform-card-grid">
            {result.data.map((item) => (
              <PlatformCard key={item.id} kind={kind} item={item} locale={locale} />
            ))}
          </div>
        )}
      </Container>
    </main>
  );
}

export async function PlatformDetail({
  kind,
  locale,
  result,
}: {
  kind: PlatformKind;
  locale: Locale;
  result: PlatformResult<PlatformRecord | null>;
}) {
  const { t } = createTranslator(locale);
  const title = titleFor(kind, t);
  const app = getAppMessages(locale);

  if (result.status !== "ok" || !result.data) {
    return (
      <main className="platform-page">
        <Container size="md">
          <EmptyState
            title={result.status === "error" ? t("errors.unexpected") : app.emptyContent}
            description={result.status === "error" ? t("errors.reload") : t("common.reserved")}
            action={
              <Link
                className="showcase-button showcase-button--secondary"
                href={listHref(kind, locale) as Route}
              >
                {title}
              </Link>
            }
          />
        </Container>
      </main>
    );
  }

  const item = result.data;
  const isGroup = kind === "groups";
  const isJob = kind === "jobs";
  const isService = kind === "services";
  const product = item as ProductRecord;
  const service = item as ServiceRecord;
  const job = item as JobRecord;
  const group = item as GroupRecord;
  const contentRecord = item as ProductRecord | ServiceRecord | JobRecord;
  const owner = isGroup ? group.owner : isService ? service.provider : product.owner;
  const itemTitle = isGroup ? group.name : contentRecord.title;
  const description = isGroup ? group.description : contentRecord.description;

  return (
    <main className="platform-page">
      <Container size="md">
        <Link className="platform-back-link" href={listHref(kind, locale) as Route}>
          ← {title}
        </Link>
        <Card className="platform-detail-card">
          <div className="platform-detail-card__visual" aria-hidden="true">
            <span>{isGroup ? "G" : isJob ? "J" : kind === "products" ? "P" : "S"}</span>
          </div>
          <Badge variant="success">{item.status}</Badge>
          <h1 className="ds-text-h2">{itemTitle}</h1>
          {description && <p>{description}</p>}
          {owner && <Link href={`/${locale}/u/${owner.username}` as Route}>@{owner.username}</Link>}
          {isGroup && (
            <p>
              {group.memberCount} {app.groupsTitle}
            </p>
          )}
          {isJob && job.employerName && <p>{job.employerName}</p>}
          {!isGroup && !isJob && product.locationLabel && <p>{product.locationLabel}</p>}
        </Card>
        {isGroup && (
          <GroupChat locale={locale} groupId={group.id} result={await getGroupMessages(group.id)} />
        )}
      </Container>
    </main>
  );
}
