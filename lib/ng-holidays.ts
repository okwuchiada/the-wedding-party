// Nigerian public holidays with dates that can be calculated. Eid-el-Fitr, Eid-el-Kabir and
// Mawlid follow the lunar calendar and are announced each year, so they aren't included.

const FIXED: [string, string][] = [
  ["01-01", "New Year's Day"],
  ["05-01", "Workers' Day"],
  ["06-12", "Democracy Day"],
  ["10-01", "Independence Day"],
  ["12-25", "Christmas Day"],
  ["12-26", "Boxing Day"],
];

/** Easter Sunday (Gregorian), by the anonymous "Meeus/Jones/Butcher" algorithm. */
export function easterSunday(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

const iso = (d: Date) => d.toISOString().slice(0, 10);
const cache = new Map<number, Map<string, string>>();

/** Holidays for a year, keyed by YYYY-MM-DD. */
export function nigerianHolidays(year: number): Map<string, string> {
  let holidays = cache.get(year);
  if (!holidays) {
    const easter = easterSunday(year);
    const offset = (days: number) => iso(new Date(easter.getTime() + days * 864e5));
    holidays = new Map([
      ...FIXED.map(([md, name]): [string, string] => [`${year}-${md}`, name]),
      [offset(-2), "Good Friday"],
      [offset(1), "Easter Monday"],
    ]);
    cache.set(year, holidays);
  }
  return holidays;
}

/** The holiday on a YYYY-MM-DD date, if any. */
export function holidayOn(date: string) {
  return nigerianHolidays(Number(date.slice(0, 4))).get(date) ?? null;
}
