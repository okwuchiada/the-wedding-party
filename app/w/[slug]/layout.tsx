import type { Metadata } from "next";
import BlockedAccess from "@/components/guest/blocked-access";
import { GuestWeddingProvider } from "@/components/guest/wedding-context";
import { themeFontVars } from "@/lib/fonts";
import { getGuestAccess } from "@/lib/guest-access";
import { dashboardPath, getStory, moneyFormat, weddingTheme } from "@/lib/tenant";
import { themeColorVars } from "@/lib/themes";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const { wedding, block } = await getGuestAccess(slug);
  const story = await getStory(wedding.id);
  if (!story || block) return { robots: { index: false, follow: false } };
  const names = `${story.brideName} & ${story.groomName}`;
  return {
    title: names,
    description: story.tagline ?? `Celebrate with ${names}`,
    robots: { index: false, follow: false },
  };
}

export default async function WeddingLayout({ children, params }: Params & { children: React.ReactNode }) {
  const { slug } = await params;
  const { wedding, preview, block } = await getGuestAccess(slug);
  const theme = weddingTheme(wedding);
  const style = { ...themeColorVars(theme.colors), ...themeFontVars(theme.fonts) } as React.CSSProperties;

  return (
    // data-wedding-theme lets the dashboard's Design tab restyle this live in its preview.
    <div style={style} data-wedding-theme className="flex min-h-screen flex-col bg-background text-foreground">
      {block?.kind === "unavailable" ? (
        <main className="flex min-h-screen items-center justify-center p-6 text-center">
          <div className="max-w-md">
            <h1 className="font-(family-name:--serif) text-3xl">This site isn&apos;t available</h1>
            <p className="mt-4 text-foreground/70">Please contact the couple directly.</p>
          </div>
        </main>
      ) : block?.kind === "geo" ? (
        <BlockedAccess codeRejected={block.codeRejected} />
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
