import { ImageResponse } from "next/og";
import { loadGoogleFont } from "@/lib/og-font";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const fontData = await loadGoogleFont("Cormorant Garamond", 600, true);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fdf6ec",
          fontFamily: "Cormorant Garamond",
          fontStyle: "italic",
          fontWeight: 600,
          fontSize: 140,
          color: "#c1440e",
        }}
      >
        &amp;
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Cormorant Garamond", data: fontData, style: "italic", weight: 600 }],
    }
  );
}
