import {
  Cormorant_Garamond,
  Dancing_Script,
  EB_Garamond,
  Geist,
  Great_Vibes,
  Jost,
  Lora,
  Montserrat,
  Parisienne,
  Playfair_Display,
} from "next/font/google";
import { fontCssVar, type FontRole, type ThemeFonts } from "@/lib/font-options";

// Every font a couple can pick (lib/font-options.ts). Only the default trio is
// preloaded; the rest download when a wedding's theme actually uses them.
const cormorant = Cormorant_Garamond({ variable: "--font-cormorant", subsets: ["latin"], weight: ["300", "400", "500", "600"], style: ["normal", "italic"] });
const ebGaramond = EB_Garamond({ variable: "--font-eb-garamond", subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], preload: false });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], preload: false });
const lora = Lora({ variable: "--font-lora", subsets: ["latin"], style: ["normal", "italic"], preload: false });
const dancingScript = Dancing_Script({ variable: "--font-dancing-script", subsets: ["latin"], weight: ["400", "700"] });
const greatVibes = Great_Vibes({ variable: "--font-great-vibes", subsets: ["latin"], weight: "400", preload: false });
const parisienne = Parisienne({ variable: "--font-parisienne", subsets: ["latin"], weight: "400", preload: false });
const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin"], preload: false });
const jost = Jost({ variable: "--font-jost", subsets: ["latin"], preload: false });

/** Class names that define every font variable; applied once on <html>. */
export const FONT_VARIABLE_CLASSES = [
  cormorant, ebGaramond, playfair, lora, dancingScript, greatVibes, parisienne, geist, montserrat, jost,
]
  .map((font) => font.variable)
  .join(" ");


const FALLBACKS: Record<FontRole, string> = {
  serif: "Georgia, serif",
  script: "cursive",
  sans: "system-ui, sans-serif",
};

/** The --serif/--script/--sans properties the components read. */
export function themeFontVars(fonts: ThemeFonts): Record<string, string> {
  const value = (role: FontRole) => `var(${fontCssVar(fonts[role])}), ${FALLBACKS[role]}`;
  return { "--serif": value("serif"), "--script": value("script"), "--sans": value("sans") };
}
