"use client";

import Link from "next/link";
import { useTransition, type ReactNode } from "react";

import { Badge, Button, Card, EmptyState } from "@/design-system";
import type { Locale } from "@/config/locales";
import { getAppMessages, type AppMessages } from "@/i18n/app-messages";
import {
  updateJobApplicationStatus,
  updateOrderStatus,
  type ApplicationStatus,
  type OrderStatus,
} from "@/server/platform/commerce-actions";
import type {
  CommerceApplicationRecord,
  CommerceOrderRecord,
} from "@/server/platform/order-queries";

type StatusKey = OrderStatus | ApplicationStatus;

function statusVariant(
  status: StatusKey,
): "neutral" | "success" | "warning" | "error" | "info" {
  if (status === "completed" || status === "hired" || status === "accepted") return "success";
  if (status === "declined" || status === "rejected" || status === "cancelled") return "error";
  if (status === "pending") return "warning";
  return "neutral";
}

function Section({
  title,
  empty,
  count,
  children,
}: {
  title: string;
  empty: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section className="orders-section">
      <div className="orders-section__heading">
        <h2 className="ds-text-h3">{title}</h2>
        {count > 0 && <Badge variant="neutral">{count}</Badge>}
      </div>
      {count === 0 ? (
        <EmptyState title={empty} description="" />
      ) : (
        <div className="orders-card-grid">{children}</div>
      )}
    </section>
  );
}

function OrderRow({
  app,
  locale,
  order,
  isOwner,
  isPending,
  onStatus,
}: {
  app: AppMessages;
  locale: Locale;
  order: CommerceOrderRecord;
  isOwner: boolean;
  isPending: boolean;
  onStatus: (orderId: string, status: OrderStatus) => void;
}) {
  const statusLabel: Record<StatusKey, string> = {
    pending: app.statusPending,
    accepted: app.statusAccepted,
    declined: app.statusDeclined,
    cancelled: app.statusCancelled,
    completed: app.statusCompleted,
    shortlisted: app.statusShortlisted,
    rejected: app.statusRejected,
    hired: app.statusHired,
    withdrawn: app.statusWithdrawn,
  };
  return (
    <Card as="article" className="orders-card">
      <div className="orders-card__topline">
        {order.counterpart && (
          <span className="orders-card__counterpart">
            <span className="orders-card__avatar" aria-hidden="true">
              {order.counterpart.displayName.slice(0, 1).toUpperCase()}
            </span>
            <Link href={`/${locale}/u/${order.counterpart.username}`}>
              @{order.counterpart.username}
            </Link>
          </span>
        )}
        <span className="orders-card__status">
          <Badge variant={statusVariant(order.status)}>{statusLabel[order.status]}</Badge>
          <time dateTime={order.createdAt}>
            {new Date(order.createdAt).toLocaleDateString(locale)}
          </time>
        </span>
      </div>
      <h3>{order.title ?? app.unavailable}</h3>
      {order.priceSnapshot !== null && (
        <p className="orders-card__price">
          {new Intl.NumberFormat(locale, {
            style: "currency",
            currency: order.currency,
          }).format(order.priceSnapshot)}
        </p>
      )}
      {order.message && <p className="orders-card__message">{order.message}</p>}
      <div className="orders-card__actions">
        {isOwner && order.status === "pending" && (
          <>
            <Button
              size="sm"
              variant="primary"
              onPress={() => onStatus(order.id, "accepted")}
              isDisabled={isPending}
            >
              {app.accept}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onPress={() => onStatus(order.id, "declined")}
              isDisabled={isPending}
            >
              {app.decline}
            </Button>
          </>
        )}
        {isOwner && order.status === "accepted" && (
          <Button
            size="sm"
            variant="secondary"
            onPress={() => onStatus(order.id, "completed")}
            isDisabled={isPending}
          >
            {app.markCompleted}
          </Button>
        )}
        {!isOwner && order.status === "pending" && (
          <Button
            size="sm"
            variant="outline"
            onPress={() => onStatus(order.id, "cancelled")}
            isDisabled={isPending}
          >
            {app.cancel}
          </Button>
        )}
      </div>
    </Card>
  );
}

