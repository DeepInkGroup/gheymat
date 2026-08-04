"use client";

import { useStoredSet } from "./useStoredSet";

const STORAGE_KEY = "gheymat:pinned-symbols";
const DEFAULT_PINNED = new Set<string>();

export function usePinnedSymbols() {
  const { value: pinned, toggle } = useStoredSet(STORAGE_KEY, DEFAULT_PINNED);
  return { pinned, toggle };
}
