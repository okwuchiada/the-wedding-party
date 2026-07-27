"use client";

import { useState } from "react";
import type {
  ApprovedMediaView,
  ApprovedWishView,
  BankDetailsView,
  ConfirmedContributionView,
  HiddenMediaView,
  HiddenWishView,
  PendingContributionView,
  PendingMediaView,
  PendingWishView,
  RegistryItemWithContributions,
  RsvpView,
} from "@/lib/types";
import RegistryTab from "./registry-tab";
import ContributionsTab from "./contributions-tab";
import MediaTab from "./media-tab";
import WishesTab from "./wishes-tab";
import RsvpTab from "./rsvp-tab";
import StoryTab, { type StoryContentView, type StoryPhotoView } from "./story-tab";
import SignOutButton from "./sign-out-button";
import { logout } from "@/lib/actions/auth";
import { confirmContribution } from "@/lib/actions/contributions";
import { approveWish, hideWish } from "@/lib/actions/wishes";
import { approveMedia, deleteMedia, hideMedia } from "@/lib/actions/media";
import { setGalleryEnabled } from "@/lib/actions/story";

function formatNaira(cents: number) {
  return `₦${(cents / 100).toLocaleString("en-NG")}`;
}

const tabs = ["Registry", "Contributions", "Media", "Wishes", "RSVPs", "Our Story"] as const;
type Tab = (typeof tabs)[number];

