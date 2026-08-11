"use client";

import type { ReactNode } from "react";
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from "react-aria-components";

import { Spinner } from "@/design-system/components/states";
import { cx } from "@/design-system/utils/cx";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = Omit<AriaButtonProps, "children" | "className" | "isPending"> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  className?: string;
  isPending?: boolean;
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  isPending = false,
  isDisabled = false,
  className,
  ...props
}: ButtonProps) {
  const pending = loading || isPending;

  return (
    <AriaButton
      {...props}
      className={cx("ds-button", `ds-button--${variant}`, `ds-button--${size}`, className)}
      isDisabled={isDisabled || pending}
      isPending={pending}
    >
      {pending && <Spinner size="sm" label="Loading" ariaHidden />}
      <span>{children}</span>
    </AriaButton>
  );
}

export type IconButtonProps = Omit<ButtonProps, "children" | "aria-label"> & {
  children: ReactNode;
  label: string;
};

export function IconButton({ label, children, ...props }: IconButtonProps) {
  return (
    <Button {...props} aria-label={label} className={cx("ds-icon-button", props.className)}>
      {children}
    </Button>
  );
}
