/** Letters and digits that can't be mistaken for each other when typed into a bank app (no 0/O, 1/I/L). */
export const REFERENCE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const CODE_LENGTH = 6;
const PATTERN = new RegExp(`^[A-Z]{1,5}-[${REFERENCE_ALPHABET}]{${CODE_LENGTH}}$`);

/**
 * A short reference a guest puts on their bank transfer, so the couple can match
 * it to one guest: up to five letters from the gift's name and a six-character
 * code (about 890 million combinations, so clashes on one wedding are rare).
 */
export function transferReference(itemName: string, random: () => number = Math.random) {
  const letters = itemName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .match(/[A-Z]+/);
  const prefix = letters ? letters[0].slice(0, 5) : "GIFT";
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) code += REFERENCE_ALPHABET[Math.floor(random() * REFERENCE_ALPHABET.length)];
  return `${prefix}-${code}`;
}

export function isTransferReference(value: string) {
  return PATTERN.test(value);
}
