import GuestHome from "@/components/guest/home";
import { canManageWedding } from "@/lib/dal";
import { getGuestAccess } from "@/lib/guest-access";
import { resolveLayout, withPreview } from "@/lib/layouts";

export default async function WeddingHomePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const { wedding, block } = await getGuestAccess(slug);
  if (block) return null; // the layout explains why

  const saved = resolveLayout(wedding.theme);
  // The Design tab previews unsaved layouts through the URL; only people who manage
  // this wedding get that, so guests can't be shown a layout that isn't published.
  const layout = (await canManageWedding(wedding.id, "view")) ? withPreview(saved, await searchParams) : saved;

  return <GuestHome weddingId={wedding.id} slug={wedding.slug} layout={layout} />;
}
