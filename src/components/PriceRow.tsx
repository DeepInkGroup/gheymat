"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import type { SymbolMeta } from "@/lib/symbols";
import { UNIT_LABELS } from "@/lib/symbols";
import { formatDelta, formatPercentDelta, formatPrice } from "@/lib/format";

export default function PriceRow({
  meta,
  price,
  changePercent,
  pinned,
  onTogglePin,
  showPercentDelta,
}: {
  meta: SymbolMeta;
  price: number;
  changePercent: number | null;
  pinned: boolean;
  onTogglePin: () => void;
  showPercentDelta: boolean;
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

  const delta = showPercentDelta ? formatPercentDelta(changePercent) : formatDelta(price, changePercent);

  return (
    <div
      className={`glass flex items-center gap-2.5 rounded-xl border border-border bg-surface px-3 py-2 shadow-sm backdrop-blur-md transition-colors duration-700 ${
        flash === "up" ? "bg-up/10" : flash === "down" ? "bg-down/10" : ""
      }`}
    >
      <button
        onClick={onTogglePin}
        aria-label={pinned ? `Unpin ${meta.name}` : `Pin ${meta.name}`}
        aria-pressed={pinned}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors ${
          pinned ? "text-accent-gold" : "text-muted hover:text-foreground"
        }`}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill={pinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" strokeLinejoin="round" />
        </svg>
      </button>

      <Icon meta={meta} />

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-foreground">{meta.name}</div>
        <div className="num text-xs text-muted">{meta.symbol}</div>
      </div>

      <div className="shrink-0 text-right">
        <div className="num text-sm font-bold text-foreground">
          {formatPrice(price)}
          <span className="ms-1 text-[0.65rem] font-normal text-muted">{UNIT_LABELS[meta.unit]}</span>
        </div>
        <div
          className={`num text-[0.7rem] font-semibold ${
            delta.direction === "up" ? "text-up" : delta.direction === "down" ? "text-down" : "text-muted"
          }`}
        >
          {delta.direction === "up" && "▲ "}
          {delta.direction === "down" && "▼ "}
          {delta.text}
        </div>
      </div>
    </div>
  );
}
