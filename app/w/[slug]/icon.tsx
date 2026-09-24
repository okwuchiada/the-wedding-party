import { weddingIcon } from "@/lib/wedding-icon";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon({ params }: { params: Promise<{ slug: string }> }) {
  return weddingIcon((await params).slug, size.width);
}
