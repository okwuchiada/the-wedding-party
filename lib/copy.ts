// Editable section text. Each field falls back to the wording the site launched with.
export const COPY_FIELDS = [
  {
    key: "heroIntro",
    label: "Welcome line (top of the page)",
    fallback: "We're getting married and we'd be honored to have you celebrate with us.",
  },
  {
    key: "heroEyebrow",
    label: "Handwritten note beside the photos",
    fallback: "est. {year} ♡",
    hint: "{year} becomes your wedding year.",
  },
  {
    key: "loveNotesIntro",
    label: "Love notes introduction",
    fallback: "A few words we wanted to say to one another, out loud, before the day arrives.",
  },
  {
    key: "registryIntro",
    label: "Registry introduction",
    fallback:
      "Your presence at our wedding is the greatest gift of all. If you wish to celebrate with us further, we've put together a small list of things for our new home. Buy an item outright, or contribute any amount toward one — several guests can pitch in together until it's fully funded.",
  },
  {
    key: "giftIntro",
    label: "Monetary gift introduction",
    fallback:
      "Should you wish to gift outside of our registry, bank transfers toward our future together are warmly welcomed.",
  },
  {
    key: "rsvpIntro",
    label: "RSVP introduction",
    fallback: "We'd love to celebrate with you. Please let us know if you'll be able to make it.",
  },
  {
    key: "galleryIntro",
    label: "Gallery wall introduction",
    fallback:
      "Snap a photo or video from the celebration and share it here. The couple will approve it before it appears on the wall for everyone to see.",
  },
  {
    key: "wishesIntro",
    label: "Wall of wishes introduction",
    fallback:
      "A few kind words mean the world. Share a wish below, and once the couple approves it, it'll appear on the wall for everyone to see.",
  },
] as const;

export type CopyKey = (typeof COPY_FIELDS)[number]["key"];
export const COPY_MAX_LENGTH = 600;

/** The couple's text for a section, or the default, with {year} filled in. */
export function copyText(
  copy: Partial<Record<CopyKey, string | null>> | null | undefined,
  key: CopyKey,
  vars: { year?: number } = {}
) {
  const field = COPY_FIELDS.find((f) => f.key === key)!;
  const text = copy?.[key]?.trim() || field.fallback;
  return text.replace("{year}", vars.year ? String(vars.year) : "");
}
