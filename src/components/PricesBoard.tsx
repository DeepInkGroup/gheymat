"use client";

import { useEffect, useRef, useState } from "react";
import PriceCard from "./PriceCard";
import PriceRow from "./PriceRow";
import SettingsPanel from "./SettingsPanel";
import MoversStrip from "./MoversStrip";
import { CATEGORY_LABELS, SYMBOL_MAP, SYMBOLS, UNIT_LABELS, type SymbolMeta, type Category } from "@/lib/symbols";
import type { PriceItem, PricesResult } from "@/lib/baha24";
import { useHiddenSymbols } from "@/lib/useHiddenSymbols";
import { usePinnedSymbols } from "@/lib/usePinnedSymbols";
import { usePriceAlerts } from "@/lib/usePriceAlerts";
import { useBooleanSetting } from "@/lib/useBooleanSetting";
import { useMoveSound } from "@/lib/useMoveSound";
import { formatPrice } from "@/lib/format";

const CATEGORIES: Category[] = ["currency", "gold", "crypto"];
const FILTERS: Array<Category | "all"> = ["all", ...CATEGORIES];

const POLL_MS = 10_000;
// ~10 minutes of trend at the 10s poll rate. Builds up live during this
// session — there's no backend history store, so it starts empty on load.
const MAX_HISTORY_POINTS = 60;
// Minimum |% change| between two consecutive polls (10s apart) to count
// as a "big move" worth a sound cue.
const SOUND_THRESHOLD_PCT = 0.3;

