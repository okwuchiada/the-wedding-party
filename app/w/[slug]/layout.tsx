import BlockedAccess from "@/components/guest/blocked-access";
import { GuestWeddingProvider } from "@/components/guest/wedding-context";
import { checkGeoAccess } from "@/lib/geo";
import { dashboardPath, getGuestWedding } from "@/lib/tenant";

export default async function WeddingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { wedding, preview } = await getGuestWedding(slug);

  const geo = await checkGeoAccess(wedding);
  if (geo.blocked) return <BlockedAccess codeRejected={geo.codeRejected} />;

  return (
    <GuestWeddingProvider slug={wedding.slug}>
      {preview && (
        <div className="fixed inset-x-0 bottom-0 z-60 bg-foreground px-4 py-2 text-center text-xs text-ivory">
          Preview — this site isn&apos;t published yet, so only you can see it.{" "}
          <a href={dashboardPath(wedding.id)} className="underline hover:text-burnt-orange">
            Back to dashboard
          </a>
        </div>
      )}
      {children}
    </GuestWeddingProvider>
  );
}
