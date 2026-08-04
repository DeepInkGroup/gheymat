"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import Sparkline from "./Sparkline";
import type { SymbolMeta } from "@/lib/symbols";
import { UNIT_LABELS } from "@/lib/symbols";
import { formatDelta, formatPrice, formatUpdatedAt } from "@/lib/format";
import type { Alert } from "@/lib/usePriceAlerts";

export default function PriceCard({
  meta,
  price,
  changePercent,
  updatedAt,
  history,
  pinned,
  onTogglePin,
  showHighLow,
  alert,
  onSetAlert,
  onClearAlert,
}: {
  meta: SymbolMeta;
  price: number;
  changePercent: number | null;
  updatedAt: string | null;
  history: number[];
  pinned: boolean;
  onTogglePin: () => void;
  showHighLow: boolean;
  alert: Alert | undefined;
  onSetAlert: (alert: Alert) => void;
  onClearAlert: () => void;
}) {
  const prevPrice = useRef(price);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [alertInput, setAlertInput] = useState("");
  const [alertDirection, setAlertDirection] = useState<"above" | "below">("above");

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
  const high = history.length >= 2 ? Math.max(...history) : null;
  const low = history.length >= 2 ? Math.min(...history) : null;

  function openMenu() {
    setAlertInput(alert ? String(alert.target) : String(price));
    setAlertDirection(alert?.direction ?? "above");
    setMenuOpen((open) => !open);
  }

  async function handleShare() {
    const text = `${meta.name} (${meta.symbol}): ${formatPrice(price)} ${UNIT_LABELS[meta.unit]} (${delta.text}) — via Gheymat ${window.location.origin}`;
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // user cancelled — ignore
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  async function handleSaveAlert() {
    const target = Number(alertInput);
    if (!Number.isFinite(target) || target <= 0) return;
    if ("Notification" in window && Notification.permission === "default") {
      try {
        await Notification.requestPermission();
      } catch {
        // ignore
      }
    }
    onSetAlert({ target, direction: alertDirection });
  }

  return (
    <div
      className={`glass relative rounded-2xl border border-border bg-surface p-4 shadow-sm backdrop-blur-md transition-colors duration-700 ${
        flash === "up" ? "bg-up/10" : flash === "down" ? "bg-down/10" : ""
      }`}
    >
      <div className="absolute right-2 top-2 flex items-center gap-0.5">
        <button
          onClick={onTogglePin}
          aria-label={pinned ? `Unpin ${meta.name}` : `Pin ${meta.name}`}
          aria-pressed={pinned}
          className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
            pinned ? "text-accent-gold" : "text-muted hover:text-foreground"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={pinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          onClick={openMenu}
          aria-label={`More actions for ${meta.name}`}
          aria-expanded={menuOpen}
          className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
            alert ? "text-accent-currency" : "text-muted hover:text-foreground"
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <circle cx="5" cy="12" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="19" cy="12" r="1.8" />
          </svg>
        </button>
      </div>

      <div className="flex items-start justify-between gap-2 pe-12">
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

      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
        {updated && <div className="num text-[0.65rem] text-muted">Updated {updated}</div>}
        {showHighLow && high !== null && low !== null && (
          <div className="num text-[0.65rem] text-muted">
            H {formatPrice(high)} · L {formatPrice(low)}
          </div>
        )}
        {alert && (
          <div className="num text-[0.65rem] text-accent-currency">
            🔔 {alert.direction === "above" ? "≥" : "≤"} {formatPrice(alert.target)}
          </div>
        )}
      </div>

      {menuOpen && (
        <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-background py-1.5 text-xs font-medium text-foreground hover:bg-border/40"
          >
            {copied ? "Copied" : "Share"}
          </button>

          <div className="flex items-center gap-1.5">
            <input
              type="number"
              inputMode="decimal"
              value={alertInput}
              onChange={(e) => setAlertInput(e.target.value)}
              className="num w-0 min-w-0 flex-1 rounded-xl border border-border bg-background px-2 py-1.5 text-xs text-foreground"
              placeholder="Target price"
            />
            <select
              value={alertDirection}
              onChange={(e) => setAlertDirection(e.target.value as "above" | "below")}
              className="rounded-xl border border-border bg-background px-1.5 py-1.5 text-xs text-foreground"
            >
              <option value="above">≥</option>
              <option value="below">≤</option>
            </select>
            <button
              onClick={handleSaveAlert}
              className="shrink-0 rounded-xl bg-foreground px-3 py-1.5 text-xs font-medium text-background"
            >
              Alert
            </button>
            {alert && (
              <button
                onClick={onClearAlert}
                aria-label="Clear alert"
                className="shrink-0 rounded-xl border border-border px-2 py-1.5 text-xs text-muted hover:text-foreground"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
