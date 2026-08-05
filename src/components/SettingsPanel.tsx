"use client";

import { useEffect } from "react";
import { CATEGORY_LABELS, SYMBOLS, type Category } from "@/lib/symbols";

const CATEGORIES: Category[] = ["currency", "gold", "crypto"];

function Switch({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <span
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        on ? "bg-up" : "bg-border"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          on ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </span>
  );
}

export default function SettingsPanel({
  open,
  onClose,
  hidden,
  onToggle,
  onShowAll,
  onHideAll,
  showHighLow,
  onToggleHighLow,
  showPercentDelta,
  onTogglePercentDelta,
  compactView,
  onToggleCompactView,
  soundEnabled,
  onToggleSound,
  notifyEnabled,
  onToggleNotify,
}: {
  open: boolean;
  onClose: () => void;
  hidden: Set<string>;
  onToggle: (symbol: string) => void;
  onShowAll: () => void;
  onHideAll: () => void;
  showHighLow: boolean;
  onToggleHighLow: () => void;
  showPercentDelta: boolean;
  onTogglePercentDelta: () => void;
  compactView: boolean;
  onToggleCompactView: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  notifyEnabled: boolean;
  onToggleNotify: () => void;
}) {
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <button
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="glass safe-bottom relative flex max-h-[80vh] w-full flex-col rounded-t-2xl border border-border bg-surface sm:max-w-md sm:rounded-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Customize instruments</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-background hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          <div className="mb-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Display</h3>
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-2 py-2 hover:bg-background">
              <span className="text-sm text-foreground">Session high / low badge</span>
              <Switch on={showHighLow} onClick={onToggleHighLow} />
            </label>
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-2 py-2 hover:bg-background">
              <span className="text-sm text-foreground">Show change as %</span>
              <Switch on={showPercentDelta} onClick={onTogglePercentDelta} />
            </label>
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-2 py-2 hover:bg-background">
              <span className="text-sm text-foreground">Compact list view</span>
              <Switch on={compactView} onClick={onToggleCompactView} />
            </label>
            <label className="hide-standalone flex cursor-pointer items-center justify-between gap-3 rounded-xl px-2 py-2 hover:bg-background">
              <span className="text-sm text-foreground">
                Sound on big moves
                <span className="block text-xs text-muted">Website only — silent when installed as an app</span>
              </span>
              <Switch on={soundEnabled} onClick={onToggleSound} />
            </label>
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-2 py-2 hover:bg-background">
              <span className="text-sm text-foreground">
                Big move notifications
                <span className="block text-xs text-muted">Notifies you when any instrument moves sharply</span>
              </span>
              <Switch on={notifyEnabled} onClick={onToggleNotify} />
            </label>
          </div>

          {CATEGORIES.map((cat) => (
            <div key={cat} className="mb-4 last:mb-0">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                {CATEGORY_LABELS[cat]}
              </h3>
              <div className="flex flex-col gap-1">
                {SYMBOLS.filter((s) => s.category === cat).map((meta) => {
                  const visible = !hidden.has(meta.symbol);
                  return (
                    <label
                      key={meta.symbol}
                      className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-2 py-2 hover:bg-background"
                    >
                      <span className="text-sm text-foreground">{meta.name}</span>
                      <Switch on={visible} onClick={() => onToggle(meta.symbol)} />
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex shrink-0 gap-2 border-t border-border px-4 py-3">
          <button
            onClick={onShowAll}
            className="flex-1 rounded-xl bg-background py-2 text-sm font-medium text-foreground hover:bg-border/40"
          >
            Show all
          </button>
          <button
            onClick={onHideAll}
            className="flex-1 rounded-xl bg-background py-2 text-sm font-medium text-foreground hover:bg-border/40"
          >
            Hide all
          </button>
        </div>
      </div>
    </div>
  );
}
