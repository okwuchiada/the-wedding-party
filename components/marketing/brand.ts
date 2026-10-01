import { BRAND } from "./brand-colors";
import { body, display } from "./fonts";

export { BRAND };

const MARKETING_VARS = {
  "--m-ink": BRAND.ink,
  "--m-paper": BRAND.paper,
  "--m-gold": BRAND.gold,
  "--m-emerald": BRAND.emerald,
  "--m-coral": BRAND.coral,
  "--m-coral-deep": BRAND.coralDeep,
  "--m-mist": BRAND.mist,
};

/** Brand tokens for platform pages; shadcn/ui reads its own from :root (app/globals.css). Guest sites set their own theme. */
export const BRAND_STYLE = {
  ...MARKETING_VARS,
  "--background": BRAND.paper,
  "--foreground": BRAND.ink,
  "--serif": "var(--m-display), system-ui, sans-serif",
  "--sans": "var(--m-body), system-ui, sans-serif",
} as React.CSSProperties;

/** Put on the element carrying BRAND_STYLE: loads the brand fonts. */
export const BRAND_CLASS = `${display.variable} ${body.variable} bg-(--m-paper) font-(family-name:--m-body) text-(--m-ink)`;

export const WOVEN = ["--m-gold", "--m-ink", "--m-emerald", "--m-coral"] as const;
