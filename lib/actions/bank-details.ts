"use server";

import { requireWeddingAccess } from "@/lib/dal";
import { revalidateWedding } from "@/lib/tenant";
import { bankDetailsError, normaliseAccountNumber } from "@/lib/bank-account";

export type SaveBankDetailsState = { error?: string; success?: boolean } | undefined;

export async function saveBankDetails(
  weddingId: string,
  _prevState: SaveBankDetailsState,
  formData: FormData
): Promise<SaveBankDetailsState> {
  const { wedding, db } = await requireWeddingAccess(weddingId, "edit", "saveBankDetails");

  const name = formData.get("name");
  const bank = formData.get("bank");
  const account = formData.get("account");
  const routing = formData.get("routing");
  const swift = formData.get("swift");

  const input = {
    currency: wedding.currency,
    name: typeof name === "string" ? name : "",
    bank: typeof bank === "string" ? bank : "",
    account: typeof account === "string" ? account : "",
  };
  const error = bankDetailsError(input);
  if (error) return { error };

  const trimmed = {
    name: input.name.trim(),
    bank: input.bank.trim(),
    account: normaliseAccountNumber(input.account),
    // The form no longer asks for a routing number; the column stays for older rows.
    routing: typeof routing === "string" ? routing.trim() : "",
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
