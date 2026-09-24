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

/**
 * Brand tokens plus the dashboard's theme variables (app/globals.css) remapped
 * onto them, so admin components written against olive/burnt-orange pick up
 * the brand without per-component changes.
 */
export const BRAND_STYLE = {
  ...MARKETING_VARS,
  "--background": BRAND.paper,
  "--foreground": BRAND.ink,
  "--olive": BRAND.emerald,
  "--olive-dark": "#0a5140",
  "--burnt-orange": BRAND.coralDeep,
  "--burnt-orange-dark": "#8e273a",
  "--ivory": BRAND.paper,
  "--cream": "#e8ebf4",
  "--ink": "22 32 74",
  "--serif": "var(--m-display), system-ui, sans-serif",
  "--sans": "var(--m-body), system-ui, sans-serif",
} as React.CSSProperties;

/** Put on the element carrying BRAND_STYLE: loads the brand fonts and scopes form styling. */
export const BRAND_CLASS = `${display.variable} ${body.variable} brand-ui bg-(--m-paper) font-(family-name:--m-body) text-(--m-ink)`;

export const WOVEN = ["--m-gold", "--m-ink", "--m-emerald", "--m-coral"] as const;
