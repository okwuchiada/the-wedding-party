export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
export const MAX_UPLOAD_LABEL = "25MB";

/** S3 key prefix for a wedding's uploads, e.g. weddings/abc/registry. */
export function weddingUploadFolder(weddingId: string, folder: string) {
  return `weddings/${weddingId}/${folder}`;
}
