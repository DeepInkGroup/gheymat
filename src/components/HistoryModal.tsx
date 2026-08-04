"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/format";

interface HistoryPoint {
  t: number;
  p: number;
}

// The cron snapshot runs once a day (Vercel Hobby plan's cron limit), so
// a 1-day range would almost always be empty — 7D/30D are what's
// actually meaningful at that cadence.
const RANGES = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
];

export default function HistoryModal({
  symbol,
  name,
  unit,
  onClose,
}: {
  symbol: string;
  name: string;
  unit: string;
  onClose: () => void;
}) {
  const [days, setDays] = useState(7);
  const [points, setPoints] = useState<HistoryPoint[] | null>(null);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/history/${symbol}?days=${days}`);
        const json = await res.json();
        if (cancelled) return;
        setConfigured(json.configured !== false);
        setPoints(json.points ?? []);
      } catch {
        if (!cancelled) setPoints([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [symbol, days]);

  const hasEnough = (points?.length ?? 0) >= 2;
  const values = points?.map((p) => p.p) ?? [];
  const min = hasEnough ? Math.min(...values) : null;
  const max = hasEnough ? Math.max(...values) : null;
  const first = hasEnough ? values[0] : null;
  const last = hasEnough ? values[values.length - 1] : null;
  const changePct = first && last ? ((last - first) / first) * 100 : null;
  const direction = changePct === null || changePct === 0 ? "flat" : changePct > 0 ? "up" : "down";

  const chartW = 320;
  const chartH = 120;
  const chartPoints =
    hasEnough && min !== null && max !== null
      ? points!
          .map((pt, i) => {
            const x = (i / (points!.length - 1)) * chartW;
            const range = max - min || 1;
            const y = chartH - ((pt.p - min) / range) * chartH;
            return `${x.toFixed(1)},${y.toFixed(1)}`;
          })
          .join(" ")
      : "";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <button className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-label="Close" onClick={onClose} />
      <div className="glass safe-bottom relative flex w-full flex-col rounded-t-2xl border border-border bg-surface sm:max-w-md sm:rounded-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">{name}</h2>
            <p className="num text-xs text-muted">{symbol} history</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-background hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <div className="px-4 py-4">
          <div className="mb-3 flex gap-1.5">
            {RANGES.map((r) => (
              <button
                key={r.days}
                onClick={() => setDays(r.days)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  days === r.days ? "bg-foreground text-background" : "bg-background text-muted hover:text-foreground"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex h-[140px] items-center justify-center text-sm text-muted">Loading…</div>
          ) : !configured ? (
            <div className="flex h-[140px] flex-col items-center justify-center gap-1 px-4 text-center">
              <p className="text-sm font-medium text-foreground">History isn&apos;t set up yet</p>
              <p className="text-xs text-muted">This needs a database connected to the app.</p>
            </div>
          ) : !hasEnough ? (
            <div className="flex h-[140px] flex-col items-center justify-center gap-1 px-4 text-center">
              <p className="text-sm font-medium text-foreground">Not enough data yet</p>
              <p className="text-xs text-muted">History is still being collected — check back soon.</p>
            </div>
          ) : (
            <>
              <div className="mb-2 flex items-baseline justify-between">
                <div className="num text-2xl font-extrabold text-foreground">
                  {formatPrice(last!)}
                  <span className="ms-1.5 text-xs font-normal text-muted">{unit}</span>
                </div>
                <div
                  className={`num text-sm font-semibold ${
                    direction === "up" ? "text-up" : direction === "down" ? "text-down" : "text-muted"
                  }`}
                >
                  {direction === "up" && "▲ "}
                  {direction === "down" && "▼ "}
                  {changePct !== null ? `${changePct > 0 ? "+" : ""}${changePct.toFixed(2)}%` : "—"}
                </div>
              </div>

              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" preserveAspectRatio="none">
                <polyline
                  points={chartPoints}
                  fill="none"
                  stroke={direction === "up" ? "var(--color-up)" : direction === "down" ? "var(--color-down)" : "var(--color-muted)"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <div className="num mt-2 flex justify-between text-[0.7rem] text-muted">
                <span>L {formatPrice(min!)}</span>
                <span>H {formatPrice(max!)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