function ApplicationRow({
  app,
  locale,
  application,
  isOwner,
  isPending,
  onStatus,
}: {
  app: AppMessages;
  locale: Locale;
  application: CommerceApplicationRecord;
  isOwner: boolean;
  isPending: boolean;
  onStatus: (applicationId: string, status: ApplicationStatus) => void;
}) {
  const statusLabel: Record<StatusKey, string> = {
    pending: app.statusPending,
    accepted: app.statusAccepted,
    declined: app.statusDeclined,
    cancelled: app.statusCancelled,
    completed: app.statusCompleted,
    shortlisted: app.statusShortlisted,
    rejected: app.statusRejected,
    hired: app.statusHired,
    withdrawn: app.statusWithdrawn,
  };
  return (
    <Card as="article" className="orders-card">
      <div className="orders-card__topline">
        {application.counterpart && (
          <span className="orders-card__counterpart">
            <span className="orders-card__avatar" aria-hidden="true">
              {application.counterpart.displayName.slice(0, 1).toUpperCase()}
            </span>
            <Link href={`/${locale}/u/${application.counterpart.username}`}>
              @{application.counterpart.username}
            </Link>
          </span>
        )}
        <span className="orders-card__status">
          <Badge variant={statusVariant(application.status)}>
            {statusLabel[application.status]}
          </Badge>
          <time dateTime={application.createdAt}>
            {new Date(application.createdAt).toLocaleDateString(locale)}
          </time>
        </span>
      </div>
      <h3>{application.jobTitle ?? app.unavailable}</h3>
      {application.message && (
        <p className="orders-card__message">{application.message}</p>
      )}
      <div className="orders-card__actions">
        {isOwner && application.status === "pending" && (
          <>
            <Button
              size="sm"
              variant="primary"
              onPress={() => onStatus(application.id, "shortlisted")}
              isDisabled={isPending}
            >
              {app.shortlist}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onPress={() => onStatus(application.id, "rejected")}
              isDisabled={isPending}
            >
              {app.reject}
            </Button>
          </>
        )}
        {isOwner && application.status === "shortlisted" && (
          <Button
            size="sm"
            variant="secondary"
            onPress={() => onStatus(application.id, "hired")}
            isDisabled={isPending}
          >
            {app.hire}
          </Button>
        )}
        {!isOwner && application.status === "pending" && (
          <Button
            size="sm"
            variant="outline"
            onPress={() => onStatus(application.id, "withdrawn")}
            isDisabled={isPending}
          >
            {app.withdraw}
          </Button>
        )}
      </div>
    </Card>
  );
}

export function OrdersView({
  locale,
  result,
}: {
  locale: Locale;
  result: {
    status: "ok" | "unavailable" | "error";
    data: {
      receivedOrders: CommerceOrderRecord[];
      sentOrders: CommerceOrderRecord[];
      receivedApplications: CommerceApplicationRecord[];
      sentApplications: CommerceApplicationRecord[];
    } | null;
  };
}) {
  const app = getAppMessages(locale);
  const [isPending, startTransition] = useTransition();

  function runStatusOrder(orderId: string, status: OrderStatus) {
    startTransition(() => {
      void updateOrderStatus({ orderId, status }).then((result) => {
        if (result.ok) window.location.reload();
      });
    });
  }

  function runStatusApplication(applicationId: string, status: ApplicationStatus) {
    startTransition(() => {
      void updateJobApplicationStatus({ applicationId, status }).then((result) => {
        if (result.ok) window.location.reload();
      });
    });
  }

  if (result.status !== "ok" || !result.data) {
    return (
      <EmptyState
        title={result.status === "error" ? app.commerceFailed : app.unavailable}
        description=""
      />
    );
  }

  return (
    <div className="orders-view">
      <Section
        title={app.incomingOrders}
        empty={app.noIncomingOrders}
        count={result.data.receivedOrders.length}
      >
        {result.data.receivedOrders.map((order) => (
          <OrderRow
            key={order.id}
            app={app}
            locale={locale}
            order={order}
            isOwner
            isPending={isPending}
            onStatus={runStatusOrder}
          />
        ))}
      </Section>
      <Section
        title={app.sentOrders}
        empty={app.noSentOrders}
        count={result.data.sentOrders.length}
      >
        {result.data.sentOrders.map((order) => (
          <OrderRow
            key={order.id}
            app={app}
            locale={locale}
            order={order}
            isOwner={false}
            isPending={isPending}
            onStatus={runStatusOrder}
          />
        ))}
      </Section>
      <Section
        title={app.incomingApplications}
        empty={app.noIncomingApplications}
        count={result.data.receivedApplications.length}
      >
        {result.data.receivedApplications.map((application) => (
          <ApplicationRow
            key={application.id}
            app={app}
            locale={locale}
            application={application}
            isOwner
            isPending={isPending}
            onStatus={runStatusApplication}
          />
        ))}
      </Section>
      <Section
        title={app.sentApplications}
        empty={app.noSentApplications}
        count={result.data.sentApplications.length}
      >
        {result.data.sentApplications.map((application) => (
          <ApplicationRow
            key={application.id}
            app={app}
            locale={locale}
            application={application}
            isOwner={false}
            isPending={isPending}
            onStatus={runStatusApplication}
          />
        ))}
      </Section>
    </div>
  );
}