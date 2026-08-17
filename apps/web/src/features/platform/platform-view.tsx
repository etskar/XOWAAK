import Link from "next/link";
import type { Route } from "next";
import type { User } from "@supabase/supabase-js";

import { Avatar, Badge, Card, Container, EmptyState, ErrorState } from "@/design-system";
import type { Locale } from "@/config/locales";
import { getAppMessages } from "@/i18n/app-messages";
import { getPlatformMessages } from "@/i18n/platform-messages";
import { createTranslator } from "@/i18n/translate";
import type {
  GroupRecord,
  JobRecord,
  PlatformResult,
  ProductRecord,
  ServiceRecord,
} from "@/server/platform/types";
import {
  getGroupMembers,
  getGroupMessages,
  getGroups,
  getJobs,
  getProducts,
  getServices,
} from "@/server/platform/queries";
import { GroupChat } from "@/features/platform/group-chat";
import { GroupJoinButton } from "@/features/platform/group-join";
import { GroupMembers } from "@/features/platform/group-members";
import { FavoriteButton } from "@/features/platform/favorite-button";
import { ShareButton } from "@/features/platform/share-button";
import { CommerceActionPanel } from "@/features/orders/commerce-action";
import { PlatformOwnerActions } from "@/features/platform/platform-owner-actions";
import { BackLink } from "@/features/navigation/back-link";
import { AppNavigation } from "@/features/navigation/app-navigation";

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
  isAuthenticated,
}: {
  kind: PlatformKind;
  item: PlatformRecord;
  locale: Locale;
  isAuthenticated: boolean;
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
  const kindLabel = isGroup
    ? app.kindGroup
    : isJob
      ? app.kindJob
      : kind === "products"
        ? app.kindProduct
        : app.kindService;

  return (
    <Card as="article" className="platform-card">
      <div className="platform-card__visual" aria-hidden="true">
        {item.imageUrl ? (
          // Signed URLs are generated on the server for visible records only.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt="" loading="lazy" />
        ) : (
          <span>{isGroup ? "G" : isJob ? "J" : kind === "products" ? "P" : "S"}</span>
        )}
        <span className="platform-card__kind">{kindLabel}</span>
      </div>
      <div className="platform-card__body">
        <h2 className="platform-card__title">{itemTitle}</h2>
        {description && <p className="platform-card__description">{description}</p>}
        <div className="platform-card__meta">
          {amount && <strong className="platform-card__price">{amount}</strong>}
          {isGroup && (
            <>
              {group.type === "channel" && <Badge variant="primary">{app.kindChannel}</Badge>}
              <span>
                {group.memberCount} {app.groupsTitle}
              </span>
            </>
          )}
          {location && <span>{location}</span>}
          {owner && <span>@{owner.username}</span>}
        </div>
        <div className="platform-card__actions">
          <Link className="platform-card__link" href={detailHref(kind, locale, item.id) as Route}>
            {app.viewDetails}
          </Link>
          {isAuthenticated && (
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
          )}
        </div>
      </div>
    </Card>
  );
}

export function PlatformDirectory({
  kind,
  locale,
  result,
  user,
}: {
  kind: PlatformKind;
  locale: Locale;
  result: PlatformResult<PlatformRecord[]>;
  user: User | null;
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
              <PlatformCard
                key={item.id}
                kind={kind}
                item={item}
                locale={locale}
                isAuthenticated={user !== null}
              />
            ))}
          </div>
        )}
      </Container>
      {user && <AppNavigation locale={locale} />}
    </main>
  );
}

