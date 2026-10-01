export type RegistryItemWithContributions = {
  id: string;
  name: string;
  category: string;
  priceCents: number;
  image: string;
  externalUrl: string | null;
  claimedBy: string | null;
  contributions: { amountCents: number }[];
};

export type PendingContributionView = {
  id: string;
  guestName: string;
  itemName: string;
  amountCents: number;
  /** What the guest put on their transfer, e.g. "HONEY-4827"; null for older gifts. */
  reference: string | null;
  dateRequested: string;
};

export type ConfirmedContributionView = {
  id: string;
  guestName: string;
  itemName: string;
  amountCents: number;
  reference: string | null;
  dateConfirmed: string;
};

/** A guest's wish, whichever list it's in (pending, approved or hidden). */
export type WishView = {
  id: string;
  guestName: string;
  message: string;
  dateSubmitted: string;
};
export type PendingWishView = WishView;
export type ApprovedWishView = WishView;
export type HiddenWishView = WishView;

/** A guest's photo or video, whichever list it's in. */
export type MediaView = {
  id: string;
  guestName: string;
  url: string;
  type: "PHOTO" | "VIDEO";
  dateUploaded: string;
};
export type PendingMediaView = MediaView;
export type ApprovedMediaView = MediaView;
export type HiddenMediaView = MediaView;

export type RsvpView = {
  id: string;
  guestName: string;
  email: string;
  attending: boolean;
  guestCount: number;
  message: string | null;
  dateSubmitted: string;
  confirmationSentAt: string | null;
};

export type BankDetailsView = {
  name: string;
  bank: string;
  account: string;
  routing: string;
  swift: string | null;
};
