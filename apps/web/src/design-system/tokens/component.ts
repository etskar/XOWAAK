export const componentTokens = {
  button: {
    heightSmall: "var(--button-height-sm)",
    heightMedium: "var(--button-height-md)",
    heightLarge: "var(--button-height-lg)",
  },
  input: {
    height: "var(--input-height)",
    paddingInline: "var(--input-padding-inline)",
  },
  card: {
    padding: "var(--card-padding)",
  },
  dialog: {
    maxWidth: "var(--dialog-max-width)",
  },
  navigation: {
    indicatorSize: "var(--tabs-indicator-size)",
  },
  avatar: {
    small: "var(--avatar-size-sm)",
    medium: "var(--avatar-size-md)",
    large: "var(--avatar-size-lg)",
  },
  badge: {
    height: "var(--badge-height)",
  },
  tabs: {
    indicatorSize: "var(--tabs-indicator-size)",
  },
} as const;
