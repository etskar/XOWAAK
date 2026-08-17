# XOWAAK — Artifacts & Findings

## Stage: Phase 2 — Public Website / Landing Experience Redesign — Complete

### What was built

Polished the entire public website (landing + public discovery/detail/auth pages) on top of the Phase 1 design system, following the reference (imgur) for general visual principles only — clean composition, strong hierarchy, content-first layout, polished cards, simple navigation, professional spacing, clear CTAs, mobile-first responsiveness. XOWAAK keeps its own brand and architecture; nothing was copied.

- **Public header & footer** — already met the target in the earlier landing phase and were kept: public header = brand (→ landing) + locale switcher + "Sign in"/"Create account", or "Open XOWAAK" when authenticated; no hamburger/dark-mode/install/search. Footer stays light (brand, tagline, locale switcher, About/Discover + Sign in/Create account, copyright) with no internal navigation.
- **Hero** — kept (already compact, rotating-word headline with sr-only fallback + reduced-motion handling, real-data floating cards, no fake stats/testimonials).
- **Landing content cards** (`showcase-page.tsx` + `showcase.css`):
  - Product cards now show a category chip and fall back to the owner's `@username` when no location exists (was: section eyebrow text).
  - Job cards fall back to the employer name when no location exists.
  - Discovery CTAs are no longer identical: Marketplace → `showcase-button--primary` (high contrast), Services → `secondary`, Jobs → new `showcase-button--outline` (border-action border, transparent fill, primary hover) — all inside the same Phase 1 token/button language.
