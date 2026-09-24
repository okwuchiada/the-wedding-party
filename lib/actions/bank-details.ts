"use server";

import { requireWeddingAccess } from "@/lib/dal";
import { revalidateWedding } from "@/lib/tenant";

export type SaveBankDetailsState = { error?: string; success?: boolean } | undefined;

export async function saveBankDetails(
  weddingId: string,
  _prevState: SaveBankDetailsState,
  formData: FormData
): Promise<SaveBankDetailsState> {
  const { wedding, db } = await requireWeddingAccess(weddingId);

  const name = formData.get("name");
  const bank = formData.get("bank");
  const account = formData.get("account");
  const routing = formData.get("routing");
  const swift = formData.get("swift");

  if (typeof name !== "string" || !name.trim()) return { error: "Account name is required" };
  if (typeof bank !== "string" || !bank.trim()) return { error: "Bank name is required" };
  if (typeof account !== "string" || !account.trim()) return { error: "Account number is required" };
  if (typeof routing !== "string" || !routing.trim()) return { error: "Routing number is required" };

  const trimmed = {
    name: name.trim(),
    bank: bank.trim(),
    account: account.trim(),
    routing: routing.trim(),
    swift: typeof swift === "string" && swift.trim() ? swift.trim() : null,
  };

  await db.bankDetails.upsert({
    where: { weddingId: wedding.id },
    update: trimmed,
    create: { ...trimmed, weddingId: wedding.id },
  });

  revalidateWedding(wedding);

  return { success: true };
}
