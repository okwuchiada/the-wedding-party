import GuestHome from "@/components/guest/home";
import { getGuestWedding } from "@/lib/tenant";

export default async function WeddingHomePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { wedding } = await getGuestWedding(slug);
  return <GuestHome weddingId={wedding.id} slug={wedding.slug} />;
}
