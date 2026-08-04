"use client";

import { useCallback, useEffect, useRef } from "react";

type AudioContextCtor = typeof AudioContext;

/**
 * A short synthesized tone (Web Audio, no audio file needed) for the
 * single biggest price move each poll cycle. Website only, by design —
 * play() no-ops when running as an installed PWA (checked via the
 * `standalone` class StandaloneDetector sets on <html>).
 */
export function useMoveSound(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!enabled || ctxRef.current) return;
    try {
      const Ctor: AudioContextCtor =
        window.AudioContext ?? (window as unknown as { webkitAudioContext: AudioContextCtor }).webkitAudioContext;
      ctxRef.current = new Ctor();
    } catch {
      // ignore — unsupported or blocked
    }
  }, [enabled]);

  const play = useCallback(
    (direction: "up" | "down") => {
      if (!enabled) return;
      if (document.documentElement.classList.contains("standalone")) return;
      const ctx = ctxRef.current;
      if (!ctx) return;
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = direction === "up" ? 880 : 440;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } catch {
        // ignore
      }
    },
    [enabled]
  );

  return play;
}
