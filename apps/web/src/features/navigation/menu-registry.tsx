"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

type MenuRegistryValue = {
  openId: string | null;
  toggle: (id: string) => void;
  close: () => void;
};

const MenuRegistryContext = createContext<MenuRegistryValue | null>(null);

export function MenuRegistryProvider({ children }: { children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpenId(null), []);
  const toggle = useCallback((id: string) => {
    setOpenId((current) => (current === id ? null : id));
  }, []);

  useEffect(() => {
    if (openId === null) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpenId(null);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenId(null);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [openId]);

  return (
    <MenuRegistryContext.Provider value={{ openId, toggle, close }}>
      <div ref={rootRef} className="menu-registry">
        {children}
      </div>
    </MenuRegistryContext.Provider>
  );
}

export function useMenuRegistry() {
  const value = useContext(MenuRegistryContext);

  if (!value) {
    throw new Error("useMenuRegistry must be used within MenuRegistryProvider");
  }

  return value;
}