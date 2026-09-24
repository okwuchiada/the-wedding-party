import { weddingIcon } from "@/lib/wedding-icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon({ params }: { params: Promise<{ slug: string }> }) {
  return weddingIcon((await params).slug, size.width);
}
