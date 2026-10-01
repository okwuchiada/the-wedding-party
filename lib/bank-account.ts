/** Banks couples most often use, for the dropdown. "Other" lets them type any bank. */
export const NG_BANKS = [
  "Access Bank",
  "Citibank Nigeria",
  "Ecobank Nigeria",
  "Fidelity Bank",
  "First Bank of Nigeria",
  "First City Monument Bank (FCMB)",
  "Globus Bank",
  "Guaranty Trust Bank (GTBank)",
  "Heritage Bank",
  "Jaiz Bank",
  "Keystone Bank",
  "Kuda Bank",
  "Moniepoint",
  "OPay",
  "PalmPay",
  "Polaris Bank",
  "Providus Bank",
  "Stanbic IBTC Bank",
  "Standard Chartered Bank",
  "Sterling Bank",
  "SunTrust Bank",
  "Union Bank of Nigeria",
  "United Bank for Africa (UBA)",
  "Unity Bank",
  "Wema Bank",
  "Zenith Bank",
] as const;

export function normaliseAccountNumber(raw: string) {
  return raw.replace(/[\s-]/g, "");
}

export function bankDetailsError(input: { currency: string; name: string; bank: string; account: string }): string | null {
  if (!input.name.trim()) return "Account name is required";
  if (!input.bank.trim()) return "Choose your bank";
  const account = normaliseAccountNumber(input.account);
  if (!account) return "Account number is required";
  if (input.currency === "NGN" && !/^\d{10}$/.test(account)) return "Nigerian account numbers have 10 digits";
  return null;
}
