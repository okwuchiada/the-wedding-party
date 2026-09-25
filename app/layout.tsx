import type { Metadata } from "next";
import { FONT_VARIABLE_CLASSES, themeFontVars } from "@/lib/fonts";
import { DEFAULT_PRESET } from "@/lib/themes";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vowly",
  description: "Organize your wedding party with ease and style. Create a personalized wedding website, manage RSVPs, and keep your guests informed.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${FONT_VARIABLE_CLASSES} h-full antialiased`}
      style={themeFontVars(DEFAULT_PRESET.fonts) as React.CSSProperties}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
