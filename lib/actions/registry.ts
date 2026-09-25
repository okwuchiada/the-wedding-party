"use server";

import { requireWeddingAccess } from "@/lib/dal";
import { createPresignedUploadUrl } from "@/lib/s3";
import { revalidateWedding } from "@/lib/tenant";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL, weddingUploadFolder } from "@/lib/uploads";

export type CreateRegistryItemUploadUrlState =
  | { error?: string; uploadUrl?: string; publicUrl?: string }
  | undefined;

export async function createRegistryItemUploadUrl(
  weddingId: string,
  fileName: string,
  fileType: string,
  fileSize: number
): Promise<CreateRegistryItemUploadUrlState> {
  const { wedding } = await requireWeddingAccess(weddingId, "edit");

  if (!fileType.startsWith("image/")) {
    return { error: "Only image files are allowed" };
  }
  if (fileSize > MAX_UPLOAD_BYTES) {
    return { error: `Image is over the ${MAX_UPLOAD_LABEL} limit` };
  }

  const { uploadUrl, publicUrl } = await createPresignedUploadUrl(
    weddingUploadFolder(wedding.id, "registry"),
    fileName,
    fileType
  );
  return { uploadUrl, publicUrl };
}

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
    return { error: "An image URL or uploaded photo is required" } as const;
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
  weddingId: string,
  _prevState: RegistryItemFormState,
  formData: FormData
): Promise<RegistryItemFormState> {
  const { wedding, db } = await requireWeddingAccess(weddingId, "edit", "createRegistryItem");

  const parsed = parseRegistryItemForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  await db.registryItem.create({ data: { ...parsed.data, weddingId: wedding.id } });

  revalidateWedding(wedding);

  return { success: true };
}

export async function updateRegistryItem(
  weddingId: string,
  _prevState: RegistryItemFormState,
  formData: FormData
): Promise<RegistryItemFormState> {
  const { wedding, db } = await requireWeddingAccess(weddingId, "edit", "updateRegistryItem");

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return { error: "Missing item id" };
  }

  const parsed = parseRegistryItemForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  await db.registryItem.update({ where: { id, weddingId: wedding.id }, data: parsed.data });

  revalidateWedding(wedding);

  return { success: true };
}

export async function deleteRegistryItem(
  weddingId: string,
  id: string
): Promise<{ error?: string }> {
  const { wedding, db } = await requireWeddingAccess(weddingId, "edit", "deleteRegistryItem");

  const contributionCount = await db.contribution.count({
    where: { weddingId: wedding.id, registryItemId: id },
  });
  if (contributionCount > 0) {
    return { error: "Can't delete an item that already has contributions." };
  }

  await db.registryItem.delete({ where: { id, weddingId: wedding.id } });

  revalidateWedding(wedding);

  return {};
}
