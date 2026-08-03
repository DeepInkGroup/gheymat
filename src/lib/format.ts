export function formatPrice(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(value);
  }
  const maximumFractionDigits = abs >= 1 ? 2 : 4;
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
    minimumFractionDigits: 0,
  }).format(value);
}

export interface Delta {
  text: string;
  direction: "up" | "down" | "flat";
}

export function formatDelta(price: number, changePercent: number | null): Delta {
  if (changePercent === null) return { text: "—", direction: "flat" };
  const amount = price * (changePercent / 100);
  const compact = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

  if (compact === "0") return { text: "0", direction: "flat" };

  const direction = amount > 0 ? "up" : "down";
  const sign = amount > 0 ? "+" : "-";
  return { text: `${sign}${compact}`, direction };
}

export function formatTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date(iso));
  } catch {
    return "";
  }
}
