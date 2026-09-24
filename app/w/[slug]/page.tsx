import GuestHome from "@/components/guest/home";
import { getGuestAccess } from "@/lib/guest-access";

export default async function WeddingHomePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { wedding, block } = await getGuestAccess(slug);
  if (block) return null; // the layout explains why
  return <GuestHome weddingId={wedding.id} slug={wedding.slug} />;
}
