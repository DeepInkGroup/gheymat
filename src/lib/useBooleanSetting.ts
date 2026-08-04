"use client";

import { useCallback, useEffect, useState } from "react";

export function useBooleanSetting(key: string, defaultValue: boolean) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setValue(stored === "1");
      }
    } catch {
      // ignore
    }
  }, [key]);

  const set = useCallback(
    (next: boolean) => {
      setValue(next);
      try {
        window.localStorage.setItem(key, next ? "1" : "0");
      } catch {
        // ignore
      }
    },
    [key]
  );

  return [value, set] as const;
}
