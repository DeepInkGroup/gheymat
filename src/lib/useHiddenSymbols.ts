"use client";

import { SYMBOLS } from "./symbols";
import { useStoredSet } from "./useStoredSet";

const STORAGE_KEY = "gheymat:hidden-symbols";

// First-time defaults: a lean starting set. Everything else is one tap
// away in settings.
const ALWAYS_HIDDEN_BY_DEFAULT = new Set(["TRY", "CAD", "RUB", "CHF", "MEXUSD", "AZADI1_2", "AZADI1_4"]);
const DEFAULT_HIDDEN = new Set([
  ...SYMBOLS.filter((s) => s.category === "crypto" && s.symbol !== "USDT" && s.symbol !== "BITCOIN").map(
    (s) => s.symbol
  ),
  ...ALWAYS_HIDDEN_BY_DEFAULT,
]);

export function useHiddenSymbols() {
  const { value: hidden, toggle, clear } = useStoredSet(STORAGE_KEY, DEFAULT_HIDDEN);
  return { hidden, toggle, showAll: clear };
}
