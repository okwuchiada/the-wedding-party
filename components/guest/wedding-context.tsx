"use client";

import { createContext, useContext } from "react";

const GuestWeddingContext = createContext<{ slug: string } | null>(null);

export function GuestWeddingProvider({ slug, children }: { slug: string; children: React.ReactNode }) {
  return <GuestWeddingContext.Provider value={{ slug }}>{children}</GuestWeddingContext.Provider>;
}

/** The slug of the wedding being viewed; public server actions take it first. */
export function useGuestSlug() {
  const ctx = useContext(GuestWeddingContext);
  if (!ctx) throw new Error("useGuestSlug must be used inside GuestWeddingProvider");
  return ctx.slug;
}
