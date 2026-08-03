"use client";

import { useEffect, useState } from "react";
import PriceCard from "./PriceCard";
import { CATEGORY_LABELS, SYMBOLS, type Category } from "@/lib/symbols";
import type { PriceItem, PricesResult } from "@/lib/baha24";

const CATEGORIES: Category[] = ["currency", "gold", "crypto"];
const FILTERS: Array<Category | "all"> = ["all", ...CATEGORIES];

const POLL_MS = 20_000;

export default function PricesBoard() {
  const [data, setData] = useState<PricesResult | null>(null);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<Category | "all">("all");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/prices");
        if (!res.ok) throw new Error("bad response");
        const json: PricesResult = await res.json();
        if (!cancelled) {
          setData(json);
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    }

    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const byId = new Map<string, PriceItem>((data?.items ?? []).map((i) => [i.symbol, i]));
  const visibleCategories = filter === "all" ? CATEGORIES : [filter];

  return (
    <div className="flex flex-1 flex-col">
      <div className="glass sticky top-[3.5rem] z-10 -mx-4 mb-6 flex gap-2 overflow-x-auto border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md sm:mx-0 sm:rounded-2xl sm:border sm:px-3">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f
                ? "bg-foreground text-background"
                : "bg-surface text-muted hover:text-foreground"
            }`}
          >
            {f === "all" ? "All" : CATEGORY_LABELS[f]}
          </button>
        ))}
        {error && !data && (
          <span className="ml-auto self-center text-xs text-down">Failed to load data</span>
        )}
      </div>

      <div className="flex flex-col gap-8">
        {visibleCategories.map((cat) => {
          const symbols = SYMBOLS.filter((s) => s.category === cat);
          return (
            <section key={cat}>
              <h2 className="mb-3 text-sm font-semibold text-muted">{CATEGORY_LABELS[cat]}</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {symbols.map((meta) => {
                  const item = byId.get(meta.symbol);
                  return (
                    <PriceCard
                      key={meta.symbol}
                      meta={meta}
                      price={item?.price ?? 0}
                      changePercent={item?.changePercent ?? null}
                    />
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
