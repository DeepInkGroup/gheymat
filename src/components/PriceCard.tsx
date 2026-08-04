"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import Sparkline from "./Sparkline";
import type { SymbolMeta } from "@/lib/symbols";
import { UNIT_LABELS } from "@/lib/symbols";
import { formatDelta, formatPrice } from "@/lib/format";

export default function PriceCard({
  meta,
  price,
  changePercent,
  history,
}: {
  meta: SymbolMeta;
  price: number;
  changePercent: number | null;
  history: number[];
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

  return (
    <div
      className={`glass rounded-2xl border border-border bg-surface p-4 shadow-sm backdrop-blur-md transition-colors duration-700 ${
        flash === "up" ? "bg-up/10" : flash === "down" ? "bg-down/10" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
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
    </div>
  );
}
