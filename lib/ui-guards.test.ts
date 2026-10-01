import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(__dirname, "..");

function files(dir: string): string[] {
  return readdirSync(join(ROOT, dir)).flatMap((name) => {
    const rel = join(dir, name);
    return statSync(join(ROOT, rel)).isDirectory() ? files(rel) : rel.endsWith(".tsx") ? [rel] : [];
  });
}

/** Theme-remap colour classes that the platform UI must not use; guest-site code still may. */
export const LEGACY_TOKEN = /\b(?:text|bg|border|ring|from|via|to|file:text|hover:text|hover:bg|hover:border|focus-within:border)-(?:burnt-orange|olive|ivory|cream)(?:-dark)?\b/;

/** The revamp's own colour names, retired for the shadcn/brand ones (gold, destructive, emerald, card, accent, border, muted-foreground). */
export const RETIRED_TOKEN = /(?<![\w-])(?:[a-z-]+:)*(?:bg|text|border|divide|ring|outline|decoration|accent)-(?:action|action-ink|danger|success|warning|surface|surface-muted|line)(?![\w-])|(?<![\w-])(?:[a-z-]+:)*text-muted(?![\w-])|var\(--(?:action|action-ink|danger|success|warning|surface|surface-muted|line|muted)\)/;

const PLATFORM_DIRS = ["components/admin", "components/super", "components/ui", "components/auth", "components/marketing", "app/dashboard", "app/super", "app/(auth)", "app/(marketing)"];

describe("platform UI", () => {
  it("uses semantic tokens, not the theme remap", () => {
    const offenders = PLATFORM_DIRS.flatMap(files).filter((f) => LEGACY_TOKEN.test(readFileSync(join(ROOT, f), "utf8")));
    expect(offenders).toEqual([]);
  });
  it("uses the shadcn/brand colour names, not the revamp's retired ones", () => {
    const offenders = PLATFORM_DIRS.flatMap(files).filter((f) => RETIRED_TOKEN.test(readFileSync(join(ROOT, f), "utf8")));
    expect(offenders).toEqual([]);
  });
});

describe("guest site", () => {
  it("has no fields that hide focus", () => {
    const offenders = files("components/guest").filter((f) => /outline-none/.test(readFileSync(join(ROOT, f), "utf8")));
    expect(offenders).toEqual([]);
  });
  it("has no text smaller than 12px", () => {
    const offenders = files("components/guest").filter((f) => /text-\[(?:[0-9]|1[01])(?:\.\d+)?px\]/.test(readFileSync(join(ROOT, f), "utf8")));
    expect(offenders).toEqual([]);
  });
});
