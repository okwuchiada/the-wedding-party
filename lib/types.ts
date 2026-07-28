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
  dateRequested: string;
};

export type ConfirmedContributionView = {
  id: string;
  guestName: string;
  itemName: string;
  amountCents: number;
  dateConfirmed: string;
};

export type PendingWishView = {
  id: string;
  guestName: string;
  message: string;
  dateSubmitted: string;
};

export type ApprovedWishView = {
  id: string;
  guestName: string;
  message: string;
};

export type HiddenWishView = {
  id: string;
  guestName: string;
  message: string;
  dateSubmitted: string;
};

export type PendingMediaView = {
  id: string;
  guestName: string;
  url: string;
  type: "PHOTO" | "VIDEO";
  dateUploaded: string;
};

export type ApprovedMediaView = {
  id: string;
  guestName: string;
  url: string;
  type: "PHOTO" | "VIDEO";
  dateUploaded: string;
};

export type HiddenMediaView = {
  id: string;
  guestName: string;
  url: string;
  type: "PHOTO" | "VIDEO";
  dateUploaded: string;
};

export type RsvpView = {
  id: string;
  guestName: string;
  attending: boolean;
  guestCount: number;
  message: string | null;
  dateSubmitted: string;
};

export type BankDetailsView = {
  name: string;
  bank: string;
  account: string;
  routing: string;
  swift: string | null;
};