- **Explore page** (`explore-view.tsx` + `globals.css`): replaced text arrows ("→") with inline SVG arrows that flip in RTL; "Browse all" links are now inline-flex with proper gap; group card link uses the same arrow treatment.
- **Detail pages** (`platform-view.tsx` + `globals.css`): one shared visual language across products/services/jobs/groups already existed (visual header + kind badge + chips + action panel + description + related content); this phase added a polished owner footer — `Avatar` + display name + `@username` linked to the public profile — replacing the bare text link.
- **Back control**: detail pages, public profiles, and the public followers/following pages now use the shared `BackLink` (chevron icon + localized label, browser-history aware, RTL-flipped) instead of bare text links; removed dead `.platform-back-link` and `.social-list-page__topline a` CSS. `common.backToHome` remains used by not-found/error/route-placeholder/admin/settings pages.
- **Auth pages**: already minimal (identifier/password with show-hide toggle, name/username/email/password on sign-up, necessary links only); no changes required — verified in EN + AR.
- **Real-data behavior**: landing, directories, explore, details, and profiles render only real DB records (published, non-deleted); every list falls back to a localized empty state; no fake content, stats, or users exist anywhere. (This environment's database contains real seed records, so live cards render; with an empty database the empty states appear instead.)
- **RTL**: arrows flip correctly in all new controls (landing card links, section CTAs, explore arrows, back chevron); Arabic heading typography from Phase 1 applies on every public page; verified `dir="rtl"` on all `/ar` pages.
- **Cleanup**: removed dead public CSS — `.landing-card__badge`, `.landing-hero__note`, `.landing-hero__note-dot`, `.landing-section--cta`, `.platform-back-link` (all verified unused in components). Left internal-app dead selectors alone (`.site-nav--desktop` etc. belong to app CSS). The two remaining "→" text arrows live in internal components (`post-media.tsx`, `search-bar.tsx`) — out of Phase 2 scope.

### Verification

- `npx tsc --noEmit` — clean.
- `npx eslint . --max-warnings=0` — 0 errors / 0 warnings.
- `npx vitest run` — 15 files / 41 tests passed.
- `npm run build` — compiled; 291 pages generated.
- Production runtime (`next start`), after ensuring the old dev server was fully killed (first check hit a stale listener on port 3100 — re-verified against the new build):
  - `/en`, `/ar` (landing: public header, hero, offers, marketplace/services/jobs with real cards, unified, CTA, footer), `/en/about`, `/ar/about` — 200.
  - `/en|ar/auth/sign-in`, `/en|ar/auth/sign-up` — 200 with auth card + password toggle.
  - `/en|ar/products|services|jobs|groups`, `/en|ar/explore` — 200, real sections, no empty state.
  - Detail pages with real IDs (product EN+AR, job EN, group EN) — 200, back control present, actions/related/sign-in card present.
  - Unknown-record detail IDs — 200 with in-page localized empty state (not a 404); `/en|ar/home` — 307 to sign-in (expected).
  - Public profile (`/en/u/prompt4primary`) — 200 with back control, hero, tabs, metrics.
  - Public followers/following (`/en/u/prompt4primary/followers`, `/ar/u/prompt4primary/following`) — 200, RTL correct, back control present.
  - Built CSS contains the new selectors (`showcase-button--outline`, `explore-section__more`, `platform-detail-card__owner`, RTL arrow flips) and no longer contains the removed dead rules.

### Remaining limitations

- Real browser viewport testing (320/375/390/430/tablet/desktop) was verified structurally (grid breakpoints, full-width buttons, hidden decorative hero cards, `overflow-x: clip` + `min-width: 320px` present) but not via an automated browser suite in this environment.
- `getLocationRecords` and `searchPlatform` hardcode `/en/...` hrefs — they are used by the authenticated map/search pages, so they were left untouched per Phase 2 scope (internal app).
- Playwright e2e suite still requires a running server + Supabase credentials to execute.

## Stage: Phase 1 — Unified Design System + Reference-Inspired UI Foundation — Complete

### What was built

A foundation-only phase (no page redesigns, no backend changes) that unifies and sharpens the existing visual system with principles inspired by the reference website (imgur): clean, content-focused, professional, balanced, generous spacing, strong typography, simple navigation, polished lightweight interactions. Nothing was copied from the reference — XOWAAK keeps its own brand (green/cyan/indigo gradient, brand-ink/lime) and all existing architecture.

- **Color system** (`src/design-system/tokens/tokens.css`):
  - New semantic tokens: `--color-text-strong`, `--color-surface-inset` (inset surfaces: search bars, subtle panels), `--color-border-action` (stronger interactive borders), and on-color tokens for feedback: `--color-on-success/on-warning/on-danger/on-info` (white in light mode, brand-ink in dark mode).
  - **Contrast fixes**: destructive buttons in dark mode previously rendered light-error text on a light background (invisible) — now `--color-on-danger` is used; outline buttons use `--color-border-action` (neutral-400) instead of the too-close neutral-300; ghost-button hover is a neutral 7% tint (was `--color-surface-elevated` = invisible on white surfaces); user-menu hover likewise uses a text tint instead of `--color-background`.
  - Light + dark theme blocks both updated; theme functionality (appearance settings + localStorage) untouched.
- **Typography** (`tokens.css` + `globals.css` + `components.css`):
  - Single-family system: `--font-family-display` now resolves to the sans stack (was Arial-only), with dedicated tracking tokens `--font-letter-heading: -0.02em` and `--font-letter-display: -0.03em` applied to `.ds-text-display/h1/h2/h3/h4` and global `h1–h4`.
  - Responsive heading clamps reduced (no giant mobile headings): display `clamp(2rem, 6vw, 3.5rem)`, h1 `clamp(1.75rem, 4.5vw, 2.875rem)`, h2 `clamp(1.5rem, 3.5vw, 2.25rem)`, h3 `clamp(1.25rem, 2.5vw, 1.75rem)`, h4 `1.125rem`.
  - Font-weight tokens added (`--font-weight-regular…extrabold`).
  - **Arabic (RTL)**: `[lang="ar"]` resets letter-spacing to 0 and relaxes heading line-heights (1.3 for display/h1, 1.4 for h2–h4) for readable diacritics.
- **Button system** (`components.css`): all seven variants present (primary/secondary/outline/ghost/destructive + icon-only + loading/disabled states already in `button.tsx`). Phase 1 refinements: destructive text contrast fix, outline/ghost hover visibility, icon buttons now square (`width` = `--button-height-*`), pressed/active feedback via `data-pressed`, hover/active/focus-visible/disabled states on every variant.
- **Card system** (`display.tsx` + `components.css`): new variants exposed through the `Card` component — `elevated` (existing), plus `flush` (media cards, no padding), `subtle` (tinted panel), and `interactive` (hover lift + border tint + focus-visible ring). `CardVariant` type exported from the design-system barrel.
- **Inputs/menus/tabs**: input/textarea caret color set to primary, hover border now `--color-border-action`; menu/listbox items gained a keyboard `data-focus-visible` ring; tabs got a hover state; switches already RTL-aware.
- **Interaction language**: subtle transitions use the existing motion tokens; `@media (prefers-reduced-motion: reduce)` extended to cards and tabs; global reduced-motion override already present in `globals.css` covers everything.
- **Navigation foundation** (`navigation.css`): `.site-action` gained transitions + press feedback (`scale(0.97)`), quiet action hover now has a visible tint, primary action hover gets a primary glow; search bar uses the new inset surface with a hover border; header remains sticky with blur, public vs app modes unchanged and distinct.
- **No i18n changes** (no new user-facing strings), no new dependencies, no JS added (CSS-only + one prop on `Card`).

### Verification

- `npx tsc --noEmit` — clean.
- `npx eslint . --max-warnings=0` — 0 errors / 0 warnings.
- `npx vitest run` — 15 files / 41 tests passed (design-system component tests green after the `Card` API change).
- `npm run build` — compiled; 291 pages generated; all routes present.
- Runtime smoke with `next start` (production build): `/en`, `/ar` (lang=ar + dir=rtl), `/en/about`, `/en/explore`, `/en/auth/sign-in`, `/en/auth/sign-up`, `/en/products`, `/ar/products`, `/en/services`, `/en/jobs`, `/en/groups`, `/en/posts/[id]`, `/en/u/example`, `/ar/u/example` — all 200; `/en/home`, `/en/settings`, `/en/messages`, `/ar/home` — 307 to sign-in.
- Built CSS inspected: new tokens (`--color-border-action`, `--color-surface-inset`, `--color-on-danger`), `[lang=ar]` rules, `.ds-card--interactive`, and `.ds-button--sm.ds-icon-button` all present; dark-theme block intact.

### Known limitations / follow-ups

- No web fonts are loaded (system stack only) — a future phase could add `next/font` (needs network at build).
- E2E Playwright suite updated in earlier phases but not run in this environment (requires a running server + Supabase credentials).
- The landing hero keeps its own tuned clamp (intentionally large display heading, not token-driven).

## Stage: Public Landing Website — Complete

### What was built

A full redesign of the public landing website (single page) — professional, calm, consistent with the app's design system. The app interior was not touched.

- **Structure** (single page): Header → Hero → What XOWAAK Offers (6 tiles) → Social/Posts → Marketplace → Services → Jobs → Groups → Messaging → Unified Experience → Final CTA → Footer.
- **Header**: on the landing only the logo (`BrandMark` + word) and the language switcher remain (`site-header--landing` branch in `site-header.tsx`); nav, install button, theme toggle, auth actions and hamburger/mobile nav are all hidden on the landing (`!isApp && !isLanding` guards).
- **Footer**: now also contains a compact language switcher next to the tagline (`SiteFooter`), wrapped in `<Suspense>` in `app/[locale]/layout.tsx` because `LocaleSwitcher` calls `useSearchParams` (required for static prerender of auth pages).
- **Hero** (compact, not oversized): eyebrow badge, short title + description, "Create account" (primary) + "Sign in" (secondary) buttons, small availability note, and a visual composition on the right — floating product card, post card, chat bubbles and a platform pill with the four categories; floating animation, `prefers-reduced-motion` respected.
- **Real data everywhere it's available** (anonymous queries): products (4), services (4), jobs (4), groups (4) via `getProducts/getServices/getJobs/getGroups(4)` + latest posts via `getPostsPage(0, 2)`; detail cards link to the public detail pages; job cards show employer + localized job-type chip; salary shown only when set. When a dataset is empty, a clearly-labeled demo fallback grid renders instead (3 localized demo cards with a neutral "demo" badge, links to the browse pages, not detail pages).
- **Offers section**: 6 tiles (Social, Marketplace, Services, Jobs, Groups, Messaging) with inline SVG glyphs (no emojis anywhere) + scroll links to the matching section.
- **Messaging section**: illustrative chat mock (localized sample messages) with a sign-in CTA.
- **Unified section**: pills for the five pillars + short pitch.
- **Final CTA**: "Ready to explore XOWAAK?" + Create account + Sign in.
- **About page** (`/{locale}/about`, reuses `ShowcasePage mode="about"`): about + identity/privacy/social features + final CTA.
- **i18n**: `src/i18n/landing-messages.ts` fully rebuilt for all 8 locales (en, ar, es, fr, de, tr, pt, zh) with a new structure (`hero/offers/social/marketplace/services/jobs/groups/messaging/unified/finalCta/about/features/footer/demo`), generated by a one-off Node script (stored under the temp opencode dir) and verified byte-exact for Arabic.
- **SEO**: page-level `generateMetadata` on `app/[locale]/(public)/page.tsx` — localized title + description, canonical `/{locale}`, OpenGraph and Twitter tags (icons come from the existing layout metadata).
- **Accessibility**: semantic sections with ids + `aria-labelledby` via `SectionHeading` (ids also give `scroll-margin-top`), `sr-only`/`aria-hidden` on decorative visuals, focus-visible rings, `dir="auto"` on user-generated text, keyboard-operable cards (real links).
- **Motion** (light): `Reveal` fade/slide on scroll with staggered delays, gentle float for hero cards, all disabled under `prefers-reduced-motion`.
- **CSS**: `showcase.css` rewritten — kept `.showcase-page`, `.showcase-eyebrow`, `.showcase-actions`, `.showcase-button*` (primary/secondary/quiet), `.product-state-*`, `.admin-*`; added the `.landing-*` block; removed the obsolete `.landing-marketplace-*` rules from `globals.css`.

### Verification

- `npx tsc --noEmit` — clean.
- `npx eslint` on showcase, navigation, auth-shell, admin-dashboard, landing-messages, landing page — 0 errors.
- `npx vitest run` — 15 files / 41 tests passed.
- `npm run build` — compiled + prerendered successfully (auth pages needed the Suspense fix above; the landing is dynamic by design because it serves live data).
- Runtime smoke checks with `next start`: `/en` and `/ar` (dir=rtl, Arabic strings byte-exact), `/en/about`, `/en/auth/sign-in` — all 200; real data cards render (4 per section), demo fallbacks correctly absent when data exists.

### Known limitations / follow-ups

- The landing is server-rendered per request (dynamic) because its data queries need the Supabase cookie client; no static prerender caching for `/` (fine for SEO — full HTML is still returned).
- No official logo/OG image asset exists in the repo, so the header/footer reuse the existing `BrandMark` and the site metadata reuses the existing icons config; no new logo was invented.
- Demo fallbacks only appear when the corresponding dataset is empty; a future "always demo" or admin toggle could be added if desired.

## Stage: Interior Design & UX Polish — Complete

### What was built

Design-only polish across the authenticated interior (and shared surfaces) — no business logic or backend changes.

- **Design tokens** (`tokens.css`): added `--color-danger` (alias of `--color-error`) and `--shadow-xl` for light + dark; replaced stale `--color-surface-raised` usage with `--color-surface-elevated` in `globals.css`.
- **CSS cleanup** (`globals.css`, ~3.3k lines): removed dead rules (`.page-shell`, `.page-card` + `h1/p`, `.eyebrow`, `.button`, `.loading-bar` — kept `.loading-card`, still used by the loading route); merged duplicate `.profile-metrics` / `.profile-summary__identity` blocks; `reduced-motion` block retained at end of file.
- **Home / Feed**:
  - `feed-view.tsx`: removed the duplicate "EmptyState" card and the redundant status badge from the home header (error/unavailable now handled with `ErrorState` + a compact warning card).
  - `feed-stream.tsx`: new empty state — X mark (`feed-empty__mark`) + "Browse the marketplace" action link.
  - `feed-cards.tsx`: full redesign of `PlatformFeedCard` — image-first layout, kind chip (`feed-card__kind`: Product/Service/Job), price/salary amount, job type label + location, date, owner link, favorite action (auth-aware), kind-labeled link button; status badge removed.
- **Marketplace / Directory**:
  - `PlatformCard` redesign (image-first, kind chip, price/location/member count, actions) in `platform-view.tsx`; new client `MarketplaceGrid` (`marketplace-grid.tsx`) replaces the inline grid on `/marketplace` with a category filter (`marketplace-filter` select).
  - `PlatformDetail` restructured hierarchy: hero visual (16/7) → title → key-info chips (price/salary range, job type, location, employer, member count) → actions (order/apply/message/favorite) → description → owner footer → sign-in card for anonymous → "Related" section (3 items across products/services/jobs/groups via `getProducts/getServices/getJobs/getGroups(9)`).
  - `SearchExperience` tabs: All / Users / Posts / Products / Services / Jobs / Groups with live result counts.
- **Navigation**:
  - `AppBottomNav` active state now prefix-matches (Home exact; Marketplace also covers `/products` + `/services`) with a pop animation and bolder active label.
  - `UserMenu` popover: solid elevated surface, `menu-pop-in` animation (RTL-aware transform-origin), entries trimmed to Profile / Edit profile / Language / Appearance / Help (→ settings) / Logout.
  - FAB: full-screen backdrop, staggered option entrance (40 ms per item), `aria-haspopup` + expanded state, slide-up animations.
  - Search bar: live suggestions dropdown — 250 ms debounce, grouped results (max 3 per category), avatars, loading/empty/error states, "View all results" link, Escape + outside-click dismissal, `aria-controls`/`aria-autocomplete`.
- **Messaging**: list rows with counterpart avatar + identity + preview + date; thread bubbles differentiated by `senderId === otherUserId` (own = gradient); single-pane mobile layout (≤40rem) with a back button; group chat gets `viewerId` so the viewer's own messages use the same bubble styling.
- **Posts**: comments redesigned — avatar + name/@username/time meta + body; lightbox upgrade — body scroll lock, arrow-key navigation, close button, `aria-label`s, fade/zoom animations, `key` reset on image change.
- **Orders**: section headings with count badges; order/application rows show counterpart avatar + `@username` + status + date.
- **Profile**: cover gets a fixed 21/6 aspect ratio with the avatar overlapping it (ring + shadow); `showcase-button--quiet` added for the secondary "Settings" link.
- **Settings**: nav links are now active-state aware (`aria-current="page"` + gradient pill) via a client `SettingsShell`.
- **i18n** (all 8 locales: en, ar, es, fr, de, tr, pt, zh): `app-messages.ts` +9 keys (`kindProduct/kindService/kindJob/kindGroup/relatedContent/viewAll/searchAll/categoryFilter/allCategories`), `messaging-messages.ts` +2 (`back/you`), `messages/{locale}/posts.ts` +3 (`previous/next/close`). Arabic values verified byte-exact (console garbling was display-only).
- **Minor**: removed the stale "Unavailable" badge from the search page header; unused-variable cleanup (feed-cards/feed-view).

### Verification

- `npx tsc --noEmit` — clean (run after every batch).
- `npx eslint` on all touched feature dirs + pages — 0 errors / 0 warnings.
- `npx vitest run` — 15 files / 41 tests passed.
- `npm run build` — compiled successfully; all routes present.

### Known limitations / follow-ups

- `--color-danger` usages (e.g. `commerce-panel__error`) previously referenced an undefined token; now defined in tokens.css.
- PWA icons still the default mark (no image tooling in this environment).
- No backend or business-logic changes were made in this stage.

---

## Stage: Commerce Requests Pipeline (Orders + Job Applications) — Complete

### What was built

- **Database** (`supabase/migrations/20260814000009_commerce_requests.sql`, pushed live):
  - `orders` table — requester → product/service with optional message, price/currency snapshot at request time, status flow `pending → accepted → declined / cancelled / completed`.
  - `job_applications` table — applicant → job with optional message, status flow `pending → shortlisted → hired`, `pending → rejected`, `pending → withdrawn`.
  - Unique partial indexes prevent duplicate pending requests per (requester, target).
  - RLS: owners + requesters can select their records; insert requires `requester = auth.uid()`, target visible, and target owner ≠ requester (self-ordering blocked).
  - Status transitions only via SECURITY DEFINER functions `update_order_status` / `update_job_application_status` (owner: accept/decline/complete/shortlist/reject/hire; requester/applicant: cancel/withdraw from pending only; `resolved_at` set on terminal states).
  - Triggers notify the record owner on new order/application and the requester/applicant on acceptance/decline/shortlist/hire; `notifications_kind_check` extended with `order` + `application`.
- **Server layer**: `src/server/platform/commerce-actions.ts` (zod-validated actions: `createOrder`, `createJobApplication`, `updateOrderStatus`, `updateJobApplicationStatus`) and `src/server/platform/order-queries.ts` (`getOrderCenter` — incoming/sent orders and applications with titles, prices, counterpart profiles).
- **UI**:
  - `CommerceActionPanel` (client) on product/service/job detail pages — logged-in users get a real order/request/apply form (optional message, conflict + error handling, success state with "Continue in messages" + "View orders"); anonymous visitors still get the sign-in CTA.
  - Orders center `(app)/orders` — four sections (incoming orders, your orders, applications received, your applications) with role-aware action buttons (accept/decline/mark completed, cancel, shortlist/reject/hire, withdraw).
  - Group detail pages no longer show a misleading "Order product" button (primary action is now "Message seller").
  - "Orders & applications" link added to the account menu; ~34 new i18n keys × 8 locales.
- **Live E2E verification** (PostgREST + Admin API, since cleaned up): two real accounts exercised the full loop — order placed → duplicate pending rejected (409) → self-order blocked (403) → requester cannot accept → owner accepts/completes → notifications delivered (`New order request` / `Order accepted`); job apply → duplicate rejected → shortlist → withdraw-after-shortlist blocked → hire → `You were shortlisted` / `You were hired` notifications.

### Verification

- `npx tsc --noEmit` — clean.
- `npx eslint` on new/changed files — 0 errors.
- `npx vitest run` — 15 files / 41 tests passed.
- `npm run build` — compiled successfully; `/[locale]/orders` present.
- Migration pushed to the remote Supabase project; helper functions verified via `supabase db query`; test records fully removed (0 rows left in `orders` / `job_applications`).

### Known limitations / follow-ups

- Order completion only closes the order — no payment/escrow integration (out of scope for this prompt).
- Accepted orders have no per-message thread; follow-up happens in direct messages.
- PWA icons still the default mark (no image tooling in this environment).

---

## Stage: Landing Website (Marketing + Public Browse) — Complete

### What was built

- **Public browse routes**: `/products`, `/services`, `/jobs`, `/groups` (+ detail pages) moved out of the authenticated `(app)` group into the public `(public)` group — same URLs, now reachable without an account. RLS verified live: anon role reads published records on all four tables (via `can_view_platform_record` granted to `anon`).
- **Anonymous-aware platform views** (`platform-view.tsx`): `PlatformDirectory`/`PlatformDetail` take `user: User | null`; favorite buttons hidden for anonymous visitors; order/request/apply/message CTAs redirect anonymous users to sign-in (`?next=<detail path>`); a `platform-signin-card` prompt is shown on detail pages; group chat + members render only for authenticated users.
- **Explore page** (`/explore`): real public directory — sections for products/services/jobs/groups with latest items (anon queries) and "Browse all" links; group cards with member counts.
- **Landing page**: new "Live marketplace" section (latest products/services/jobs with prices, images, owner) + "Browse all"/"Sign in to order" CTAs; ecosystem cards for products/services/jobs updated from "Vision" to "Current" in all 8 locales; new `marketplace.*` landing keys in all 8 locales.
- **Post detail** (`/posts/[id]`, already public): like/share/comment controls now degrade for anonymous viewers (counts only + sign-in link); new `PostCard`/`PostEngagement` `isAuthenticated` prop.
- **Header** (`SiteHeaderContainer`): server wrapper fetches the session once per request; `UserMenu` shows Sign in / Create account buttons instead of the account menu for anonymous visitors (also fixes broken menu links on public pages).
- **Dead CSS removed** from `globals.css`: `create-action`, `feed-page__layout/main/aside`, `feed-platform-directory/tile` (+ media-query references).

### Verification

- `npx tsc --noEmit` — clean (after clearing stale `.next` route types).
- `npx eslint .` — 0 errors (1 pre-existing warning in e2e spec).
- `npx vitest run` — 15 files / 41 tests passed.
- `npm run build` — compiled successfully; all routes present (products/services/jobs/groups now under the public group).
- Live anon PostgREST check: published products/services/jobs/groups all readable by the `anon` role.

### Known limitations / follow-ups

- Anonymous visitors can browse and view details but ordering/applying still requires sign-in (now backed by the real orders/job-applications pipeline — see the commerce stage above).
- PWA icons still the default mark (no image tooling in this environment).
- No visual regression against a running dev server (build + type + unit + anon API checks only).

---

## Stage: App Reorganization (Mobile-First) — Phase 1

Status: **Complete** (landing website deferred per scope).

### What was built

- **Unified feed** (`app/[locale]/(app)/home`): server-rendered `getUnifiedFeed` (posts + products + services + jobs) with client-side infinite scroll via `loadMoreFeed` server action. Cursor is base64-encoded on the server because the browser client cannot use Node's `Buffer`.
- **New feed components** (`src/features/feed/`): `feed-view.tsx` (header + stream + empty/error states), `feed-stream.tsx` (load-more button, busy/error/end statuses), `feed-cards.tsx` (`PlatformFeedCard` with kind-specific visuals, price, location, favorite, "View details" link).
- **FAB** (`src/features/posts/fab.tsx`): floating create menu (post/product/service/job/group) on the home feed only; hidden on desktop (bottom nav + toolbar cover creation).
- **Bottom navigation** (`src/features/navigation/app-navigation.tsx`): 6 tabs (Home, Marketplace, Groups, Jobs, Messages, Profile) with inline SVG icons, active state, mobile bottom bar (desktop = top bar).
- **User menu** (`user-menu.tsx` + `menu-registry.tsx`): My profile, Edit profile, Language, Appearance, Sign out; single-open menu with outside-click and Escape handling.
- **Search bar** (`search-bar.tsx`): pushes `/{locale}/search?q=...`.
- **Marketplace** (`app/[locale]/(app)/marketplace`): Products/Services tabs using `PlatformFeedCard`.
- **Own profile** (`app/[locale]/(app)/profile`): ProfileView with `isOwnProfile`, cover image, Edit profile / Settings actions.
- **Settings reorganization**: hub page (8 cards) + dedicated Language / Appearance / Notifications pages; `NotificationPreferencesForm` persists `user_settings.notification_preferences` through `updateNotificationPreferences`.
- **Edit profile**: cover image upload (bucket `covers`) with local preview via `onLocalPreview` and remove-cover control.
- **Auth**: sign-in accepts email **or username** (resolved via `resolveUsernameToEmail`); sign-up collects name + username with availability check (`isUsernameAvailable` + `createProfileOnSignup`); username regex `/^[a-z0-9._-]{3,32}$/`; show/hide password toggle with inline SVG icons (no emoji); rate-limit and user-not-found error mappings.
- **Post media lightbox**: click image → fullscreen viewer with prev/next and Escape; `loading="lazy"` on feed images.
- **Platform detail CTAs**: order/request/apply + "Message seller" open a DM with that user (`/messages?open=<username>`), plus Web Share / clipboard-copy share button.
- **Dead code removed**: `create-action.tsx`, old `features/posts/feed-view.tsx`.

### i18n

All new keys added to `app-messages.ts`, `auth-messages.ts`, `identity-messages.ts` for **all 8 locales** (en, ar, es, fr, de, tr, pt, ja), including `common.name/username/identifier`, `showPassword/hidePassword`, validation messages (`usernameInvalid`, `usernameTaken`, ...), `errors.rateLimited/userNotFound`, nav labels, profile `cover/coverUnavailable/removeCover`, `loadMore`, and settings hub entries.

**Caution:** PowerShell 5.1 `Set-Content` corrupted Arabic/UTF-8 strings to `?????`. Always use the edit/write tools (UTF-8) for i18n files. `app-messages.ts` had to be fully rewritten after one such corruption.

### Verification

- `npx tsc --noEmit` — clean.
- `npx eslint .` — 0 errors (1 pre-existing warning in `tests/e2e/prompt4-real-account.spec.ts`).
- `npx vitest run` — 15 files / 41 tests passed (auth test updated for name/username schema).
- `npm run build` — compiled successfully, 283 static pages, all app routes present (including new `/settings/language`, `/settings/appearance`, `/settings/notifications`, `/marketplace`, `/profile`, `/posts/new`).

### Known limitations / follow-ups

- DM CTA buttons open a conversation but do not yet prefill a message or simulate an order; the actual order/booking pipeline is a later stage.
- Comment counts/listings on the feed use the card inline view; the full comment thread lives on the post detail page (`showComments`).
- `mailer_autoconfirm` still requires Dashboard change (no Management API token); the in-app Admin API fallback works.
- Old unused CSS blocks (create-action, feed-page aside/composer) remain in `globals.css`; harmless, can be pruned later.
- No visual regression run against a running dev server was performed in this stage (build + type + unit tests only).

---

## Stage: Landing Website UI/UX Refinement — Complete

### What was built

- **Hero redesign** (`showcase-page.tsx` + `showcase.css`): premium compact hero — eyebrow badge, `RotatingHeadline` (static `lead` + CSS-only rotating phrase across 4 words in each locale, 10 s cycle with shimmer gradient; `aria-hidden` on the animated spans + a single `sr-only` full sentence so the heading's accessible name is stable), shorter description, oversized gradient CTAs (`showcase-button--lg`, arrow slide, RTL-aware), and a new `HeroVisual` composition — glass stage with the brand mark + wordmark + "Products · Services · Jobs" pills, plus floating real cards (product with thumb/title/price, job with employer/location chips, service with provider) that render only when real records exist; all motion (float, rotating, reveals) disabled under `prefers-reduced-motion`.
- **Posts/Groups/Messaging/demo removed from the public homepage**: `landing-messages.ts` no longer ships `social`/`groups`/`messaging` sections or the `demo` fallback block (all 8 locales); the homepage now surfaces Marketplace → Services → Jobs only, each rendering real records or a localized `EmptyState` (`landing.empty.title/description`, ×8 locales) when a dataset is empty. The Offers grid was trimmed to 3 tiles with scroll links to `#marketplace` / `#services` / `#jobs`.
- **Unified public header** (`site-header.tsx` + `navigation.css`): every non-app page (landing, about, explore, public marketplace + detail, groups, posts/[id], u/*, auth) now uses one clean header — brand → `/{locale}`, compact `LocaleSwitcher`, and either "Open XOWAAK" (→ `/home`, signed-in) or "Sign in" + "Create account". Nav links, hamburger, theme toggle and install button are gone from public pages (`site-header--public` vs `site-header--app`); mobile keeps the primary action visible at ≤30rem. `ThemeToggle`/`InstallAppButton` components remain unused by the header (appearance settings still manage theme for signed-in users).
- **Route classification refined** (`routes.ts`): `isApplicationPath` now treats public marketplace listing/detail routes (`/products`, `/services`, `/jobs`, `/groups`, `/products/[id]`, …), `explore`, `u/*`, `about` and auth as public (footer + public header), while keeping `home/search/messages/…` and create/edit routes (`/posts/new`, `/{kind}/[id]/edit`) as app routes.
- **i18n**: `navigation.openApp` added ×8 locales; hero `lead` + `phrases` (4 items each) and `empty` block added; `offers.items` trimmed to 3 (descriptions updated per locale). `MessageTree` in `translate.ts` widened to accept `readonly string[]` leaves (for `phrases`).
- **Back navigation preserved**: `BackLink` (used by product/service/job/group detail + post pages) unchanged; detail pages keep `router.back()` with localized fallback.
- **E2E smoke spec updated** to the new public header/hero (accessible heading name, no theme toggle / hamburger on public pages, marketplace browse routes render publicly, no sign-in redirect).

### Verification

- `npx tsc --noEmit` — clean.
- `npx eslint . --max-warnings=0` — 0 errors / 0 warnings.
- `npx vitest run` — 15 files / 41 tests passed (one transient worker-start timeout on `design-system.test.tsx` re-ran green in isolation).
- `npm run build` — compiled + 291 pages generated; all routes present.
- Runtime smoke checks with `next start` (production build): `/en`, `/ar` (dir=rtl, Arabic strings byte-exact, rotating headline + sr-only sentence present), `/en/about`, `/en/explore`, `/en/products|services|jobs|groups` (public header + footer), `/en/posts/[id]`, `/en/u/example` (LTR+RTL), `/en/auth/sign-in`, `/en/auth/sign-up` — all 200; `/en/home`, `/ar/home` redirect to sign-in (307); real product/service/job cards render from seeded data; `landing-empty` states absent only because data exists.

### Known limitations / follow-ups

- Hero floating cards and section grids depend on seeded data; empty datasets show the new localized empty state instead of demo content (demo fallback removed by design).
- `ThemeToggle`/`InstallAppButton` are no longer referenced by the header; they remain available for app-side surfaces if needed.
- Playwright e2e suite updated but not executed in this environment (requires a running server + Supabase credentials).

## Stage: Phase 5 Refinements (Header/Auth/Landing/Search/Create-Edit-Delete/Channels/Messaging/Profile) — Complete

### What was built

- **Unified site header** (`site-header.tsx` rewritten; `SiteHeader` + `SiteFooter` in one file):
  - Landing branch: brand + locale switcher + auth actions only. App branch: brand (→ `/home`) + `UserMenu`. Other pages: brand + nav + language + theme + auth actions + always-visible hamburger (mobile slide-down nav); mobile nav shows auth links only when signed out.
  - `user-menu.tsx` rewritten: `Avatar` from the design system, `avatarUrl`/`displayName` props, menu = Profile / Edit Profile / Settings / Language / Appearance + sign-out form posting to `/{locale}/auth/sign-out`; `app.help` item removed (key left unused in i18n).
  - `site-header-container.tsx` (server wrapper): `getCurrentUser()` + `getOwnProfile()` (try/catch) → passes avatar/display name so the header shows the real profile image and name.
- **AuthShell simplification** (`auth-shell.tsx`): centered card with eyebrow/title/description/unavailable banner; old `.auth-layout`/`.auth-aside` CSS left unused.
- **Landing hero trim + "Open XOWAAK"** (`showcase-page.tsx` + `landing-messages.ts`): shorter hero descriptions in 8 locales; `hero.note` replaced by `hero.openApp`; hero actions and final CTA are auth-aware (signed-in users get `Open XOWAAK` → `/home`); `LandingContent` fetches `getCurrentUser()` in `Promise.all`.
- **Search moved into Home + result images** (`feed-view.tsx` header, `search-bar.tsx`, `src/server/platform/queries.ts`):
  - `SearchResult` gains `imageUrl`; `searchPlatform` selects `avatar_media_id`/`image_media_asset_id`, resolves signed URLs (`getMediaSignedUrls` + `getProfiles`) for users/products/services/groups; suggestion avatars render `<img>` when available; `.search-bar input` font-size raised to 1rem.
- **MediaUpload rewrite** (`media-upload.tsx`): items with object URLs, upload/remove/replace/reorder, `onAssetIdsChange` + `onLocalPreview` + `onPreviewsChange`; SVG icon buttons with `common.mediaMoveBackward/Forward/Remove/Uploading` aria-labels (8 locales); fixes `covers` bucket missing from `mediaInputSchema` in `src/server/media/actions.ts`.
- **Post composer preview step** (`post-composer.tsx`): edit → preview stage with content + media preview (via `onPreviewsChange`), Back to edit + Publish; `composer.preview/backToEdit` keys in 8 locales.
- **Server CRUD + channels + moderation** (`supabase/migrations/20260814000010_phase5_refinements.sql` — pushed to SQL Editor by the user, additive-only):
  - `groups.type` (`social`|`channel`), `group_messages.media_asset_id` (+ media-owner trigger), `conversation_members.muted_at`; `can_post_group_message` gate on the insert policy (channels: owner/admin only); manager delete policy + `delete_group_message` RPC (soft delete, sender-or-manager); `notify_direct_message` rewritten to skip muted members.
  - `src/server/platform/actions.ts`: `updateProduct/Service/Job/Group`, `deleteProduct/Service/Job/Group`, `setGroupMemberRole` (owner-only, cannot change owner), `removeGroupMember` (self-leave or owner-remove), `deleteGroupMessage`, `sendGroupMessage` with `mediaAssetId` + channel permission check; `"not_found"` added to `PlatformErrorCode`; image update no longer wipes an existing image when none is picked (`?? null` removed).
  - `src/domains/platform/validation.ts`: `groupSchema.type` enum with `social` default.
  - `src/server/messaging/actions.ts`: `markConversationRead`, `setConversationMuted`, `leaveConversation`, `deleteDirectMessage` (soft delete, sender only).
- **Create/Edit forms with preview** (`platform-creation-form.tsx`): create + edit modes (initial values, existing image shown with `media-upload__current`), edit/preview stages, group-type `Select`, publish via create/update actions; 4 new edit pages under `(app)/{products,services,jobs,groups}/[id]/edit` (owner-gated, redirect non-owners). ~12 new platform i18n keys × 8 locales (`editProduct...`, `groupType/social/channel`, `preview/backToEdit`, `deleteTitle/deleteDescription/confirmDelete`).
- **Detail-page owner actions + back link** (`back-link.tsx`, `platform-owner-actions.tsx`, `platform-view.tsx`): `router.back()` with fallback; Edit link + Delete-confirm `Dialog`; channel chip + `app.kindChannel` badge on group cards; `posts/[id]` and `posts/new` use `BackLink`.
- **Group chat + members management** (`group-chat.tsx`, `group-members.tsx`): sender name/avatar, media attachments (image/video via `MediaUpload`, message-media bucket), per-message delete (own or manager, soft-deleted styling), channel posting restricted to managers (server + UI note), invite/accept/decline, owner: promote/demote/remove any non-owner, admin: remove members, anyone: leave group; 10 new messaging i18n keys × 8 locales.
- **Profile tabs** (`profile-view.tsx` + `u/[username]` page): URL-param tabs `?tab=posts|products|services|jobs|groups` with count badges, per-kind grids, empty state (`common.emptyState` added × 8 locales).
- **Profile form**: live avatar preview + "Remove avatar" (`identity-messages.profile.removeAvatar` × 8 locales), cover preview/remove already present.
- **Messaging list avatars + unread + actions** (`messaging/queries.ts`, `messages-view.tsx`, `emoji-picker.tsx`): conversation summaries/details resolve the counterpart's avatar; per-conversation unread counts (from `last_read_at`) with badges, client-side search filter, auto mark-read on open/realtime, thread actions (View profile, Mute/Unmute, Block user + leave, Leave with inline confirm), per-message delete for own DMs, and an emoji picker (`common.emojiPicker`, ~24 emojis) in both the DM and group-chat composers; 8 new messaging i18n keys × 8 locales.
- **Bottom navigation now fixed on all breakpoints** (`navigation.css`): `.app-bottom-nav` always visible; `.app-shell__content` reserves bottom padding at every size.

### Verification

- `npx tsc --noEmit` — clean (run after every batch).
- `npx eslint . --max-warnings=0` — 0 errors / 0 warnings (one stale unused import in the e2e spec removed).
- `npx vitest run` — 15 files / 41 tests passed.
- `npm run build` — compiled successfully; all routes present (products/services/jobs/groups edit pages + profile tab queries included).
- Runtime smoke checks with `next start`: `/en`, `/ar`, `/en/about`, `/en/explore`, `/en/products`, `/en/groups`, `/en/u/demo?tab=products`, `/en/u/demo?tab=groups`, `/ar/home`, `/ar/settings/profile`, `/en/auth/sign-in`, `/ar/auth/sign-in`, `/en/auth/sign-up` — all 200.
- Migration 20260814000010 names verified against prior migrations (policy `group_messages_insert_member` in 13000000; trigger `messages_notify_recipient` + function `notify_direct_message` in 14000002/14000008) — drops/creates are correctly targeted; applied by the user via Supabase SQL Editor (direct DB credentials were rejected locally).

### Known limitations / follow-ups

- The `groups` / channel / muting behavior is inactive until migration 10 is applied in the Supabase project (user ran it from the SQL Editor).
- PWA icons still the default mark (no image tooling in this environment).

---

## Stage: Phase 3 — Authenticated Application Redesign — Complete

### What was built

- **Theme persistence across reloads** (`app/[locale]/layout.tsx`): the hardcoded `data-theme="light"` was removed and replaced with a tiny inline `<head>` script that resolves the stored `xowaak-theme` (set by `AppearanceForm`/`ThemeToggle`) or the OS `prefers-color-scheme` and sets `data-theme` before React hydrates (`suppressHydrationWarning` on `<html>`). Dark mode now survives page reloads; the script guards on `matchMedia` availability and try/catch.
- **Bottom navigation on public platform pages for signed-in users**: new `isAppExperiencePath()` in `src/features/navigation/routes.ts` classifies public platform discovery (`products/services/jobs/groups` lists + details), `explore`, `posts/[id]`, `u/[username]` and `followers/following` as app-like experiences. `AppNavigation` now renders for authenticated users at the end of `PlatformDirectory`, `PlatformDetail`, `ExploreView`, `posts/[id]`, the public profile page and both social list pages (guests see none of this — verified). The root layout fetches the user once and hides the public footer on those pages for signed-in users only (guests keep the full public footer). The site header mirrors the same rule (`site-header.tsx`): signed-in users on those pages get the full app header (brand → `/home` + `UserMenu` with avatar/profile/notifications/settings), while guests keep the public header + locale switcher — so the authenticated experience is consistent end to end. Page bottom paddings already clear the fixed nav (`platform-page`, `feed-page`, `profile-page`, `social-list-page`); `.explore-page` bottom padding was raised to `clamp(4.5rem, 9vw, 7rem)`.
- **`posts/new` styling gap fixed**: `.posts-new-page` had no CSS at all; it now gets `min-height: 100vh` + the standard app-surface `padding-block` and a `margin-block-start` on its card so the composer clears the sticky header and the fixed bottom nav.
- **User menu entry point for notifications** (`user-menu.tsx`): added Notifications item → `/{locale}/notifications` using the existing `navigation.notifications` key (present in all 8 locales); popover now uses a 97% glass surface so content never shows through.
- **Settings back navigation** (`settings-shell.tsx`): the plain "Back to XOWAAK" link on the settings topline was replaced with the shared `BackLink` (history-aware, fallback `/{locale}/home`), matching every other app surface and never sending users to the public landing site.
- **CSS fixes and polish**:
  - `.app-shell` rule added (`min-height: 100dvh`); `.app-shell__content` reserves `calc(4.75rem + env(safe-area-inset-bottom))` so the fixed nav never overlaps content on notched devices.
  - Hardcoded colors tokenized: kind badges (`.platform-card__kind`/`.platform-detail-card__kind`/`.feed-card__kind`) now use `--color-overlay` (light `rgb(13 22 29/64%)` → dark `rgb(0 0 0/72%)`); `.fab__backdrop` uses `color-mix(in srgb, var(--color-overlay) 60%, transparent)` with a plain fallback; `.fab__menu` matches the user-menu 97% glass surface.
  - `.app-bottom-nav__item` gained color/background transitions; `app-bottom-nav__label` and active states unchanged.
  - Search input was already `1rem` (16px) — no zoom-on-focus fix needed.
- **Dead CSS removed** (every selector verified against all `.tsx/.ts` sources, including dynamically built class names; design-system and `[lang="ar"]` usages re-checked before removal): `.auth-layout`, `.auth-aside` + children, `.auth-card__toolbar`, `.auth-card__mark` (shared rule split — `.product-state-card__mark` kept, it is used by error/not-found/showcase), `.feed-page__links*`, `.feed-context-card*`, `.app-search-card*`, `.profile-posts`, `.profile-platform-section`, and from `navigation.css` the unused desktop/mobile `.site-nav*` system, `.site-menu-button` and `.site-header__search` (including their `@media` blocks). Kept deliberately: `.auth-card`, `.auth-status--*` (built as `auth-status--${status.kind}`), `.feed-card--job/service` (built as `feed-card--${kind}`), `.platform-map-marker--*`/`.platform-map-list__dot--*` (built from `item.kind`), `ds-text-h4` (used by `[lang="ar"]` typography selectors).

### Verification

- `npx tsc --noEmit` — clean.
- `npx eslint . --max-warnings=0` — 0 errors / 0 warnings.
- `npx vitest run` — 15 files / 41 tests passed.
- `npm run build` — compiled successfully (all routes present, incl. new conditional app-nav imports on public pages).
- Runtime smoke checks with `next start` (production build, port 3100):
  - Public pages 200 with real content in EN + AR (`dir="rtl"`): `/products`, `/services`, `/jobs`, `/groups`, `/explore`, `/u/prompt4primary` + `/followers` + `/following`, product/service/job/group details with real IDs.
  - Middleware-protected app routes redirect (307) for guests: `/home`, `/notifications`, `/settings`, `/messages`.
  - `/orders`, `/marketplace`, `/profile` render the loading shell then redirect from the `(app)` layout — pre-existing streaming behavior, unchanged by this stage.
  - `<html lang dir>` no longer carries a hardcoded `data-theme`; the theme script (`xowaak-theme`) is present in `<head>`.
  - Built CSS: `.app-shell{min-height:100dvh}`, safe-area content padding, `background:var(--color-overlay)` kind badges, `@supports (color:color-mix(...))` fallback pairs for the backdrop/popovers, new explore padding, `.posts-new-page` padding block; zero occurrences of the 10 removed selector groups.
  - Guest on public platform pages: public header + footer present, no bottom nav, sign-in/sign-up actions unchanged.
  - Follow-up pass: header now renders the app branch (UserMenu) for signed-in users on app-like public pages; `.posts-new-page` styling added — both verified in the production build (tsc/eslint/build re-run green, guest responses byte-identical).

### Known limitations / follow-ups

- Signed-in rendering of the new bottom nav / footer logic could not be exercised end-to-end (no session credentials in this environment); logic is server-gated on `getCurrentUser()` and the guest path was verified byte-for-byte.
- `posts/[id]` remains a public route outside the `(app)` group (guests reach it from public profiles); signed-in users now get the bottom nav and BackLink there, but the page does not use the app shell padding (its own `feed-page` padding clears the nav).
- `isAppExperiencePath` treats all `u/*`, `posts/*` and platform segments as app-like for signed-in users; any future public-only marketing sub-pages under those prefixes will need an exception.
- No browser-automated viewport suite was run (requires a running server + Supabase credentials); visual spot checks used the production server responses above.

---

## Stage: Phase 4 — Functional UX, Social Interactions & Final Product Polish — Complete

### What was built

- **Avatars in follower/following lists** (`src/server/social/queries.ts` + `src/features/social/social-user-list.tsx`): `SocialUser` gained `avatarUrl`; `getSocialUsers` batches `avatar_media_id`s through `getMediaSignedUrls` (same pattern as `getConversations`). Rows now render `<Avatar src>` images instead of initials-only. Works for followers, following, pending requests and blocked lists (all share `getSocialUsers`).
- **Real published-post count on profile tabs** (`src/server/posts/queries.ts` + `ProfileView` + both profile pages): new `getUserPostsCount(authorId)` (`count: exact, head: true`, `status = 'published'`); the profile page (`(app)/profile` and public `u/[username]`) passes it through and the Posts tab badge now shows the true count instead of the hardcoded `0` (verified 28 in runtime).
- **Notifications center** (`src/features/messaging/notifications-view.tsx` + `src/server/messaging/actions.ts`):
  - New `markAllNotificationsRead` action (updates `read_at` for all unread rows of the viewer) + "Mark all read" button in the page header (only when unread > 0).
  - Kind-aware navigation labels: the link text now depends on `kind` — follow → "View profile", message → "Open chat", group → "Open group", like/comment/share → "View post", system → "View" (new i18n keys `markAllRead`, `openPost`, `openGroup`, `view` in all 8 locales).
  - Softer realtime: `window.location.reload()` replaced with `router.refresh()`; the view resyncs from the refreshed `initial` prop using React's render-time state adjustment pattern (no setState-in-effect; passes the `react-hooks/set-state-in-effect` lint rule).
- **Messaging confirmations & readability** (`src/features/messaging/messages-view.tsx` + CSS):
  - Delete-own-message now requires confirmation (the previously unused `deleteMessageConfirm` key is now used).
  - Blocking a user now requires confirmation (`blockConfirm` key added ×8); both use the existing inline `messaging-thread__confirm` panel pattern with a destructive confirm button and decline.
  - Message bubbles got `overflow-wrap: anywhere` so long unbroken strings no longer overflow the bubble.
- **Orders & applications** (`src/features/orders/orders-view.tsx`):
  - Destructive status changes now open a confirmation `Dialog` (decline/cancel for orders, reject/withdraw for applications; accept/complete/shortlist/hire stay one-click).
  - Failures are no longer silent: a `role="alert"` error line (`orders-view__error`) shows `commerceFailed` when an update fails.
  - New i18n keys `confirmDecline`, `confirmCancel`, `confirmReject`, `confirmWithdraw` in all 8 locales.
  - `commerce-action.tsx` error line gained `role="alert"`.
- **Marketplace error states** (`app/[locale]/(app)/marketplace/page.tsx`): products/services grids no longer silently coerce failures to `[]` — `error` renders `ErrorState`, `unavailable` renders `EmptyState`.
- **Cancel link in Edit Profile** (`src/features/profile/profile-form.tsx`): a quiet "Cancel" link next to Save returns to the user's own profile (`/u/{username}`, falling back to settings when no profile is available); new `.settings-form__actions` row CSS.
- **Additive database migration** `supabase/migrations/20260817000000_phase4_polish.sql` (apply manually via SQL Editor, like previous stages; not applied in this workspace):
  - `notify_follow()` trigger (`after insert or update of status` on `follows`, firing only on transitions into `accepted`) inserts a `follow` notification for the recipient with `target_path = /u/<follower>`; gated by `is_notification_enabled(recipient, 'follow')`. Covers both public follows (insert as accepted) and private-account accepts (status update).
  - `join_group(target_group_id)` RPC (`security definer`, `revoke/grant` pattern matching `create_group_invitation`): allows any authenticated user to join `status = 'active'` + `visibility = 'public'` groups; rejects when an `active`/`invited`/`removed` membership already exists; reactivates a `left` membership; notifies the owner (kind `group`) unless it is the owner themselves. RLS is untouched.
- **Join button on public groups** (`src/features/platform/group-join.tsx` + `platform-view.tsx` + `src/server/platform/actions.ts`): new `joinGroup` server action calling the RPC; `PlatformDetail` computes viewer membership from the already-fetched `getGroupMembers` result and renders `GroupJoinButton` for authenticated non-members on public groups (owners and guests see nothing new; sign-in card unchanged). On success the page refreshes and the member UI (members + chat) appears.

### Verification

- `npx tsc --noEmit` — clean.
- `npx eslint . --max-warnings=0` — 0 errors / 0 warnings (incl. `react-hooks/set-state-in-effect`, which rejected the first realtime-sync implementation and forced the render-time adjustment pattern).
- `npx vitest run` — 15 files / 41 tests passed.
- `npm run build` — compiled successfully (291 pages, all routes present).
- Runtime smoke checks with `next start` (production build, port 3100):
  - Public pages 200 in EN + AR (`dir="rtl"`): `/products`, `/services`, `/jobs`, `/groups`, `/explore`, `/u/prompt4primary`, product/service/job/group details; followers/following pages now render `<img>` avatars (signed URLs) instead of bare initials.
  - Profile tabs show real counts in EN and AR (`28,19,12,11,10` = posts/products/services/jobs/groups for the seed user) — posts count was previously hardcoded 0.
  - Middleware-protected routes still 307 for guests (`/notifications`, `/messages`); `/marketplace`, `/orders` keep the pre-existing loading-shell → redirect.
  - Guest on group detail: sign-in card present, no join button (join is authenticated-only by design).
  - Built CSS contains: `overflow-wrap:anywhere` on message bubbles, `.settings-form__actions`, `.orders-view__error`, `.group-join` (+ `role="alert"` markup present in responses).

### Known limitations / follow-ups

- The two new database objects (`notify_follow` trigger, `join_group` RPC) live in an additive migration that must be applied via the Supabase SQL Editor; until applied, follow notifications are not emitted and the join button will surface an error on click (the action maps RPC failures to the generic failure message).
- Signed-in flows (mark all read, join, delete/block confirmations, orders confirm dialogs) could not be exercised end-to-end without session credentials; guest paths and server logic were verified; optimistic/refresh behavior follows existing patterns already in use.
- Realtime subscription on the notifications page still listens to all `notifications` INSERTs (any recipient) and refreshes — RLS filters the refetched data, so this is correct but slightly noisier than a filtered channel.
- No toast system was introduced (the product-wide inline `role="status"/"alert"` pattern is used consistently); recent searches remain unsupported (out of scope).
- No browser-automated viewport suite was run (requires a running server + Supabase credentials); visual spot checks used the production server responses above.