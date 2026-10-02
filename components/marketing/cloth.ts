import type { ThemeColors } from "@/lib/themes";

type ClothStyle = { backgroundImage: string; backgroundPositionY: string };

/** Tiles a small SVG down the strip. */
function tile(w: number, h: number, inner: string, offset: number): ClothStyle {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>${inner}</svg>`;
  return { backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`, backgroundPositionY: `${offset}px` };
}

/** Warp stripes across the strip, repeated down its length. */
function stripes(bands: [string, number][], offset: number): ClothStyle {
  let y = 0;
  const stops = bands.map(([color, h]) => `${color} ${y}px ${(y += h)}px`).join(", ");
  return { backgroundImage: `repeating-linear-gradient(to bottom, ${stops})`, backgroundPositionY: `${offset}px` };
}

/** Yoruba aso-oke: fine warp stripes in the theme's colors. The default for every theme without its own cloth. */
const asoOke = (c: ThemeColors, offset: number) =>
  stripes(
    [
      [c.primary, 22], [c.ivory, 3], [c.accent, 10], [c.cream, 4], [c.primaryDark, 6],
      [c.ivory, 2], [c.accentDark, 14], [c.cream, 3], [c.primary, 5], [c.foreground, 2],
    ],
    offset,
  );

const CLOTHS: Record<string, (offset: number) => ClothStyle> = {
  // Igbo uli: fine curves and spirals in uli black on nzu chalk, dotted with camwood.
  "camwood-uli": (offset) =>
    tile(
      40,
      44,
      `<rect width='40' height='44' fill='#f2ece0'/><path d='M0 9 Q10 1 20 9 T40 9' stroke='#1f1a17' stroke-width='1.6' fill='none'/>` +
        `<circle cx='20' cy='26' r='7' stroke='#1f1a17' stroke-width='1.4' fill='none'/><path d='M20 26 m-3 0 a3 3 0 1 1 3 3' stroke='#1f1a17' stroke-width='1.2' fill='none'/>` +
        `<circle cx='5' cy='26' r='1.6' fill='#8e3b2a'/><circle cx='35' cy='26' r='1.6' fill='#8e3b2a'/>` +
        `<path d='M0 40 Q10 36 20 40 T40 40' stroke='#c08a3e' stroke-width='1.2' fill='none'/>`,
      offset,
    ),
  // Tiv a'nger: even black and white stripes with a thin red thread.
  "ebony-anger": (offset) =>
    stripes([["#161616", 9], ["#f3f0e8", 9], ["#161616", 9], ["#f3f0e8", 9], ["#161616", 9], ["#f3f0e8", 3], ["#9e1b1b", 2], ["#f3f0e8", 3]], offset),
  // Idoma: bold red and black stripes, picked out in gold and cotton thread.
  "idoma-crimson": (offset) =>
    stripes([["#b0201c", 14], ["#121010", 3], ["#b0201c", 3], ["#121010", 12], ["#c9952a", 1], ["#121010", 2], ["#f1ece2", 1], ["#121010", 2]], offset),
  // Edo: coral bead netting over Benin bronze.
  "benin-coral": (offset) =>
    tile(
      22,
      22,
      `<rect width='22' height='22' fill='#4a3418'/><path d='M0 0L22 22M22 0L0 22' stroke='#8c6a2f' stroke-width='2'/>` +
        [[0, 0], [22, 0], [0, 22], [22, 22], [11, 11]]
          .map(([x, y]) => `<circle cx='${x}' cy='${y}' r='4.4' fill='#c8402f' stroke='#8f2a1e'/><circle cx='${x - 1.4}' cy='${y - 1.4}' r='1.1' fill='#f6efe0' opacity='.8'/>`)
          .join(""),
      offset,
    ),
  // Kalabari injiri: madras check in red, navy, white and gold.
  "kalabari-madras": (offset) =>
    tile(
      32,
      32,
      `<rect width='32' height='32' fill='#a5262c'/><rect x='6' width='8' height='32' fill='#1f2a52' opacity='.82'/><rect y='6' width='32' height='8' fill='#1f2a52' opacity='.82'/>` +
        `<rect x='20' width='1.5' height='32' fill='#f6f3ee' opacity='.9'/><rect y='20' width='32' height='1.5' fill='#f6f3ee' opacity='.9'/>` +
        `<rect x='26' width='1' height='32' fill='#e0b03a'/><rect y='26' width='32' height='1' fill='#e0b03a'/>` +
        `<rect x='8.5' y='8.5' width='3' height='3' fill='#f6f3ee' opacity='.9'/>`,
      offset,
    ),
};

/** The cloth a theme's hero strip is cut from: its own pattern where it has one, aso-oke otherwise. */
export function clothStyle(key: string, colors: ThemeColors, offset: number): ClothStyle {
  return CLOTHS[key]?.(offset) ?? asoOke(colors, offset);
}
