import type { Metadata } from "next";
import BlockedAccess from "@/components/guest/blocked-access";
import { GuestWeddingProvider } from "@/components/guest/wedding-context";
import { themeFontVars } from "@/lib/fonts";
import { checkGeoAccess } from "@/lib/geo";
import { dashboardPath, getGuestWedding, getStory, moneyFormat, weddingTheme } from "@/lib/tenant";
import { themeColorVars } from "@/lib/themes";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const { wedding } = await getGuestWedding(slug);
  const story = await getStory(wedding.id);
  if (!story) return {};
  const names = `${story.brideName} & ${story.groomName}`;
  return {
    title: names,
    description: story.tagline ?? `Celebrate with ${names}`,
    robots: { index: false, follow: false },
  };
}

export default async function WeddingLayout({ children, params }: Params & { children: React.ReactNode }) {
  const { slug } = await params;
  const { wedding, preview } = await getGuestWedding(slug);
  const theme = weddingTheme(wedding);
  const style = { ...themeColorVars(theme.colors), ...themeFontVars(theme.fonts) } as React.CSSProperties;

  const geo = await checkGeoAccess(wedding);

  return (
    <div style={style} className="flex min-h-screen flex-col bg-background text-foreground">
      {geo.blocked ? (
        <BlockedAccess codeRejected={geo.codeRejected} />
      ) : (
        <GuestWeddingProvider slug={wedding.slug} money={moneyFormat(wedding)}>
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
      )}
    </div>
  );
}
