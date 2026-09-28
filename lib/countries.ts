import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

export type CountryOption = { code: string; name: string; continent: string; aliases: string[] };

/** Kept in the table but not offered: no one lives there to visit a wedding site from. */
const HIDDEN_CONTINENTS = ["Antarctica"];
/**
 * Sovereign states only, on every continent for now: territories (dependencies
 * like Puerto Rico or Réunion, and disputed Western Sahara) stay in the table,
 * flagged, but aren't offered.
 */
const SOVEREIGN_ONLY = true;

/** The countries couples can choose from, A–Z; loaded once per request. */
export const getCountries = cache(
  (): Promise<CountryOption[]> =>
    prisma.country.findMany({
      where: {
        continent: { notIn: HIDDEN_CONTINENTS },
        ...(SOVEREIGN_ONLY ? { territory: false } : {}),
      },
      orderBy: { name: "asc" },
      select: { code: true, name: true, continent: true, aliases: true },
    })
);
