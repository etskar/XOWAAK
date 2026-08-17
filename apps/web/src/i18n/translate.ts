import type { Locale } from "@/config/locales";
import { messages } from "@/i18n/messages";

interface MessageTree {
  [key: string]: string | readonly string[] | MessageTree;
}

type LeafKeys<T extends MessageTree> = {
  [Key in keyof T & string]: T[Key] extends string
    ? Key
    : T[Key] extends MessageTree
      ? `${Key}.${LeafKeys<T[Key]>}`
      : never;
}[keyof T & string];

export type TranslationKey = LeafKeys<typeof messages.en>;

function lookup(tree: MessageTree, key: string) {
  const value = key.split(".").reduce<unknown>((current, part) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[part];
  }, tree);

  return typeof value === "string" ? value : key;
}

export function createTranslator(locale: Locale) {
  const tree = messages[locale] as MessageTree;

  return {
    t<Key extends TranslationKey>(key: Key) {
      return lookup(tree, key);
    },
  };
}

export function translate<Key extends TranslationKey>(locale: Locale, key: Key) {
  return createTranslator(locale).t(key);
}