export default function AdminHome({
  registryItems,
  pendingContributions: initialPendingContributions,
  confirmedContributions: initialConfirmedContributions,
  pendingWishes: initialPendingWishes,
  approvedWishes: initialApprovedWishes,
  hiddenWishes: initialHiddenWishes,
  story,
  storyPhotos,
  pendingMedia: initialPendingMedia,
  approvedMedia: initialApprovedMedia,
  hiddenMedia: initialHiddenMedia,
  rsvps,
  bankDetails,
}: {
  registryItems: RegistryItemWithContributions[];
  pendingContributions: PendingContributionView[];
  confirmedContributions: ConfirmedContributionView[];
  pendingWishes: PendingWishView[];
  approvedWishes: ApprovedWishView[];
  hiddenWishes: HiddenWishView[];
  story: StoryContentView;
  storyPhotos: StoryPhotoView[];
  pendingMedia: PendingMediaView[];
  approvedMedia: ApprovedMediaView[];
  hiddenMedia: HiddenMediaView[];
  rsvps: RsvpView[];
  bankDetails: BankDetailsView;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("Registry");

  const [pendingContributions, setPendingContributions] = useState<PendingContributionView[]>(
    initialPendingContributions
  );
  const [confirmedContributions, setConfirmedContributions] = useState<ConfirmedContributionView[]>(
    initialConfirmedContributions
  );

  const [pendingMedia, setPendingMedia] = useState<PendingMediaView[]>(initialPendingMedia);
  const [approvedMedia, setApprovedMedia] = useState<ApprovedMediaView[]>(initialApprovedMedia);
  const [hiddenMedia, setHiddenMedia] = useState<HiddenMediaView[]>(initialHiddenMedia);

  const [pendingWishes, setPendingWishes] = useState<PendingWishView[]>(initialPendingWishes);
  const [approvedWishes, setApprovedWishes] = useState<ApprovedWishView[]>(initialApprovedWishes);
  const [hiddenWishes, setHiddenWishes] = useState<HiddenWishView[]>(initialHiddenWishes);

  const [galleryEnabled, setGalleryEnabledState] = useState(story.galleryEnabled);

  const handleToggleGallery = async () => {
    const next = !galleryEnabled;
    await setGalleryEnabled(next);
    setGalleryEnabledState(next);
  };

  const handleConfirmContribution = async (contribution: PendingContributionView) => {
    await confirmContribution(contribution.id);
    setPendingContributions((prev) => prev.filter((c) => c.id !== contribution.id));
    setConfirmedContributions((prev) => [
      {
        id: contribution.id,
        guestName: contribution.guestName,
        itemName: contribution.itemName,
        amountCents: contribution.amountCents,
        dateConfirmed: new Date().toISOString().slice(0, 10),
      },
      ...prev,
    ]);
  };

  const handleApproveMedia = async (media: PendingMediaView) => {
    await approveMedia(media.id);
    setPendingMedia((prev) => prev.filter((m) => m.id !== media.id));
    setApprovedMedia((prev) => [
      {
        id: media.id,
        guestName: media.guestName,
        url: media.url,
        type: media.type,
        dateUploaded: media.dateUploaded,
      },
      ...prev,
    ]);
  };

  const handleHideMedia = async (media: PendingMediaView) => {
    await hideMedia(media.id);
    setPendingMedia((prev) => prev.filter((m) => m.id !== media.id));
    setHiddenMedia((prev) => [
      { id: media.id, guestName: media.guestName, url: media.url, type: media.type, dateUploaded: media.dateUploaded },
      ...prev,
    ]);
  };

  const handleRestoreMedia = async (media: HiddenMediaView) => {
    await approveMedia(media.id);
    setHiddenMedia((prev) => prev.filter((m) => m.id !== media.id));
    setApprovedMedia((prev) => [
      {
        id: media.id,
        guestName: media.guestName,
        url: media.url,
        type: media.type,
        dateUploaded: media.dateUploaded,
      },
      ...prev,
    ]);
  };

  const handleHideApprovedMedia = async (media: ApprovedMediaView) => {
    await hideMedia(media.id);
    setApprovedMedia((prev) => prev.filter((m) => m.id !== media.id));
    setHiddenMedia((prev) => [
      {
        id: media.id,
        guestName: media.guestName,
        url: media.url,
        type: media.type,
        dateUploaded: media.dateUploaded,
      },
      ...prev,
    ]);
  };

  const handleDeleteApprovedMedia = async (media: ApprovedMediaView) => {
    await deleteMedia(media.id);
    setApprovedMedia((prev) => prev.filter((m) => m.id !== media.id));
  };

  const handleApproveWish = async (wish: PendingWishView) => {
    await approveWish(wish.id);
    setPendingWishes((prev) => prev.filter((w) => w.id !== wish.id));
    setApprovedWishes((prev) => [{ id: wish.id, guestName: wish.guestName, message: wish.message }, ...prev]);
  };

  const handleHideWish = async (wish: PendingWishView) => {
    await hideWish(wish.id);
    setPendingWishes((prev) => prev.filter((w) => w.id !== wish.id));
    setHiddenWishes((prev) => [
      { id: wish.id, guestName: wish.guestName, message: wish.message, dateSubmitted: wish.dateSubmitted },
      ...prev,
    ]);
  };

  const handleRestoreWish = async (wish: HiddenWishView) => {
    await approveWish(wish.id);
    setHiddenWishes((prev) => prev.filter((w) => w.id !== wish.id));
    setApprovedWishes((prev) => [{ id: wish.id, guestName: wish.guestName, message: wish.message }, ...prev]);
  };

  const totalRaisedCents = confirmedContributions.reduce((sum, c) => sum + c.amountCents, 0);
  const itemsFullyFunded = registryItems.filter((item) => {
    const raised = item.contributions.reduce((sum, c) => sum + c.amountCents, 0);
    return raised >= item.priceCents;
  }).length;

  const stats = [
    { label: "Total Raised", value: formatNaira(totalRaisedCents) },
    { label: "Items Fully Funded", value: `${itemsFullyFunded} / ${registryItems.length}` },
    { label: "Guest Uploads", value: approvedMedia.length },
    { label: "Wishes", value: approvedWishes.length },
  ];

  return (
    <div className="min-h-screen bg-ivory px-4 py-12 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-olive">Admin</p>
            <h1 className="font-(family-name:--serif) text-3xl text-foreground sm:text-4xl">
              {story.brideName} &amp; {story.groomName}&apos;s Dashboard
            </h1>
          </div>
          <form action={logout}>
            <SignOutButton />
          </form>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white p-4 shadow-[0_18px_40px_-20px_rgba(58,46,40,0.45)]">
              <p className="text-[10.5px] tracking-[.16em] text-foreground/55 uppercase">{stat.label}</p>
              <p className="mt-2 font-(family-name:--serif) text-2xl text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 mb-8 flex gap-1 overflow-x-auto border-b border-olive/20">
          {tabs.map((tab) => {
            const isActive = tab === activeTab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`-mb-px px-4.5 py-3 font-semibold text-xs tracking-[.12em] whitespace-nowrap uppercase transition-colors ${
                  isActive
                    ? "border-b-2 border-burnt-orange text-foreground"
                    : "border-b-2 border-transparent text-foreground/45"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {activeTab === "Registry" && <RegistryTab items={registryItems} bankDetails={bankDetails} />}
        {activeTab === "Contributions" && (
          <ContributionsTab
            pending={pendingContributions}
            confirmed={confirmedContributions}
            onConfirm={handleConfirmContribution}
          />
        )}
        {activeTab === "Media" && (
          <MediaTab
            pending={pendingMedia}
            approved={approvedMedia}
            hidden={hiddenMedia}
            galleryEnabled={galleryEnabled}
            onApprove={handleApproveMedia}
            onHide={handleHideMedia}
            onHideApproved={handleHideApprovedMedia}
            onDeleteApproved={handleDeleteApprovedMedia}
            onRestore={handleRestoreMedia}
            onToggleGallery={handleToggleGallery}
          />
        )}
        {activeTab === "Wishes" && (
          <WishesTab
            pending={pendingWishes}
            approved={approvedWishes}
            hidden={hiddenWishes}
            onApprove={handleApproveWish}
            onHide={handleHideWish}
            onRestore={handleRestoreWish}
          />
        )}
        {activeTab === "RSVPs" && <RsvpTab rsvps={rsvps} />}
        {activeTab === "Our Story" && <StoryTab story={story} photos={storyPhotos} />}
      </div>
    </div>
  );
}
