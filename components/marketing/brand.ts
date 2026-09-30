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

/** Brand tokens plus semantic tokens (components/ui). Guest sites set their own theme variables. */
export const BRAND_STYLE = {
  ...MARKETING_VARS,
  // Semantic tokens for platform UI (components/ui). Prefer these over brand names.
  "--action": BRAND.gold,
  "--action-ink": BRAND.ink,
  "--danger": BRAND.coralDeep,
  "--success": BRAND.emerald,
  "--warning": "#8a5a00",
  "--surface": "#ffffff",
  "--surface-muted": "#eceff6",
  "--line": BRAND.mist,
  "--muted": "#5a6285",
  "--background": BRAND.paper,
  "--foreground": BRAND.ink,
  "--serif": "var(--m-display), system-ui, sans-serif",
  "--sans": "var(--m-body), system-ui, sans-serif",
} as React.CSSProperties;

/** Put on the element carrying BRAND_STYLE: loads the brand fonts and scopes form styling. */
export const BRAND_CLASS = `${display.variable} ${body.variable} brand-ui bg-(--m-paper) font-(family-name:--m-body) text-(--m-ink)`;

export const WOVEN = ["--m-gold", "--m-ink", "--m-emerald", "--m-coral"] as const;
