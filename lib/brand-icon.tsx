import { ImageResponse } from "next/og";
import { BRAND } from "@/components/marketing/brand-colors";

const STRIPES = [BRAND.gold, BRAND.ink, BRAND.emerald, BRAND.coral];

/** The woven mark from the site header, as a square icon. */
export function brandIcon(px: number, { background }: { background?: string } = {}) {
  // Apple icons get a solid backdrop (iOS fills transparency with black); the favicon stays transparent.
  const inset = background ? Math.round(px * 0.2) : Math.round(px * 0.06);
  const radius = Math.round((px - inset * 2) * 0.18);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: background ?? "transparent" }}>
        <div style={{ display: "flex", width: px - inset * 2, height: px - inset * 2, borderRadius: radius, overflow: "hidden" }}>
          {STRIPES.map((color) => (
            <div key={color} style={{ flex: 1, background: color }} />
          ))}
        </div>
      </div>
    ),
    { width: px, height: px }
  );
}
