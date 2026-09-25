/** Local numbers ("0803…") become international ("234803…") using the wedding's country code. */
export function toWhatsAppNumber(phone: string, countryCode: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith(countryCode)) return digits;
  if (digits.startsWith("0")) return `${countryCode}${digits.slice(1)}`;
  return digits;
}
