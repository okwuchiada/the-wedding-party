"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Re-renders the page every `intervalMs` while the tab is visible, and once
 * when it becomes visible again. Background tabs cost nothing, which matters on
 * the wedding day when hundreds of guests leave the site open.
 */
export default function LiveRefresh({ intervalMs = 60_000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    let id: ReturnType<typeof setInterval> | undefined;
    let hiddenAt: number | null = null;

    const start = () => {
      // Spread guests' refreshes out instead of every tab firing in lockstep.
      const jittered = intervalMs * (0.85 + Math.random() * 0.3);
      id = setInterval(() => router.refresh(), jittered);
    };
    const stop = () => clearInterval(id);

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
        stop();
        return;
      }
      if (hiddenAt !== null && Date.now() - hiddenAt >= intervalMs) router.refresh();
      hiddenAt = null;
      start();
    };

    if (document.visibilityState === "visible") start();
    else hiddenAt = Date.now();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [router, intervalMs]);

  return null;
}
