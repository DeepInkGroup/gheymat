"use client";

import { useCallback, useEffect, useState } from "react";
import { SYMBOLS } from "./symbols";

const STORAGE_KEY = "gheymat:hidden-symbols";

// First-time defaults: a lean starting set. Everything else is one tap
// away in settings.
const ALWAYS_HIDDEN_BY_DEFAULT = new Set([
  "TRY",
  "CAD",
  "RUB",
  "CHF",
  "MEXUSD",
  "AZADI1_2",
  "AZADI1_4",
]);
const DEFAULT_HIDDEN = new Set([
  ...SYMBOLS.filter((s) => s.category === "crypto" && s.symbol !== "USDT" && s.symbol !== "BITCOIN").map(
    (s) => s.symbol
  ),
  ...ALWAYS_HIDDEN_BY_DEFAULT,
]);

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
