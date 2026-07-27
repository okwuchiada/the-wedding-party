import { ImageResponse } from "next/og";
import { loadGoogleFont } from "@/lib/og-font";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
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
          fontSize: 26,
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
