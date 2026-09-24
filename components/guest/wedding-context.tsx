"use client";

import { createContext, useContext } from "react";
import type { MoneyFormat } from "@/lib/money";

type GuestWedding = { slug: string; money: MoneyFormat };

const GuestWeddingContext = createContext<GuestWedding | null>(null);

export function GuestWeddingProvider({ children, ...value }: GuestWedding & { children: React.ReactNode }) {
  return <GuestWeddingContext.Provider value={value}>{children}</GuestWeddingContext.Provider>;
}

function useGuestWedding() {
  const ctx = useContext(GuestWeddingContext);
  if (!ctx) throw new Error("Guest components must be used inside GuestWeddingProvider");
  return ctx;
}

/** The slug of the wedding being viewed; public server actions take it first. */
export function useGuestSlug() {
  return useGuestWedding().slug;
}

export function useGuestMoney() {
  return useGuestWedding().money;
}
