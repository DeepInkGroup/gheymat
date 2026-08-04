"use client";

import { useEffect, useState } from "react";
import Icon from "./Icon";
import { SYMBOL_MAP } from "@/lib/symbols";

interface Mover {
  symbol: string;
  changePercent: number;
  price: number;
}

const POLL_MS = 60_000;

export default function MoversStrip() {
  const [movers, setMovers] = useState<Mover[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/movers");
        const json = await res.json();
        if (!cancelled) setMovers(json.movers ?? []);
      } catch {
        // ignore — strip just stays hidden/unchanged
      }
    }

    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (movers.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-muted">Today&apos;s Movers</h2>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {movers.map((m) => {
          const meta = SYMBOL_MAP[m.symbol];
          if (!meta) return null;
          const direction = m.changePercent > 0 ? "up" : m.changePercent < 0 ? "down" : "flat";
          return (
            <div
              key={m.symbol}
              className="glass flex shrink-0 items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 shadow-sm backdrop-blur-md"
            >
              <Icon meta={meta} />
              <div className="min-w-0">
                <div className="truncate text-xs font-semibold text-foreground">{meta.symbol}</div>
                <div
                  className={`num text-xs font-bold ${
                    direction === "up" ? "text-up" : direction === "down" ? "text-down" : "text-muted"
                  }`}
                >
                  {direction === "up" && "▲ "}
                  {direction === "down" && "▼ "}
                  {m.changePercent > 0 ? "+" : ""}
                  {m.changePercent.toFixed(2)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
