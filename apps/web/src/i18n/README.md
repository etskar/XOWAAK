# Internationalization Boundary

Prompt 08 provides the centralized locale registry, namespaced static messages, typed translation
lookup, locale-preserving routing helpers, and Intl date/number formatting utilities.

The existing `auth-messages.ts` and `identity-messages.ts` modules remain compatibility exports;
they are consumed by the centralized `src/i18n/messages/index.ts` tree rather than acting as a
second translation runtime.
