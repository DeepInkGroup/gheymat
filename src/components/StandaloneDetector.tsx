"use client";

import { useEffect } from "react";

export default function StandaloneDetector() {
  useEffect(() => {
    const nav = navigator as Navigator & { standalone?: boolean };
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
    if (isStandalone) {
      document.documentElement.classList.add("standalone");
    }
  }, []);

  return null;
}
