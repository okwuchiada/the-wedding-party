import "server-only";
import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { MAX_UPLOAD_BYTES } from "@/lib/uploads";

export const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const S3_BUCKET = process.env.AWS_S3_BUCKET_NAME!;

export function publicUrlForKey(key: string) {
  return `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

/** The object key of a URL in our bucket, or null for anything else (pasted links, other hosts). */
export function keyForPublicUrl(url: string) {
  const prefix = publicUrlForKey("");
  if (!url.startsWith(prefix)) return null;
  const key = url.slice(prefix.length).split(/[?#]/)[0];
  return key.startsWith("weddings/") ? key : null;
}

/**
 * A short-lived URL for one PUT of exactly `contentLength` bytes. The length is
 * part of the signature, so S3 rejects a body of any other size: the size the
 * browser declares is the size that gets stored.
 */
export async function createPresignedUploadUrl(
  folder: string,
  fileName: string,
  contentType: string,
  contentLength: number
) {
  if (!Number.isSafeInteger(contentLength) || contentLength <= 0 || contentLength > MAX_UPLOAD_BYTES) {
    throw new Error("Invalid upload size");
  }
  const extension = fileName.includes(".") ? fileName.split(".").pop() : "";
  const key = `${folder}/${randomUUID()}${extension ? `.${extension}` : ""}`;

  const uploadUrl = await getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, ContentType: contentType, ContentLength: contentLength }),
    { expiresIn: 120, signableHeaders: new Set(["content-length", "content-type"]) }
  );

  return { uploadUrl, publicUrl: publicUrlForKey(key) };
}

/** Deletes objects by key. Best effort: a failed delete only leaves an orphan. */
export async function deleteObjects(keys: string[]) {
  await Promise.all(
    keys.map((Key) =>
      s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key })).catch((error) => {
        console.error(`Failed to delete upload ${Key}`, error);
      })
    )
  );
}
