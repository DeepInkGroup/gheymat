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

export function formatPercentDelta(changePercent: number | null): Delta {
  if (changePercent === null) return { text: "—", direction: "flat" };
  if (changePercent === 0) return { text: "0%", direction: "flat" };
  const direction = changePercent > 0 ? "up" : "down";
  const sign = changePercent > 0 ? "+" : "";
  return { text: `${sign}${changePercent.toFixed(2)}%`, direction };
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

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * baha24 sends "YYYY-MM-DD HH:mm" (its own format, not ISO — Safari won't
 * reliably parse that via `new Date()`, so this parses it by hand.
 * gold-api.com sends proper ISO 8601 instead, handled as a fallback below.
 * Different instruments can genuinely lag behind each other, so this is
 * shown per-card rather than as one global "as of" time.
 */
export function formatUpdatedAt(raw: string | null): string | null {
  if (!raw) return null;

  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/);
  if (match) {
    const [, y, mo, d, h, mi] = match;
    const todayUTC = new Date().toISOString().slice(0, 10);
    const isToday = `${y}-${mo}-${d}` === todayUTC;
    return isToday ? `${h}:${mi}` : `${MONTHS[Number(mo) - 1]} ${Number(d)}, ${h}:${mi}`;
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  const h = String(date.getUTCHours()).padStart(2, "0");
  const mi = String(date.getUTCMinutes()).padStart(2, "0");
  const todayUTC = new Date().toISOString().slice(0, 10);
  const isToday = date.toISOString().slice(0, 10) === todayUTC;
  return isToday ? `${h}:${mi}` : `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${h}:${mi}`;
}
