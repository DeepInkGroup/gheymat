"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "gheymat:hidden-symbols";

function readStored(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr) : new Set();
  } catch {
    return new Set();
  }
}

export function useHiddenSymbols() {
  const [hidden, setHidden] = useState<Set<string>>(() => new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Read the browser-only localStorage value once after mount so the
    // server-rendered and first client-rendered pass stay in sync (both
    // start empty); this is the standard hydration-safe pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHidden(readStored());
    setReady(true);
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

  return { hidden, ready, toggle, showAll };
}
