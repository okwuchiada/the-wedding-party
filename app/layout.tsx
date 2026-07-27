import type { Metadata } from "next";
import { Cormorant_Garamond, EB_Garamond, Geist, Playfair_Display } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
});

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "The Wedding Party",
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
      className={`${geistSans.variable} ${cormorant.variable} ${ebGaramond.variable} ${playfair.variable} h-full antialiased`}
      style={
        {
          "--sans": "var(--font-geist-sans), system-ui, sans-serif",
          "--serif": "var(--font-cormorant), Georgia, serif",
        } as React.CSSProperties
      }
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
