"use client";

import { createContext, useContext } from "react";
import type { MoneyFormat } from "@/lib/money";

type AdminWedding = { weddingId: string; money: MoneyFormat };

const AdminWeddingContext = createContext<AdminWedding | null>(null);

export function AdminWeddingProvider({ children, ...value }: AdminWedding & { children: React.ReactNode }) {
  return <AdminWeddingContext.Provider value={value}>{children}</AdminWeddingContext.Provider>;
}

function useAdminWedding() {
  const ctx = useContext(AdminWeddingContext);
  if (!ctx) throw new Error("Admin components must be used inside AdminWeddingProvider");
  return ctx;
}

/** The wedding being managed; every admin server action takes it first. */
export function useAdminWeddingId() {
  return useAdminWedding().weddingId;
}

export function useAdminMoney() {
  return useAdminWedding().money;
}
