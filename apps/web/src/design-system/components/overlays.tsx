"use client";

import type { ReactElement, ReactNode } from "react";
import {
  Button as AriaButton,
  Dialog as AriaDialog,
  DialogTrigger as AriaDialogTrigger,
  Heading as AriaHeading,
  Modal as AriaModal,
  ModalOverlay as AriaModalOverlay,
  Tooltip as AriaTooltip,
  TooltipTrigger as AriaTooltipTrigger,
} from "react-aria-components";

import { cx } from "@/design-system/utils/cx";

type OverlayContentProps = {
  trigger: ReactElement;
  title: string;
  children: ReactNode;
  isDismissable?: boolean;
  className?: string;
  closeLabel?: string;
};

export function Dialog({
  trigger,
  title,
  children,
  isDismissable = true,
  className,
  closeLabel = "Close",
}: OverlayContentProps) {
  return (
    <AriaDialogTrigger>
      {trigger}
      <AriaModalOverlay className="ds-modal-overlay" isDismissable={isDismissable}>
        <AriaModal className={cx("ds-dialog", className)}>
          <AriaDialog aria-label={title} className="ds-dialog__content">
            {({ close }) => (
              <>
                <div className="ds-dialog__header">
                  <AriaHeading slot="title" className="ds-dialog__title">
                    {title}
                  </AriaHeading>
                  <AriaButton className="ds-dialog__close" onPress={close} aria-label={closeLabel}>
                    {closeLabel}
                  </AriaButton>
                </div>
                <div className="ds-dialog__body">{children}</div>
              </>
            )}
          </AriaDialog>
        </AriaModal>
      </AriaModalOverlay>
    </AriaDialogTrigger>
  );
}

export type SheetSide = "start" | "end" | "bottom";

type SheetProps = OverlayContentProps & {
  side?: SheetSide;
};

export function Sheet({
  trigger,
  title,
  children,
  isDismissable = true,
  side = "end",
  className,
  closeLabel = "Close",
}: SheetProps) {
  return (
    <AriaDialogTrigger>
      {trigger}
      <AriaModalOverlay className="ds-modal-overlay" isDismissable={isDismissable}>
        <AriaModal className={cx("ds-sheet", `ds-sheet--${side}`, className)}>
          <AriaDialog aria-label={title} className="ds-dialog__content">
            {({ close }) => (
              <>
                <div className="ds-dialog__header">
                  <AriaHeading slot="title" className="ds-dialog__title">
                    {title}
                  </AriaHeading>
                  <AriaButton className="ds-dialog__close" onPress={close} aria-label={closeLabel}>
                    {closeLabel}
                  </AriaButton>
                </div>
                <div className="ds-dialog__body">{children}</div>
              </>
            )}
          </AriaDialog>
        </AriaModal>
      </AriaModalOverlay>
    </AriaDialogTrigger>
  );
}

type TooltipProps = {
  label: string;
  children: ReactElement;
};

export function Tooltip({ label, children }: TooltipProps) {
  return (
    <AriaTooltipTrigger>
      {children}
      <AriaTooltip className="ds-tooltip">{label}</AriaTooltip>
    </AriaTooltipTrigger>
  );
}
