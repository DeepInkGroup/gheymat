"use client";

import { useEffect, useState } from "react";

type Choice = "system" | "light" | "dark";

const STORAGE_KEY = "gheymat:theme";

function applyClass(isDark: boolean) {
  document.documentElement.classList.toggle("dark", isDark);
}

function applyThemeColorMeta(choice: Choice) {
  const light = document.querySelector('meta[name="theme-color"][media*="light"]');
  const dark = document.querySelector('meta[name="theme-color"][media*="dark"]');
  if (!light || !dark) return;
  if (choice === "system") {
    light.setAttribute("media", "(prefers-color-scheme: light)");
    dark.setAttribute("media", "(prefers-color-scheme: dark)");
  } else {
    // Collapse both to the same resolved color so neither media query fights the override.
    const color = choice === "dark" ? "#0b0d10" : "#f7f5f0";
    light.setAttribute("content", color);
    dark.setAttribute("content", color);
    light.setAttribute("media", "");
    dark.setAttribute("media", "");
  }
}

export default function ThemeToggle() {
  const [choice, setChoice] = useState<Choice>("system");

  useEffect(() => {
    // Mirrors the inline blocking script's class decision into React state
    // once after mount; the class itself is already correct pre-paint.
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setChoice(stored);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    applyThemeColorMeta(choice);
    if (choice !== "system") {
      applyClass(choice === "dark");
      return;
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    applyClass(mq.matches);
    const onChange = () => applyClass(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [choice]);

  function cycle() {
    setChoice((current) => {
      const next: Choice = current === "system" ? "light" : current === "light" ? "dark" : "system";
      try {
        if (next === "system") window.localStorage.removeItem(STORAGE_KEY);
        else window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore
      }
      return next;
    });
  }

  return (
    <button
      onClick={cycle}
      aria-label={`Theme: ${choice}. Tap to change.`}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-foreground"
    >
      {choice === "light" && (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
        </svg>
      )}
      {choice === "dark" && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M20.4 14.7A8.5 8.5 0 0 1 9.3 3.6a.75.75 0 0 0-.94-.98A10 10 0 1 0 21.4 15.6a.75.75 0 0 0-1-.9Z" />
        </svg>
      )}
      {choice === "system" && (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor" stroke="none" />
        </svg>
      )}
    </button>
  );
}
