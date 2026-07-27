"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

export type RegistryItemFormState = { error?: string; success?: boolean } | undefined;

function parseRegistryItemForm(formData: FormData) {
  const name = formData.get("name");
  const category = formData.get("category");
  const price = formData.get("price");
  const image = formData.get("image");
  const externalUrl = formData.get("externalUrl");

  if (typeof name !== "string" || !name.trim()) {
    return { error: "Name is required" } as const;
  }
  if (typeof category !== "string" || !category.trim()) {
    return { error: "Category is required" } as const;
  }
  const priceNum = Number(price);
  if (!Number.isFinite(priceNum) || priceNum <= 0) {
    return { error: "Enter a valid price" } as const;
  }
  if (typeof image !== "string" || !image.trim()) {
    return { error: "Image URL is required" } as const;
  }

  return {
    data: {
      name: name.trim(),
      category: category.trim(),
      priceCents: Math.round(priceNum * 100),
      image: image.trim(),
      externalUrl: typeof externalUrl === "string" && externalUrl.trim() ? externalUrl.trim() : null,
    },
  } as const;
}

export async function createRegistryItem(
  _prevState: RegistryItemFormState,
  formData: FormData
): Promise<RegistryItemFormState> {
  await verifySession();

  const parsed = parseRegistryItemForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  await prisma.registryItem.create({ data: parsed.data });

  revalidatePath("/admin");
  revalidatePath("/");

  return { success: true };
}

export async function updateRegistryItem(
  _prevState: RegistryItemFormState,
  formData: FormData
): Promise<RegistryItemFormState> {
  await verifySession();

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: "Missing item id" };
  }

  const parsed = parseRegistryItemForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  await prisma.registryItem.update({ where: { id }, data: parsed.data });

  revalidatePath("/admin");
  revalidatePath("/");

  return { success: true };
}

export type ClaimRegistryItemState = { error?: string; success?: boolean } | undefined;

export async function claimRegistryItem(
  _prevState: ClaimRegistryItemState,
  formData: FormData
): Promise<ClaimRegistryItemState> {
  const registryItemId = formData.get("registryItemId");
  const guestName = formData.get("guestName");

  if (typeof registryItemId !== "string" || !registryItemId) {
    return { error: "Missing item" };
  }
  if (typeof guestName !== "string" || !guestName.trim()) {
    return { error: "Please enter your name" };
  }

  const result = await prisma.registryItem.updateMany({
    where: { id: registryItemId, claimedBy: null },
    data: { claimedBy: guestName.trim() },
  });

  if (result.count === 0) {
    return { error: "Sorry, someone already claimed this item." };
  }

  revalidatePath("/admin");
  revalidatePath("/");

  return { success: true };
}

export async function deleteRegistryItem(id: string): Promise<{ error?: string }> {
  await verifySession();

  const contributionCount = await prisma.contribution.count({ where: { registryItemId: id } });
  if (contributionCount > 0) {
    return { error: "Can't delete an item that already has contributions." };
  }

  await prisma.registryItem.delete({ where: { id } });

  revalidatePath("/admin");
  revalidatePath("/");

  return {};
}
