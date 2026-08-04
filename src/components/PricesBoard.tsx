"use client";

import { useEffect, useState } from "react";
import PriceCard from "./PriceCard";
import SettingsPanel from "./SettingsPanel";
import { CATEGORY_LABELS, SYMBOLS, type SymbolMeta, type Category } from "@/lib/symbols";
import type { PriceItem, PricesResult } from "@/lib/baha24";
import { useHiddenSymbols } from "@/lib/useHiddenSymbols";
import { usePinnedSymbols } from "@/lib/usePinnedSymbols";

const CATEGORIES: Category[] = ["currency", "gold", "crypto"];
const FILTERS: Array<Category | "all"> = ["all", ...CATEGORIES];

const POLL_MS = 10_000;
// ~10 minutes of trend at the 10s poll rate. Builds up live during this
// session — there's no backend history store, so it starts empty on load.
const MAX_HISTORY_POINTS = 60;

export default function PricesBoard() {
  const [data, setData] = useState<PricesResult | null>(null);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<Category | "all">("all");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { hidden, toggle, showAll } = useHiddenSymbols();
  const { pinned, toggle: togglePin } = usePinnedSymbols();
  const [history, setHistory] = useState<Record<string, number[]>>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/prices");
        if (!res.ok) throw new Error("bad response");
        const json: PricesResult = await res.json();
        if (!cancelled) {
          setHistory((prev) => {
            const next = { ...prev };
            for (const item of json.items) {
              const arr = next[item.symbol] ?? [];
              next[item.symbol] = [...arr, item.price].slice(-MAX_HISTORY_POINTS);
            }
            return next;
          });
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

  function renderCard(meta: SymbolMeta) {
    const item = byId.get(meta.symbol);
    return (
      <PriceCard
        key={meta.symbol}
        meta={meta}
        price={item?.price ?? 0}
        changePercent={item?.changePercent ?? null}
        updatedAt={item?.updatedAt ?? null}
        history={history[meta.symbol] ?? []}
        pinned={pinned.has(meta.symbol)}
        onTogglePin={() => togglePin(meta.symbol)}
      />
    );
  }

  const pinnedSymbols = SYMBOLS.filter((s) => pinned.has(s.symbol) && !hidden.has(s.symbol));
  const nothingVisible =
    pinnedSymbols.length === 0 &&
    visibleCategories.every(
      (cat) => SYMBOLS.filter((s) => s.category === cat && !hidden.has(s.symbol) && !pinned.has(s.symbol)).length === 0
    );

  return (
    <div className="flex flex-1 flex-col">
      <div className="glass sticky top-[3.5rem] z-10 -mx-4 mb-6 flex items-center gap-2 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md sm:mx-0 sm:rounded-2xl sm:border sm:px-3">
        <div className="flex flex-1 items-center gap-2 overflow-x-auto">
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
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {error && !data && <span className="text-xs text-down">Failed to load data</span>}
          <button
            onClick={() => setSettingsOpen(true)}
            aria-label="Customize instruments"
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-foreground"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {pinnedSymbols.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-muted">Pinned</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pinnedSymbols.map(renderCard)}
            </div>
          </section>
        )}

        {visibleCategories.map((cat) => {
          const symbols = SYMBOLS.filter((s) => s.category === cat && !hidden.has(s.symbol) && !pinned.has(s.symbol));
          if (symbols.length === 0) return null;
          return (
            <section key={cat}>
              <h2 className="mb-3 text-sm font-semibold text-muted">{CATEGORY_LABELS[cat]}</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{symbols.map(renderCard)}</div>
            </section>
          );
        })}

        {nothingVisible && (
          <p className="py-12 text-center text-sm text-muted">
            Everything&apos;s hidden. Tap the settings icon to bring instruments back.
          </p>
        )}
      </div>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        hidden={hidden}
        onToggle={toggle}
        onShowAll={showAll}
      />
    </div>
  );
}
