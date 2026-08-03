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

export default function Icon({ meta }: { meta: SymbolMeta }) {
  const Flag = meta.flagCode ? FLAGS[meta.flagCode] : undefined;

  if (Flag) {
    return (
      <span className="block h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1 ring-border">
        <Flag className="h-full w-full" title={meta.name} />
      </span>
    );
  }

  return (
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[0.8rem] font-bold text-white shadow-sm"
      style={{ backgroundColor: meta.color }}
      aria-hidden
    >
      {meta.glyph}
    </span>
  );
}
