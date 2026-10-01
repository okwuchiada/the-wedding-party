export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
export const MAX_UPLOAD_LABEL = "25MB";

/** S3 key prefix for a wedding's uploads, e.g. weddings/abc/registry. */
export function weddingUploadFolder(weddingId: string, folder: string) {
  return `weddings/${weddingId}/${folder}`;
}

/** Why a declared upload size can't be accepted, or null. S3 enforces the size once signed. */
export function uploadSizeError(size: unknown, label = "File") {
  if (typeof size !== "number" || !Number.isSafeInteger(size) || size <= 0) return "Upload failed. Please try again.";
  if (size > MAX_UPLOAD_BYTES) return `${label} is over the ${MAX_UPLOAD_LABEL} limit`;
  return null;
}
