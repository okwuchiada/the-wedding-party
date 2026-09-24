export type MoneyFormat = { currency: string; locale: string };

export const CURRENCIES = ["NGN", "GHS", "KES", "ZAR", "USD", "GBP", "EUR", "CAD"] as const;
export const LOCALES = ["en-NG", "en-GH", "en-KE", "en-ZA", "en-US", "en-GB", "en-CA", "fr-FR"] as const;

/** Formats an amount in minor units (kobo, cents), without decimals when whole. */
export function formatMoney(minor: number, { currency, locale }: MoneyFormat) {
  const whole = minor % 100 === 0;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(minor / 100);
}

export function currencySymbol({ currency, locale }: MoneyFormat) {
  return (
    new Intl.NumberFormat(locale, { style: "currency", currency })
      .formatToParts(0)
      .find((part) => part.type === "currency")?.value ?? currency
  );
}

/** Groups digits for an amount input, e.g. 250000 → "250,000". */
export function formatAmount(major: number, { locale }: Pick<MoneyFormat, "locale">) {
  return major.toLocaleString(locale);
}

// Smallest chip-in toward a registry item, in minor units. NGN keeps the original ₦20,000.
const MIN_CONTRIBUTION: Record<string, number> = {
  NGN: 20_000_00,
  GHS: 200_00,
  KES: 2_000_00,
  ZAR: 200_00,
};

export function minContribution(currency: string) {
  return MIN_CONTRIBUTION[currency] ?? 20_00;
}
