import type { Metadata } from "next";
import BlockedAccess from "@/components/guest/blocked-access";
import { GuestWeddingProvider } from "@/components/guest/wedding-context";
import { themeFontVars } from "@/lib/fonts";
import { getGuestAccess } from "@/lib/guest-access";
import { coupleTitle } from "@/lib/layouts";
import { dashboardPath, getNameStyle, getStory, moneyFormat, weddingTheme } from "@/lib/tenant";
import { themeColorVars } from "@/lib/themes";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const { wedding, block } = await getGuestAccess(slug);
  const story = await getStory(wedding.id);
  if (!story || block) return { robots: { index: false, follow: false } };
  const names = coupleTitle(story, await getNameStyle(wedding.id)) ?? wedding.slug;
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
  const story = block ? await getStory(wedding.id) : null;
  const names = story ? coupleTitle(story, await getNameStyle(wedding.id)) : null;
  const style = { ...themeColorVars(theme.colors), ...themeFontVars(theme.fonts) } as React.CSSProperties;

  return (
    // data-wedding-theme lets the dashboard's Design tab restyle this live in its preview.
    <div style={style} data-wedding-theme className="flex min-h-screen flex-col bg-background text-foreground">
      {block?.kind === "unavailable" ? (
        <main className="flex min-h-screen items-center justify-center p-6 text-center">
          <div className="flex max-w-md flex-col gap-4">
            {names && <p className="font-(family-name:--script) text-4xl text-burnt-orange">{names}</p>}
            {block.reason === "closed" ? (
              <>
                <h1 className="font-(family-name:--serif) text-3xl">This wedding site has closed</h1>
                <p className="text-foreground/75">Thank you for celebrating with the couple.</p>
              </>
            ) : (
              <>
                <h1 className="font-(family-name:--serif) text-3xl">This site isn&apos;t available</h1>
                <p className="text-foreground/75">Please contact the couple directly.</p>
              </>
            )}
          </div>
        </main>
      ) : block?.kind === "geo" ? (
        <BlockedAccess names={names} codeRejected={block.codeRejected} />
      ) : (
        <GuestWeddingProvider slug={wedding.slug} money={moneyFormat(wedding)}>
          {preview && (
            <div className="fixed inset-x-0 bottom-0 z-banner bg-foreground px-4 py-2.5 text-center text-[13px] text-ivory">
              {wedding.status === "DRAFT"
                ? "Preview — this site isn't published yet, so only you can see it."
                : "Preview — this site's plan has run out, so guests see a closed page. Upgrade in Billing to reopen it."}{" "}
              <a href={dashboardPath(wedding.id)} className="font-semibold underline">
                Back to dashboard
              </a>
            </div>
          )}
          {/* Leave room so the preview banner never covers the footer. */}
          {preview ? <div className="pb-14">{children}</div> : children}
        </GuestWeddingProvider>
      )}
    </div>
  );
}
