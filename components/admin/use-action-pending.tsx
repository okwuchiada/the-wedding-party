"use client";

import { useState } from "react";

export function useActionPending() {
  const [pending, setPending] = useState<Record<string, string>>({});

  const run = async (id: string, action: string, fn: () => Promise<void>) => {
    setPending((prev) => ({ ...prev, [id]: action }));
    try {
      await fn();
    } finally {
      setPending((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const isPending = (id: string, action?: string) =>
    action ? pending[id] === action : id in pending;

  return { run, isPending };
}
