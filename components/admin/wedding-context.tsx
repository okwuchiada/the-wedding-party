"use client";

import { createContext, useContext } from "react";

const AdminWeddingContext = createContext<string | null>(null);

export function AdminWeddingProvider({
  weddingId,
  children,
}: {
  weddingId: string;
  children: React.ReactNode;
}) {
  return <AdminWeddingContext.Provider value={weddingId}>{children}</AdminWeddingContext.Provider>;
}

/** The wedding being managed; every admin server action takes it first. */
export function useAdminWeddingId() {
  const weddingId = useContext(AdminWeddingContext);
  if (!weddingId) throw new Error("useAdminWeddingId must be used inside AdminWeddingProvider");
  return weddingId;
}
