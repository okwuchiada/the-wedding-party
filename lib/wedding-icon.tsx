import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { FONT_OPTIONS } from "@/lib/font-options";
import { loadGoogleFont } from "@/lib/og-font";
import { getWeddingBySlug, weddingTheme } from "@/lib/tenant";

/** The "&" favicon, drawn in the wedding's own colors and heading font. */
export async function weddingIcon(slug: string, px: number) {
  const wedding = await getWeddingBySlug(slug);
  if (!wedding) notFound();
  const theme = weddingTheme(wedding);
  const fontName = FONT_OPTIONS.serif.find((f) => f.key === theme.fonts.serif)?.label ?? "Cormorant Garamond";

  const fontData = await loadGoogleFont(fontName, 600, true).catch(() => null);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: theme.colors.ivory,
          fontFamily: fontData ? fontName : "serif",
          fontStyle: "italic",
          fontWeight: 600,
          fontSize: Math.round(px * 0.8),
          color: theme.colors.primary,
        }}
      >
        &amp;
      </div>
    ),
    {
      width: px,
      height: px,
      fonts: fontData ? [{ name: fontName, data: fontData, style: "italic", weight: 600 }] : [],
    }
  );
}
