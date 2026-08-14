"use client";

import { useRef, useState } from "react";

import { createTranslator } from "@/i18n/translate";
import type { Locale } from "@/config/locales";

const EMOJIS = [
  "👍",
  "❤️",
  "😂",
  "😊",
  "😍",
  "🙏",
  "🎉",
  "🔥",
  "✨",
  "💯",
  "👏",
  "😮",
  "🤔",
  "😢",
  "😡",
  "🙈",
  "🚀",
  "💡",
  "✅",
  "🛒",
  "📦",
  "📷",
  "🎵",
  "☕",
];

export function EmojiPicker({
  locale,
  onSelect,
}: {
  locale: Locale;
  onSelect: (emoji: string) => void;
}) {
  const { t } = createTranslator(locale);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  function toggle() {
    setOpen((current) => !current);
  }

  function pick(emoji: string) {
    onSelect(emoji);
    setOpen(false);
  }

  return (
    <div className="emoji-picker" ref={containerRef}>
      <button
        type="button"
        className="emoji-picker__toggle"
        onClick={toggle}
        aria-label={t("common.emojiPicker")}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <circle
            cx="12"
            cy="12"
            r="9"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            d="M8.5 14s1 1.6 3.5 1.6 3.5-1.6 3.5-1.6"
          />
          <circle cx="9" cy="9.5" r="1.1" fill="currentColor" />
          <circle cx="15" cy="9.5" r="1.1" fill="currentColor" />
        </svg>
      </button>
      {open && (
        <div className="emoji-picker__panel">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className="emoji-picker__item"
              onClick={() => pick(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}