export async function PlatformDetail({
  kind,
  locale,
  result,
  user,
}: {
  kind: PlatformKind;
  locale: Locale;
  result: PlatformResult<PlatformRecord | null>;
  user: User | null;
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
  const isOwner =
    user !== null &&
    (isGroup
      ? String(group.ownerUserId) === user.id
      : isService
        ? String(service.providerUserId) === user.id
        : String(product.ownerUserId) === user.id);
  const itemTitle = isGroup ? group.name : contentRecord.title;
  const description = isGroup ? group.description : contentRecord.description;
  const detailPath = `/${locale}/${kind}/${item.id}`;
  const messageHref = owner
    ? (`/${locale}/messages?open=${encodeURIComponent(owner.username)}` as Route)
    : null;
  const signInHref = `/${locale}/auth/sign-in?next=${encodeURIComponent(detailPath)}` as Route;
  const actionLabel = isJob
    ? app.applyJob
    : isService
      ? app.requestService
      : app.orderProduct;
  const platform = getPlatformMessages(locale);
  const kindLabel = isGroup
    ? app.kindGroup
    : isJob
      ? app.kindJob
      : isService
        ? app.kindService
        : app.kindProduct;
  const amount =
    isJob && job.salaryMin !== null
      ? `${price(job.salaryMin, job.currency, locale)}${
          job.salaryMax !== null ? ` – ${price(job.salaryMax, job.currency, locale)}` : ""
        }`
      : !isGroup && product.price !== null
        ? price(product.price, product.currency, locale)
        : null;
  const location = !isGroup && !isJob ? product.locationLabel : isJob ? job.locationLabel : null;
  const jobTypeLabel =
    isJob && job.jobType
      ? (platform.jobTypes[job.jobType as keyof typeof platform.jobTypes] ?? null)
      : null;
  const relatedResult = isGroup
    ? await getGroups(9)
    : isJob
      ? await getJobs(9)
      : isService
        ? await getServices(9)
        : await getProducts(9);
  const related =
    relatedResult.status === "ok"
      ? relatedResult.data.filter((r) => r.id !== item.id).slice(0, 3)
      : [];
  const groupMembersResult = isGroup && user ? await getGroupMembers(group.id) : null;
  const viewerMembership =
    groupMembersResult?.status === "ok"
      ? groupMembersResult.data.find((member) => member.isViewer)
      : undefined;
  const viewerCanJoin = Boolean(
    isGroup && user && !isOwner && group.visibility === "public" && !viewerMembership,
  );

  return (
    <main className="platform-page">
      <Container size="md">
        <BackLink locale={locale} fallback={listHref(kind, locale)} />
        <Card className="platform-detail-card">
          <div className="platform-detail-card__visual" aria-hidden="true">
            {item.imageUrl ? (
              // Signed URLs are generated on the server for visible records only.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imageUrl} alt="" />
            ) : (
              <span>{isGroup ? "G" : isJob ? "J" : isService ? "S" : "P"}</span>
            )}
            <span className="platform-detail-card__kind">{kindLabel}</span>
          </div>
          <div className="platform-detail-card__body">
            <h1 className="ds-text-h2">{itemTitle}</h1>
            <div className="platform-detail-card__keyinfo">
              {amount && (
                <span className="platform-detail-chip platform-detail-chip--price">{amount}</span>
              )}
              {jobTypeLabel && <span className="platform-detail-chip">{jobTypeLabel}</span>}
              {location && <span className="platform-detail-chip">{location}</span>}
              {isJob && job.employerName && (
                <span className="platform-detail-chip">{job.employerName}</span>
              )}
              {isGroup && group.type === "channel" && (
                <span className="platform-detail-chip platform-detail-chip--channel">
                  {platform.channel}
                </span>
              )}
              {isGroup && (
                <span className="platform-detail-chip">
                  {group.memberCount} {app.groupsTitle}
                </span>
              )}
            </div>
            <div className="platform-detail-actions">
              {isOwner && (
                <PlatformOwnerActions
                  locale={locale}
                  kind={kind}
                  id={item.id}
                  listHref={listHref(kind, locale)}
                />
              )}
              {viewerCanJoin && (
                <GroupJoinButton
                  groupId={group.id}
                  label={app.joinGroup}
                  failedLabel={app.commerceFailed}
                />
              )}
              {!isGroup && user && owner && (
                <CommerceActionPanel
                  locale={locale}
                  kind={isJob ? "job" : isService ? "service" : "product"}
                  targetId={item.id}
                  ownerUsername={owner.username}
                  actionLabel={actionLabel}
                />
              )}
              {!isGroup && !user && (
                <Link href={signInHref} className="showcase-button showcase-button--primary">
                  {actionLabel}
                </Link>
              )}
              {messageHref && (isGroup ? (
                <Link href={messageHref} className="showcase-button showcase-button--primary">
                  {app.messageSeller}
                </Link>
              ) : (
                <Link href={messageHref} className="showcase-button showcase-button--secondary">
                  {app.messageSeller}
                </Link>
              ))}
              {user && (
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
              )}
              <ShareButton
                locale={locale}
                title={itemTitle}
                url={detailHref(kind, locale, item.id)}
              />
            </div>
            {description && <p className="platform-detail-card__description">{description}</p>}
            {owner && (
              <div className="platform-detail-card__footer">
                <Link
                  className="platform-detail-card__owner"
                  href={`/${locale}/u/${owner.username}` as Route}
                >
                  <Avatar name={owner.displayName} size="sm" />
                  <span className="platform-detail-card__owner-info">
                    <strong>{owner.displayName}</strong>
                    <span>@{owner.username}</span>
                  </span>
                </Link>
              </div>
            )}
            {!user && (
              <Card className="platform-signin-card">
                <p>{app.signInRequired}</p>
                <Link
                  className="showcase-button showcase-button--primary"
                  href={`/${locale}/auth/sign-in?next=${encodeURIComponent(detailPath)}` as Route}
                >
                  {t("navigation.signIn")}
                </Link>
              </Card>
            )}
            {related.length > 0 && (
              <section className="platform-related" aria-label={app.relatedContent}>
                <h2 className="platform-related__heading">{app.relatedContent}</h2>
                <div className="platform-related__grid">
                  {related.map((relatedItem) => {
                    const relatedRecord = relatedItem as ProductRecord | ServiceRecord | JobRecord;
                    const relatedTitle = isGroup
                      ? (relatedItem as GroupRecord).name
                      : relatedRecord.title;
                    const relatedOwner = isGroup
                      ? (relatedItem as GroupRecord).owner
                      : isService
                        ? (relatedItem as ServiceRecord).provider
                        : (relatedItem as ProductRecord).owner;
                    return (
                      <Link
                        key={relatedItem.id}
                        className="platform-related__card"
                        href={detailHref(kind, locale, relatedItem.id) as Route}
                      >
                        <span className="platform-related__visual" aria-hidden="true">
                          {relatedItem.imageUrl ? (
                            // Signed URLs are generated on the server for visible records only.
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={relatedItem.imageUrl} alt="" loading="lazy" />
                          ) : (
                            <span>{isGroup ? "G" : isJob ? "J" : isService ? "S" : "P"}</span>
                          )}
                        </span>
                        <strong>{relatedTitle}</strong>
                        {relatedOwner && <span>@{relatedOwner.username}</span>}
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        </Card>
        {isGroup && user && (
          <>
            <GroupMembers
              locale={locale}
              groupId={group.id}
              result={groupMembersResult ?? { status: "ok", data: [] }}
              viewerIsOwner={String(group.ownerUserId) === user.id}
            />
            <GroupChat
              locale={locale}
              groupId={group.id}
              result={await getGroupMessages(group.id)}
              viewerId={user.id}
              isChannel={group.type === "channel"}
              viewerCanManage={String(group.ownerUserId) === user.id}
            />
          </>
        )}
      </Container>
      {user && <AppNavigation locale={locale} />}
    </main>
  );
}
