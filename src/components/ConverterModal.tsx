"use client";

import { useEffect, useMemo, useState } from "react";
import { CATEGORY_LABELS, SYMBOLS, SYMBOL_MAP, type Category } from "@/lib/symbols";
import type { PriceItem } from "@/lib/baha24";
import { convertAmount } from "@/lib/convert";
import Icon from "./Icon";

const CATEGORIES: Category[] = ["currency", "gold", "crypto", "energy", "purity"];

/**
 * formatPrice's 4-decimal cap is tuned for "current market price"
 * display, where nothing ever gets that small. A converted amount
 * easily does (e.g. 1 USD in BTC ≈ 0.0000154) — round that to 4
 * decimals and it's just "0". Small values get up to 8 decimals here
 * instead (Intl trims trailing zeros on its own).
 */
function formatConverted(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(value);
  }
  const maximumFractionDigits = abs >= 1 ? 4 : 8;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits, minimumFractionDigits: 0 }).format(value);
}

export default function ConverterModal({
  open,
  onClose,
  items,
  hidden,
}: {
  open: boolean;
  onClose: () => void;
  items: PriceItem[];
  hidden: Set<string>;
}) {
  const [fromSymbol, setFromSymbol] = useState("USD");
  const [amount, setAmount] = useState("1");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const byId = useMemo(() => new Map(items.map((i) => [i.symbol, i])), [items]);

  if (!open) return null;

  const fromMeta = SYMBOL_MAP[fromSymbol];
  const numericAmount = Number(amount);
  const hasLiveFromRate = convertAmount(byId, fromSymbol, 1, fromSymbol) !== null;
  const results = SYMBOLS.filter((s) => s.symbol !== fromSymbol && !hidden.has(s.symbol));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <button className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-label="Close" onClick={onClose} />
      <div className="glass safe-bottom relative flex max-h-[80vh] w-full flex-col rounded-t-2xl border border-border bg-surface sm:max-w-md sm:rounded-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Convert</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-background hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3">
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="num w-0 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none"
            placeholder="Amount"
          />
          <select
            value={fromSymbol}
            onChange={(e) => setFromSymbol(e.target.value)}
            className="max-w-[50%] rounded-xl border border-border bg-background px-2 py-2 text-sm text-foreground"
          >
            {CATEGORIES.map((cat) => (
              <optgroup key={cat} label={CATEGORY_LABELS[cat]}>
                {SYMBOLS.filter((s) => s.category === cat).map((s) => (
                  <option key={s.symbol} value={s.symbol}>
                    {s.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {!hasLiveFromRate ? (
            <p className="py-8 text-center text-sm text-muted">
              No live price for {fromMeta?.name ?? fromSymbol} right now.
            </p>
          ) : results.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              Nothing visible to convert to — show some instruments in settings first.
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {results.map((meta) => {
                const value = convertAmount(byId, fromSymbol, numericAmount, meta.symbol);
                return (
                  <div
                    key={meta.symbol}
                    className="flex items-center justify-between gap-3 rounded-xl px-2 py-2 hover:bg-background"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <Icon meta={meta} />
                      <span className="truncate text-sm text-foreground">{meta.name}</span>
                    </div>
                    <span className="num shrink-0 text-sm font-semibold text-foreground">
                      {value !== null ? formatConverted(value) : "—"}{" "}
                      {/* meta.unit is the currency that instrument's own
                          raw price happens to be quoted in (e.g. Tether's
                          price field is Toman) — not what a *converted*
                          amount of it should be labeled. This is "amount
                          of this instrument", so its own ticker is the
                          only label that's actually correct here. */}
                      <span className="text-xs font-normal text-muted">{meta.symbol}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
