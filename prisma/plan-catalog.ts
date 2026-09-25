// The plans Vowly sells. Used to seed a fresh database; after that, plans are
// edited in the staff console (/super/plans), which is the source of truth.
import { UNLIMITED_GUESTS } from "../lib/plans";

const FREE_THEMES = ["terracotta-olive", "blush-rose", "navy-gold"];

export const PLAN_CATALOG = [
  {
    key: "free",
    name: "Free",
    tagline: "Everything you need to say we're getting married.",
    priceKobo: 0,
    popular: false,
    sortOrder: 0,
    maxGuests: 50,
    maxUploads: 25,
    availabilityMonths: 6,
    themes: FREE_THEMES,
    features: { gallery: true, video: false, customTheme: false, removeBranding: false, customCredit: false, customDomain: false, prioritySupport: false },
    highlights: [
      "Beautiful wedding website",
      "3 wedding themes",
      "Up to 50 RSVP guests",
      "RSVP & guest management",
      "Registry & cash gifts",
      "Love story & timeline",
      "Guest wishes",
      "Custom URL slug",
      "Up to 25 guest photo uploads",
      "6 months website availability",
    ],
    limitations: ["Vowly footer branding", "No custom colors or fonts", "No video uploads", "No custom domain"],
  },
  {
    key: "signature",
    name: "Signature",
    tagline: "Make it unmistakably yours.",
    priceKobo: 15_000_00,
    popular: true,
    sortOrder: 1,
    maxGuests: UNLIMITED_GUESTS,
    maxUploads: 500,
    availabilityMonths: 18,
    themes: [],
    features: { gallery: true, video: true, customTheme: true, removeBranding: true, customCredit: false, customDomain: false, prioritySupport: false },
    highlights: [
      "Everything in Free",
      "All wedding themes",
      "Unlimited RSVP guests",
      "Custom colors and fonts",
      "Guest photo & video gallery",
      "Up to 500 guest photo and video uploads",
      "Remove Vowly branding",
      "Custom URL slug",
      "18 months website availability",
    ],
    limitations: ["No custom domain", "No custom footer credit"],
  },
  {
    key: "forever",
    name: "Forever",
    tagline: "Your wedding website becomes a keepsake.",
    priceKobo: 30_000_00,
    popular: false,
    sortOrder: 2,
    maxGuests: UNLIMITED_GUESTS,
    maxUploads: 2000,
    availabilityMonths: null,
    themes: [],
    features: { gallery: true, video: true, customTheme: true, removeBranding: true, customCredit: true, customDomain: true, prioritySupport: true },
    highlights: [
      "Everything in Signature",
      "Custom domain (coming soon)",
      "Your own footer credit",
      "Up to 2000 guest photo and video uploads",
      "Priority support",
      "Permanent wedding website",
      "Keep your wedding story, photos and guest wishes online",
    ],
    limitations: [],
  },
];

/** Plans sold before Vowly's current line-up; retired, but weddings on them keep them. */
export const RETIRED_PLAN_KEYS = ["basic", "premium"];
