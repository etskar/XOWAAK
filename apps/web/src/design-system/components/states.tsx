import type { ReactNode } from "react";

import { cx } from "@/design-system/utils/cx";

type SpinnerProps = {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
  ariaHidden?: boolean;
};

export function Spinner({
  size = "md",
  label = "Loading",
  className,
  ariaHidden = false,
}: SpinnerProps) {
  return (
    <span
      className={cx("ds-spinner", `ds-spinner--${size}`, className)}
      role="status"
      aria-label={label}
      aria-hidden={ariaHidden || undefined}
    />
  );
}

type SkeletonProps = {
  variant?: "text" | "avatar" | "card" | "list";
  className?: string;
  label?: string;
};

export function Skeleton({ variant = "text", className, label }: SkeletonProps) {
  return (
    <span
      className={cx("ds-skeleton", `ds-skeleton--${variant}`, className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "status" : undefined}
    />
  );
}

type StateContentProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function LoadingState({ title, description, icon, action, className }: StateContentProps) {
  return (
    <section className={cx("ds-state", "ds-state--loading", className)} role="status">
      {icon ?? <Spinner size="lg" label={title} />}
      <div className="ds-state__content">
        <h2 className="ds-state__title">{title}</h2>
        {description && <p className="ds-state__description">{description}</p>}
      </div>
      {action}
    </section>
  );
}

export function EmptyState({ title, description, icon, action, className }: StateContentProps) {
  return (
    <section className={cx("ds-state", "ds-state--empty", className)}>
      {icon && (
        <div className="ds-state__icon" aria-hidden="true">
          {icon}
        </div>
      )}
      <div className="ds-state__content">
        <h2 className="ds-state__title">{title}</h2>
        {description && <p className="ds-state__description">{description}</p>}
      </div>
      {action}
    </section>
  );
}

type ErrorStateProps = StateContentProps & {
  onRetry?: () => void;
  retryLabel?: string;
};

export function ErrorState({
  title,
  description,
  icon,
  action,
  className,
  onRetry,
  retryLabel = "Try again",
}: ErrorStateProps) {
  return (
    <section className={cx("ds-state", "ds-state--error", className)} role="alert">
      {icon && (
        <div className="ds-state__icon" aria-hidden="true">
          {icon}
        </div>
      )}
      <div className="ds-state__content">
        <h2 className="ds-state__title">{title}</h2>
        {description && <p className="ds-state__description">{description}</p>}
      </div>
      <div className="ds-state__actions">
        {onRetry && (
          <button
            className="ds-button ds-button--secondary ds-button--md"
            type="button"
            onClick={onRetry}
          >
            {retryLabel}
          </button>
        )}
        {action}
      </div>
    </section>
  );
}
