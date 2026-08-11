"use client";

import type { ReactNode } from "react";
import {
  Menu as AriaMenu,
  MenuItem as AriaMenuItem,
  MenuTrigger as AriaMenuTrigger,
  Popover,
  Tab as AriaTab,
  TabList as AriaTabList,
  TabPanel as AriaTabPanel,
  Tabs as AriaTabs,
  type TabListProps as AriaTabListProps,
  type TabPanelProps as AriaTabPanelProps,
  type TabProps as AriaTabProps,
  type TabsProps as AriaTabsProps,
} from "react-aria-components";

import { Button } from "@/design-system/components/button";
import { cx } from "@/design-system/utils/cx";

export type TabsProps = AriaTabsProps & {
  className?: string;
};

export function Tabs({ className, ...props }: TabsProps) {
  return <AriaTabs {...props} className={cx("ds-tabs", className)} />;
}

export type TabListProps<T> = Omit<AriaTabListProps<T>, "className"> & {
  className?: string;
};

export function TabList<T>({ className, ...props }: TabListProps<T>) {
  return <AriaTabList {...props} className={cx("ds-tab-list", className)} />;
}

export type TabProps = Omit<AriaTabProps, "className"> & {
  className?: string;
};

export function Tab({ className, ...props }: TabProps) {
  return <AriaTab {...props} className={cx("ds-tab", className)} />;
}

export type TabPanelProps = Omit<AriaTabPanelProps, "className"> & {
  className?: string;
};

export function TabPanel({ className, ...props }: TabPanelProps) {
  return <AriaTabPanel {...props} className={cx("ds-tab-panel", className)} />;
}

export type DropdownMenuItem = {
  id: string;
  label: string;
  isDisabled?: boolean;
};

type DropdownMenuProps = {
  label: string;
  items: readonly DropdownMenuItem[];
  onAction?: (id: string) => void;
  trigger?: ReactNode;
  className?: string;
};

export function DropdownMenu({ label, items, onAction, trigger, className }: DropdownMenuProps) {
  return (
    <AriaMenuTrigger>
      {trigger ?? (
        <Button variant="ghost" aria-label={label}>
          {label}
        </Button>
      )}
      <Popover className={cx("ds-menu-popover", className)}>
        <AriaMenu
          items={items}
          aria-label={label}
          className="ds-menu"
          onAction={(key) => onAction?.(String(key))}
        >
          {(item) => (
            <AriaMenuItem id={item.id} isDisabled={item.isDisabled} className="ds-menu-item">
              {item.label}
            </AriaMenuItem>
          )}
        </AriaMenu>
      </Popover>
    </AriaMenuTrigger>
  );
}
