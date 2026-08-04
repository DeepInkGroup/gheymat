"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "gheymat:alerts";

export interface Alert {
  target: number;
  direction: "above" | "below";
}

type AlertMap = Record<string, Alert>;

function readStored(): AlertMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function usePriceAlerts() {
  const [alerts, setAlerts] = useState<AlertMap>({});

  useEffect(() => {
    const stored = readStored();
    if (Object.keys(stored).length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAlerts(stored);
    }
  }, []);

  const persist = useCallback((next: AlertMap) => {
    setAlerts(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const setAlert = useCallback(
    (symbol: string, alert: Alert) => {
      persist({ ...alerts, [symbol]: alert });
    },
    [alerts, persist]
  );

  const clearAlert = useCallback(
    (symbol: string) => {
      const next = { ...alerts };
      delete next[symbol];
      persist(next);
    },
    [alerts, persist]
  );

  return { alerts, setAlert, clearAlert };
}
