export default function Sparkline({
  data,
  direction,
}: {
  data: number[];
  direction: "up" | "down" | "flat";
}) {
  if (data.length < 2) return null;

  const w = 64;
  const h = 22;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const stroke =
    direction === "up" ? "var(--color-up)" : direction === "down" ? "var(--color-down)" : "var(--color-muted)";

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0 overflow-visible" aria-hidden>
      <polyline points={points} fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
