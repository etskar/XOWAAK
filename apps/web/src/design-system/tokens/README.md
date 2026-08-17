# Design Tokens

The token layers in this directory:

- `tokens.css` contains the runtime CSS variables and theme values (light + dark).
- `primitives.ts` exposes the raw brand, spacing, motion, and breakpoint values.
- `semantic.ts` exposes semantic CSS variable references.
- `component.ts` exposes component token references.
- `product.ts` reserves product-level token references without product logic.

Phase 1 added: `--color-text-strong`, `--color-surface-inset`, `--color-border-action`,
`--color-on-success/warning/danger/info`, typography weight/tracking tokens, and a responsive
heading scale (see `ARTIFACTS.md`).
