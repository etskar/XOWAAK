"use client";

import type { HTMLAttributes, ReactNode } from "react";
import {
  Separator as AriaSeparator,
  type SeparatorProps as AriaSeparatorProps,
} from "react-aria-components";

import { cx } from "@/design-system/utils/cx";

export type BadgeVariant = "neutral" | "primary" | "success" | "warning" | "error" | "info";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({ variant = "neutral", className, ...props }: BadgeProps) {
  return <span {...props} className={cx("ds-badge", `ds-badge--${variant}`, className)} />;
}

export type AvatarProps = HTMLAttributes<HTMLSpanElement> & {
  name: string;
  src?: string;
  alt?: string;
  size?: "sm" | "md" | "lg";
};

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function Avatar({ name, src, alt, size = "md", className, ...props }: AvatarProps) {
  return (
    <span
      {...props}
      className={cx("ds-avatar", `ds-avatar--${size}`, className)}
      role={src ? undefined : "img"}
      aria-label={src ? undefined : name}
    >
      {src ? (
        // Avatar dimensions are controlled by the primitive, so callers can provide any approved image source.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt ?? name} />
      ) : (
        initials(name)
      )}
    </span>
  );
}

export type CardVariant = "default" | "elevated" | "flush" | "subtle" | "interactive";

export type CardProps = HTMLAttributes<HTMLElement> & {
  as?: "div" | "article" | "section";
  elevated?: boolean;
  variant?: CardVariant;
};

export function Card({
  as = "div",
  elevated = false,
  variant = "default",
  className,
  ...props
}: CardProps) {
  const Component = as;
  const resolvedVariant = elevated ? "elevated" : variant;

  return (
    <Component
      {...props}
      className={cx(
        "ds-card",
        resolvedVariant !== "default" && `ds-card--${resolvedVariant}`,
        className,
      )}
    />
  );
}

export type SeparatorProps = Omit<AriaSeparatorProps, "className"> & {
  className?: string;
};

export function Separator({ orientation = "horizontal", className, ...props }: SeparatorProps) {
  return (
    <AriaSeparator
      {...props}
      orientation={orientation}
      className={cx("ds-separator", `ds-separator--${orientation}`, className)}
    />
  );
}

export type ContentIconProps = {
  children: ReactNode;
};
