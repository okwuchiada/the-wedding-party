import { Bricolage_Grotesque, Figtree } from "next/font/google";

// Marketing-only type; guest sites use the couple's chosen fonts (lib/fonts.ts).
export const display = Bricolage_Grotesque({ variable: "--m-display", subsets: ["latin"], weight: ["500", "700", "800"] });
export const body = Figtree({ variable: "--m-body", subsets: ["latin"], weight: ["400", "500", "600"] });

/** For shadcn/ui content portaled to <body>, outside the brand wrapper: loads the brand fonts there too. */
export const PORTAL_FONT_CLASS = `${display.variable} ${body.variable} font-(family-name:--m-body)`;
