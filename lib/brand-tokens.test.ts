import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BRAND } from "@/components/marketing/brand-colors";

// The brand colors live twice: in TypeScript (OG images, icons, inline styles) and
// as --brand-* variables in globals.css (shadcn/ui tokens). They must match.
const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const kebab = (key: string) => key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

describe("brand tokens", () => {
  for (const [key, hex] of Object.entries(BRAND)) {
    it(`--brand-${kebab(key)} matches BRAND.${key}`, () => {
      const match = css.match(new RegExp(`--brand-${kebab(key)}:\\s*(#[0-9a-fA-F]{6})`));
      expect(match?.[1]?.toLowerCase()).toBe(hex.toLowerCase());
    });
  }
});
