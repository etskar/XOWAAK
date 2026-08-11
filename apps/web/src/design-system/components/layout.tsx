import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

import { cx } from "@/design-system/utils/cx";
import { spaceVar, type SpaceScale } from "@/design-system/utils/tokens";

type LayoutElement = "div" | "main" | "section" | "nav" | "ul" | "ol";

type LayoutProps = HTMLAttributes<HTMLElement> & {
  as?: LayoutElement;
  children?: ReactNode;
};

function renderLayoutElement(as: LayoutElement, className: string, props: LayoutProps) {
  const { children, ...rest } = props;
  const Component = as;

  return (
    <Component {...rest} className={className}>
      {children}
    </Component>
  );
}

type ContainerProps = LayoutProps & {
  size?: "sm" | "md" | "lg" | "xl" | "full";
};

export function Container({ as = "div", size = "lg", className, ...props }: ContainerProps) {
  return renderLayoutElement(as, cx("ds-container", `ds-container--${size}`, className), props);
}

type StackProps = LayoutProps & {
  gap?: SpaceScale;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between";
};

export function Stack({
  as = "div",
  gap = 4,
  align = "stretch",
  justify = "start",
  className,
  style,
  ...props
}: StackProps) {
  const layoutStyle = {
    ...style,
    "--layout-gap": spaceVar(gap),
  } as CSSProperties;

  return renderLayoutElement(
    as,
    cx("ds-stack", `ds-stack--align-${align}`, `ds-stack--justify-${justify}`, className),
    { ...props, style: layoutStyle },
  );
}

type InlineProps = LayoutProps & {
  gap?: SpaceScale;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between";
  wrap?: boolean;
};

export function Inline({
  as = "div",
  gap = 3,
  align = "center",
  justify = "start",
  wrap = true,
  className,
  style,
  ...props
}: InlineProps) {
  const layoutStyle = {
    ...style,
    "--layout-gap": spaceVar(gap),
  } as CSSProperties;

  return renderLayoutElement(
    as,
    cx(
      "ds-inline",
      `ds-inline--align-${align}`,
      `ds-inline--justify-${justify}`,
      wrap && "ds-inline--wrap",
      className,
    ),
    { ...props, style: layoutStyle },
  );
}

type GridProps = LayoutProps & {
  gap?: SpaceScale;
  columns?: 1 | 2 | 3 | 4;
};

export function Grid({ as = "div", gap = 4, columns = 1, className, style, ...props }: GridProps) {
  const layoutStyle = {
    ...style,
    "--layout-gap": spaceVar(gap),
  } as CSSProperties;

  return renderLayoutElement(as, cx("ds-grid", `ds-grid--columns-${columns}`, className), {
    ...props,
    style: layoutStyle,
  });
}

type SectionProps = LayoutProps & {
  spacing?: "none" | "sm" | "md" | "lg";
};

export function Section({ as = "section", spacing = "md", className, ...props }: SectionProps) {
  return renderLayoutElement(as, cx("ds-section", `ds-section--${spacing}`, className), props);
}
