import type { ComponentType } from "react";
import { AE, CA, CH, CN, EU, GB, RU, TR, US } from "country-flag-icons/react/1x1";
import type { SymbolMeta } from "@/lib/symbols";

const FLAGS: Record<string, ComponentType<{ className?: string; title?: string }>> = {
  US,
  EU,
  GB,
  AE,
  CN,
  TR,
  RU,
  CA,
  CH,
};

function CoinGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="white" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.2" />
      <path d="M12 9.3v5.4M10.3 10.5l3.4 3M13.7 10.5l-3.4 3" stroke="white" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

function BarGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <path d="M7.5 16.5 9 8h6l1.5 8.5H7.5Z" fill="white" fillOpacity="0.92" />
      <path d="M8.6 11.2h6.8" stroke="var(--color-accent-gold)" strokeWidth="1" strokeOpacity="0.5" />
    </svg>
  );
}

function IngotGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <path
        d="M12 1.6 12.9 4.4 15.8 5 12.9 5.6 12 8.4 11.1 5.6 8.2 5 11.1 4.4Z"
        fill="white"
        fillOpacity="0.95"
      />
      <path d="M8.7 14 10.4 9h3.2l1.7 5H8.7Z" fill="white" fillOpacity="0.95" />
      <path d="M3 19 4.7 14h4.6L11 19H3Z" fill="white" fillOpacity="0.92" />
      <path d="M13 19 14.7 14h4.6L21 19H13Z" fill="white" fillOpacity="0.92" />
    </svg>
  );
}

function GlobeGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="7" stroke="white" strokeWidth="1.4" />
      <ellipse cx="12" cy="12" rx="3" ry="7" stroke="white" strokeWidth="1.1" />
      <path d="M5.3 12h13.4" stroke="white" strokeWidth="1.1" />
    </svg>
  );
}

const GOLD_GLYPHS: Record<NonNullable<SymbolMeta["iconKind"]>, ComponentType> = {
  coin: CoinGlyph,
  bar: BarGlyph,
  globe: GlobeGlyph,
  ingot: IngotGlyph,
};

export default function Icon({ meta }: { meta: SymbolMeta }) {
  const Flag = meta.flagCode ? FLAGS[meta.flagCode] : undefined;

  if (Flag) {
    return (
      <span className="block h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1 ring-border">
        <Flag className="h-full w-full" title={meta.name} />
      </span>
    );
  }

  if (meta.iconFile) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/crypto/${meta.iconFile}.svg`}
        alt={meta.name}
        className="block h-10 w-10 shrink-0 rounded-full ring-1 ring-border"
      />
    );
  }

  const GoldGlyph = meta.iconKind ? GOLD_GLYPHS[meta.iconKind] : undefined;

  return (
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm"
      style={{ backgroundColor: meta.color }}
      aria-hidden
    >
      {GoldGlyph ? (
        <GoldGlyph />
      ) : (
        <span className="text-[0.8rem] font-bold text-white">{meta.glyph}</span>
      )}
    </span>
  );
}
