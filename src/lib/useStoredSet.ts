"use client";

import { useCallback, useEffect, useState } from "react";

function readStored(key: string): Set<string> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return null; // never customized — caller falls back to its own default
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr) : null;
  } catch {
    return null;
  }
}

/** A string Set persisted to localStorage under `key`, hydration-safe. */
export function useStoredSet(key: string, defaultValue: Set<string>) {
  // Server render and the first client render both use the same static
  // default (no localStorage access yet), so there's no hydration flash.
  const [value, setValue] = useState<Set<string>>(() => new Set(defaultValue));

  useEffect(() => {
    const stored = readStored(key);
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValue(stored);
    }
  }, [key]);

  const persist = useCallback(
    (next: Set<string>) => {
      setValue(next);
      try {
        window.localStorage.setItem(key, JSON.stringify([...next]));
      } catch {
        // ignore (private browsing / storage disabled)
      }
    },
    [key]
  );

  const toggle = useCallback(
    (item: string) => {
      setValue((current) => {
        const next = new Set(current);
        if (next.has(item)) next.delete(item);
        else next.add(item);
        try {
          window.localStorage.setItem(key, JSON.stringify([...next]));
        } catch {
          // ignore
        }
        return next;
      });
    },
    [key]
  );

  const clear = useCallback(() => persist(new Set()), [persist]);

  return { value, toggle, clear, persist };
}