export default function PricesBoard() {
  const [data, setData] = useState<PricesResult | null>(null);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<Category | "all">("all");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { hidden, toggle, showAll } = useHiddenSymbols();
  const { pinned, toggle: togglePin } = usePinnedSymbols();
  const { alerts, setAlert, clearAlert } = usePriceAlerts();
  const [showHighLow, setShowHighLow] = useBooleanSetting("gheymat:show-high-low", false);
  const [showPercentDelta, setShowPercentDelta] = useBooleanSetting("gheymat:show-percent-delta", false);
  const [compactView, setCompactView] = useBooleanSetting("gheymat:compact-view", false);
  const [soundEnabled, setSoundEnabled] = useBooleanSetting("gheymat:sound-enabled", false);
  const [history, setHistory] = useState<Record<string, number[]>>({});
  const playMoveSound = useMoveSound(soundEnabled);

  // Read via refs (not the state directly) inside the poll loop below, so
  // the effect can keep its [] deps — no interval reset every time a
  // setting or hidden-symbol changes — while still comparing against the
  // truly latest values instead of a stale closure.
  const hiddenRef = useRef(hidden);
  useEffect(() => {
    hiddenRef.current = hidden;
  }, [hidden]);
  const historyRef = useRef(history);
  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/prices");
        if (!res.ok) throw new Error("bad response");
        const json: PricesResult = await res.json();
        if (!cancelled) {
          let biggestMovePct: number | null = null;
          for (const item of json.items) {
            if (hiddenRef.current.has(item.symbol)) continue;
            const prevArr = historyRef.current[item.symbol];
            const prevPrice = prevArr?.[prevArr.length - 1];
            if (prevPrice === undefined || prevPrice === 0) continue;
            const pct = ((item.price - prevPrice) / prevPrice) * 100;
            if (Math.abs(pct) >= SOUND_THRESHOLD_PCT && (biggestMovePct === null || Math.abs(pct) > Math.abs(biggestMovePct))) {
              biggestMovePct = pct;
            }
          }
          if (biggestMovePct !== null) playMoveSound(biggestMovePct > 0 ? "up" : "down");

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
  }, [playMoveSound]);

  // Fires a one-shot browser notification when a price crosses a set
  // alert target. Only works while this tab/app is open and polling —
  // there's no server-side push infrastructure behind this.
  useEffect(() => {
    if (!data) return;
    for (const item of data.items) {
      const alert = alerts[item.symbol];
      if (!alert) continue;
      const crossed = alert.direction === "above" ? item.price >= alert.target : item.price <= alert.target;
      if (!crossed) continue;

      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        const meta = SYMBOL_MAP[item.symbol];
        new Notification(`${meta?.name ?? item.symbol} price alert`, {
          body: `Now ${formatPrice(item.price)} ${meta ? UNIT_LABELS[meta.unit] : ""} — crossed your target of ${formatPrice(alert.target)}`,
        });
      }
      clearAlert(item.symbol);
    }
  }, [data, alerts, clearAlert]);

  const byId = new Map<string, PriceItem>((data?.items ?? []).map((i) => [i.symbol, i]));
  const visibleCategories = filter === "all" ? CATEGORIES : [filter];

  function renderCard(meta: SymbolMeta) {
    const item = byId.get(meta.symbol);

    if (compactView) {
      return (
        <PriceRow
          key={meta.symbol}
          meta={meta}
          price={item?.price ?? 0}
          changePercent={item?.changePercent ?? null}
          pinned={pinned.has(meta.symbol)}
          onTogglePin={() => togglePin(meta.symbol)}
          showPercentDelta={showPercentDelta}
        />
      );
    }

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
        showHighLow={showHighLow}
        showPercentDelta={showPercentDelta}
        alert={alerts[meta.symbol]}
        onSetAlert={(alert) => setAlert(meta.symbol, alert)}
        onClearAlert={() => clearAlert(meta.symbol)}
      />
    );
  }

  const listClassName = compactView ? "flex flex-col gap-2" : "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3";

  const query = searchQuery.trim().toLowerCase();
  const searchResults = query
    ? SYMBOLS.filter(
        (s) => !hidden.has(s.symbol) && (s.name.toLowerCase().includes(query) || s.symbol.toLowerCase().includes(query))
      )
    : null;

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
          {searchOpen ? (
            <input
              autoFocus
              type="text"
              inputMode="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search instruments…"
              className="w-full rounded-full border border-border bg-surface px-4 py-1.5 text-sm text-foreground outline-none placeholder:text-muted"
            />
          ) : (
            FILTERS.map((f) => (
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
            ))
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {error && !data && <span className="text-xs text-down">Failed to load data</span>}
          <button
            onClick={() => {
              if (searchOpen) setSearchQuery("");
              setSearchOpen((open) => !open);
            }}
            aria-label={searchOpen ? "Close search" : "Search instruments"}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-foreground"
          >
            {searchOpen ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
            )}
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            aria-label="Customize instruments"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-foreground"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {searchResults ? (
          searchResults.length > 0 ? (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-muted">
                {searchResults.length} result{searchResults.length === 1 ? "" : "s"}
              </h2>
              <div className={listClassName}>{searchResults.map(renderCard)}</div>
            </section>
          ) : (
            <p className="py-12 text-center text-sm text-muted">No instruments match &quot;{searchQuery.trim()}&quot;.</p>
          )
        ) : (
          <>
            {filter === "all" && <MoversStrip />}

            {pinnedSymbols.length > 0 && (
              <section>
                <h2 className="mb-3 text-sm font-semibold text-muted">Pinned</h2>
                <div className={listClassName}>{pinnedSymbols.map(renderCard)}</div>
              </section>
            )}

            {visibleCategories.map((cat) => {
              const symbols = SYMBOLS.filter((s) => s.category === cat && !hidden.has(s.symbol) && !pinned.has(s.symbol));
              if (symbols.length === 0) return null;
              return (
                <section key={cat}>
                  <h2 className="mb-3 text-sm font-semibold text-muted">{CATEGORY_LABELS[cat]}</h2>
                  <div className={listClassName}>{symbols.map(renderCard)}</div>
                </section>
              );
            })}

            {nothingVisible && (
              <p className="py-12 text-center text-sm text-muted">
                Everything&apos;s hidden. Tap the settings icon to bring instruments back.
              </p>
            )}
          </>
        )}
      </div>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        hidden={hidden}
        onToggle={toggle}
        onShowAll={showAll}
        showHighLow={showHighLow}
        onToggleHighLow={() => setShowHighLow(!showHighLow)}
        showPercentDelta={showPercentDelta}
        onTogglePercentDelta={() => setShowPercentDelta(!showPercentDelta)}
        compactView={compactView}
        onToggleCompactView={() => setCompactView(!compactView)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
      />
    </div>
  );
}
