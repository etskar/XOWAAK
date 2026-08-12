"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import type { Locale } from "@/config/locales";
import { getPwaMessages } from "@/i18n/pwa-messages";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function subscribeToMediaQuery(callback: () => void) {
  const query = window.matchMedia("(display-mode: standalone)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function getStandaloneSnapshot() {
  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean(navigatorWithStandalone.standalone)
  );
}

function getServerSnapshot() {
  return false;
}

function subscribeToIos() {
  return () => undefined;
}

function getIosSnapshot() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !getStandaloneSnapshot();
}

export function InstallAppButton({ locale }: { locale: Locale }) {
  const messages = getPwaMessages(locale);
  const isStandalone = useSyncExternalStore(
    subscribeToMediaQuery,
    getStandaloneSnapshot,
    getServerSnapshot,
  );
  const isIos = useSyncExternalStore(subscribeToIos, getIosSnapshot, getServerSnapshot);
  const [deferredPrompt, setDeferredPrompt] = useState<InstallPromptEvent | null>(null);
  const [showIosInstructions, setShowIosInstructions] = useState(false);

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as InstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  if (isStandalone || (!deferredPrompt && !isIos)) {
    return null;
  }

  async function install() {
    if (!deferredPrompt) {
      setShowIosInstructions(true);
      return;
    }

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }

  return (
    <>
      <button className="pwa-install-button" type="button" onClick={install}>
        <span className="pwa-install-button__icon" aria-hidden="true">
          ↓
        </span>
        <span>{messages.install}</span>
      </button>
      {showIosInstructions && (
        <div className="pwa-install-hint" role="dialog" aria-labelledby="pwa-install-title">
          <div>
            <strong id="pwa-install-title">{messages.iosTitle}</strong>
            <p>{messages.iosDescription}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowIosInstructions(false)}
            aria-label={messages.close}
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}
