import "server-only";
import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

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

export async function uploadFileToS3(file: File, folder: string) {
  const extension = file.name.includes(".") ? file.name.split(".").pop() : "";
  const key = `${folder}/${randomUUID()}${extension ? `.${extension}` : ""}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  await s3.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    })
  );

  return publicUrlForKey(key);
}
