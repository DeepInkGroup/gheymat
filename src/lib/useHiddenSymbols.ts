"use client";

import { useCallback, useEffect, useState } from "react";
import { SYMBOLS } from "./symbols";

const STORAGE_KEY = "gheymat:hidden-symbols";

// First-time default: only Tether and Bitcoin are shown in Crypto; every
// other coin starts hidden until the user turns it on from settings.
const DEFAULT_HIDDEN = new Set(
  SYMBOLS.filter((s) => s.category === "crypto" && s.symbol !== "USDT" && s.symbol !== "BITCOIN").map(
    (s) => s.symbol
  )
);

function readStored(): Set<string> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null; // never customized — caller falls back to the default
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr) : null;
  } catch {
    return null;
  }
}

export function useHiddenSymbols() {
  // Server render and the first client render both use the same static
  // default (no localStorage access yet), so there's no hydration flash.
  const [hidden, setHidden] = useState<Set<string>>(() => new Set(DEFAULT_HIDDEN));

  useEffect(() => {
    const stored = readStored();
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHidden(stored);
    }
  }, []);

  const persist = useCallback((next: Set<string>) => {
    setHidden(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
    } catch {
      // ignore (private browsing / storage disabled)
    }
  }, []);

  const toggle = useCallback(
    (symbol: string) => {
      const next = new Set(hidden);
      if (next.has(symbol)) next.delete(symbol);
      else next.add(symbol);
      persist(next);
    },
    [hidden, persist]
  );

  const showAll = useCallback(() => persist(new Set()), [persist]);

  return { hidden, toggle, showAll };
}
