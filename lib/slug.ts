export const SLUG_MIN_LENGTH = 3;
export const SLUG_MAX_LENGTH = 60;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX_LENGTH)
    .replace(/-+$/g, "");
}

/** e.g. "Adanma Okwuchi" + "Tobi Ade" → "adanma-and-tobi" */
export function suggestWeddingSlug(partnerOne: string, partnerTwo: string) {
  const first = (name: string) => name.trim().split(/\s+/)[0] ?? "";
  return slugify(`${first(partnerOne)} and ${first(partnerTwo)}`);
}

export function slugError(slug: string): string | null {
  if (slug.length < SLUG_MIN_LENGTH || slug.length > SLUG_MAX_LENGTH) {
    return `Use ${SLUG_MIN_LENGTH}–${SLUG_MAX_LENGTH} characters`;
  }
  if (!SLUG_PATTERN.test(slug)) return "Use lowercase letters, numbers and single dashes";
  return null;
}

/**
 * What a couple puts in the web address box, as a slug. A pasted link
 * ("https://vowly.ng/w/aisha-and-kareem/gallery?x=1") keeps just the wedding's
 * address part; anything else is only lowercased, so the usual checks apply.
 */
export function slugFromInput(value: string): { slug: string; fromLink: boolean } {
  const lower = value.trim().toLowerCase();
  if (!lower.includes("/")) return { slug: lower, fromLink: false };
  const parts = lower
    .replace(/[?#].*$/, "")
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, "")
    .split("/");
  // "vowly.ng/w/…" starts with the site; "/w/…" doesn't.
  if (!lower.startsWith("/")) parts.shift();
  const segments = parts.filter(Boolean);
  if (segments.length === 0) return { slug: lower, fromLink: false };
  const w = segments.indexOf("w");
  return { slug: w >= 0 && segments[w + 1] ? segments[w + 1] : segments[segments.length - 1], fromLink: true };
}
