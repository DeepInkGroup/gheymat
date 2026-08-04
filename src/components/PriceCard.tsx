"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import Sparkline from "./Sparkline";
import type { SymbolMeta } from "@/lib/symbols";
import { UNIT_LABELS } from "@/lib/symbols";
import { formatDelta, formatPrice, formatUpdatedAt } from "@/lib/format";

export default function PriceCard({
  meta,
  price,
  changePercent,
  updatedAt,
  history,
  pinned,
  onTogglePin,
}: {
  meta: SymbolMeta;
  price: number;
  changePercent: number | null;
  updatedAt: string | null;
  history: number[];
  pinned: boolean;
  onTogglePin: () => void;
}) {
  const prevPrice = useRef(price);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (price !== prevPrice.current) {
      setFlash(price > prevPrice.current ? "up" : "down");
      prevPrice.current = price;
      const t = setTimeout(() => setFlash(null), 900);
      return () => clearTimeout(t);
    }
  }, [price]);

  const delta = formatDelta(price, changePercent);
  const updated = formatUpdatedAt(updatedAt);

  return (
    <div
      className={`glass relative rounded-2xl border border-border bg-surface p-4 shadow-sm backdrop-blur-md transition-colors duration-700 ${
        flash === "up" ? "bg-up/10" : flash === "down" ? "bg-down/10" : ""
      }`}
    >
      <button
        onClick={onTogglePin}
        aria-label={pinned ? `Unpin ${meta.name}` : `Pin ${meta.name}`}
        aria-pressed={pinned}
        className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
          pinned ? "text-accent-gold" : "text-border hover:text-muted"
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill={pinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="flex items-start justify-between gap-2 pe-6">
        <Icon meta={meta} />
        <div className="min-w-0 text-right">
          <div className="truncate text-sm font-semibold text-foreground">{meta.name}</div>
          <div className="num text-xs text-muted">{meta.symbol}</div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div
          className={`num text-xs font-semibold ${
            delta.direction === "up" ? "text-up" : delta.direction === "down" ? "text-down" : "text-muted"
          }`}
        >
          {delta.direction === "up" && "▲ "}
          {delta.direction === "down" && "▼ "}
          {delta.text}
        </div>
        <Sparkline data={history} direction={delta.direction} />
      </div>
      <div className="num text-xl font-extrabold text-foreground sm:text-2xl">
        {formatPrice(price)}
        <span className="ms-1.5 text-xs font-normal text-muted">{UNIT_LABELS[meta.unit]}</span>
      </div>
      {updated && <div className="num mt-1 text-[0.65rem] text-muted">Updated {updated}</div>}
    </div>
  );
}
