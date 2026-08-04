import type { Delta } from "./format";

export interface ShareCardParams {
  name: string;
  symbol: string;
  price: string;
  unit: string;
  delta: Delta;
}

function drawBrandMark(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const grad = ctx.createLinearGradient(x, y, x + size, y + size);
  grad.addColorStop(0, "#EF4136");
  grad.addColorStop(0.25, "#F7941D");
  grad.addColorStop(0.5, "#FFD200");
  grad.addColorStop(0.72, "#39B54A");
  grad.addColorStop(1, "#2E9DF7");

  const cx = x + size / 2;
  const cy = y + size / 2;
  const outerR = size * 0.42;
  const innerR = size * 0.3;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 2.0, 2.0 + (2 * Math.PI * 320) / 360, false);
  ctx.arc(cx, cy, innerR, 2.0 + (2 * Math.PI * 320) / 360, 2.0, true);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.fillStyle = grad;
  ctx.font = `800 ${size * 0.46}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("$", cx, cy + size * 0.02);
  ctx.restore();
}

/** Renders a branded, shareable price card as a PNG blob. Pure Canvas 2D — no external assets. */
export async function createShareImage(params: ShareCardParams): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  const W = 600;
  const H = 400;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0b0d10");
  bg.addColorStop(0.55, "#1b1440");
  bg.addColorStop(1, "#123a6b");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  drawBrandMark(ctx, 40, 40, 44);
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "700 20px -apple-system, Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("Gheymat", 96, 62);

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "600 13px -apple-system, Arial, sans-serif";
  ctx.fillText("LIVE PRICE", 40, 130);

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 34px -apple-system, Arial, sans-serif";
  ctx.fillText(params.name, 40, 168);

  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "600 16px -apple-system, Arial, sans-serif";
  ctx.fillText(params.symbol, 40, 196);

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 54px -apple-system, Arial, sans-serif";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(params.price, 40, 270);
  const priceWidth = ctx.measureText(params.price).width;

  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "600 18px -apple-system, Arial, sans-serif";
  ctx.fillText(params.unit, 48 + priceWidth, 270);

  const deltaColor = params.delta.direction === "up" ? "#34d766" : params.delta.direction === "down" ? "#ff5470" : "rgba(255,255,255,0.6)";
  const arrow = params.delta.direction === "up" ? "▲ " : params.delta.direction === "down" ? "▼ " : "";
  ctx.fillStyle = deltaColor;
  ctx.font = "700 20px -apple-system, Arial, sans-serif";
  ctx.fillText(`${arrow}${params.delta.text}`, 40, 306);

  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "500 13px -apple-system, Arial, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("gheymat.vercel.app", W - 40, H - 32);

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), "image/png"));
}
