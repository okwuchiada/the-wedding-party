"use client";

import { useState } from "react";
import LiveRefresh from "@/components/live-refresh";
import { useSyncedState } from "./use-synced-state";
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
import type { StoryBeatView } from "./story-beats-section";
import MembersTab, { type MemberView } from "./members-tab";
import DesignTab from "./design-tab";
import WordingTab, { type CopyView } from "./wording-tab";
import SettingsTab, { type SettingsView } from "./settings-tab";
import BillingTab, { type BillingView } from "./billing-tab";
import type { ResolvedLayout } from "@/lib/layouts";
import type { ResolvedTheme } from "@/lib/themes";
import { AdminWeddingProvider } from "./wedding-context";
import { formatMoney, type MoneyFormat } from "@/lib/money";
import { confirmContribution } from "@/lib/actions/contributions";
import { approveWish, hideWish } from "@/lib/actions/wishes";
import { approveMedia, deleteMedia, hideMedia } from "@/lib/actions/media";
import { setGalleryEnabled } from "@/lib/actions/story";


const tabs = ["Registry", "Contributions", "Media", "Wishes", "RSVPs", "Our Story", "Design", "Wording", "People", "Settings", "Billing"] as const;
type Tab = (typeof tabs)[number];
const OWNER_TABS: readonly Tab[] = ["Settings", "Billing"];

export default function AdminHome({
  weddingId,
  money,
  guestUrl,
  coupleTitle,
  members,
  isOwner,
  readOnly,
  design,
  copy,
  settings,
  billing,
  registryItems,
  pendingContributions: initialPendingContributions,
  confirmedContributions: initialConfirmedContributions,
  pendingWishes: initialPendingWishes,
  approvedWishes: initialApprovedWishes,
  hiddenWishes: initialHiddenWishes,
  story,
  storyPhotos,
  storyBeats,
  pendingMedia: initialPendingMedia,
  approvedMedia: initialApprovedMedia,
  hiddenMedia: initialHiddenMedia,
  rsvps,
  bankDetails,
}: {
  weddingId: string;
  money: MoneyFormat;
  guestUrl: string;
  /** The couple's names as they chose to show them. */
  coupleTitle: string | null;
  members: MemberView[];
  isOwner: boolean;
  /** Staff with view-only access: every control in the tabs is disabled. */
  readOnly: boolean;
  design: { theme: ResolvedTheme; layout: ResolvedLayout; emptySections: string[]; allowCustom: boolean; isDraft: boolean };
  copy: CopyView & { canRemoveBranding: boolean };
  settings: SettingsView;
  billing: BillingView;
  registryItems: RegistryItemWithContributions[];
  pendingContributions: PendingContributionView[];
  confirmedContributions: ConfirmedContributionView[];
  pendingWishes: PendingWishView[];
  approvedWishes: ApprovedWishView[];
  hiddenWishes: HiddenWishView[];
  story: StoryContentView;
  storyPhotos: StoryPhotoView[];
  storyBeats: StoryBeatView[];
  pendingMedia: PendingMediaView[];
  approvedMedia: ApprovedMediaView[];
  hiddenMedia: HiddenMediaView[];
  rsvps: RsvpView[];
  bankDetails: BankDetailsView;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("Registry");

  const [pendingContributions, setPendingContributions] = useSyncedState(initialPendingContributions);
  const [confirmedContributions, setConfirmedContributions] = useSyncedState(initialConfirmedContributions);

  const [pendingMedia, setPendingMedia] = useSyncedState(initialPendingMedia);
  const [approvedMedia, setApprovedMedia] = useSyncedState(initialApprovedMedia);
  const [hiddenMedia, setHiddenMedia] = useSyncedState(initialHiddenMedia);

  const [pendingWishes, setPendingWishes] = useSyncedState(initialPendingWishes);
  const [approvedWishes, setApprovedWishes] = useSyncedState(initialApprovedWishes);
  const [hiddenWishes, setHiddenWishes] = useSyncedState(initialHiddenWishes);

  const [galleryEnabled, setGalleryEnabledState] = useSyncedState(story.galleryEnabled);

  const handleToggleGallery = async () => {
    const next = !galleryEnabled;
    await setGalleryEnabled(weddingId, next);
    setGalleryEnabledState(next);
  };

  const handleConfirmContribution = async (contribution: PendingContributionView) => {
    await confirmContribution(weddingId, contribution.id);
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
    await approveMedia(weddingId, media.id);
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
    await hideMedia(weddingId, media.id);
    setPendingMedia((prev) => prev.filter((m) => m.id !== media.id));
    setHiddenMedia((prev) => [
      { id: media.id, guestName: media.guestName, url: media.url, type: media.type, dateUploaded: media.dateUploaded },
      ...prev,
    ]);
  };

  const handleRestoreMedia = async (media: HiddenMediaView) => {
    await approveMedia(weddingId, media.id);
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
    await hideMedia(weddingId, media.id);
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
    await deleteMedia(weddingId, media.id);
    setApprovedMedia((prev) => prev.filter((m) => m.id !== media.id));
  };

  const handleApproveWish = async (wish: PendingWishView) => {
    await approveWish(weddingId, wish.id);
    setPendingWishes((prev) => prev.filter((w) => w.id !== wish.id));
    setApprovedWishes((prev) => [{ id: wish.id, guestName: wish.guestName, message: wish.message }, ...prev]);
  };

  const handleHideWish = async (wish: PendingWishView) => {
    await hideWish(weddingId, wish.id);
    setPendingWishes((prev) => prev.filter((w) => w.id !== wish.id));
    setHiddenWishes((prev) => [
      { id: wish.id, guestName: wish.guestName, message: wish.message, dateSubmitted: wish.dateSubmitted },
      ...prev,
    ]);
  };

  const handleRestoreWish = async (wish: HiddenWishView) => {
    await approveWish(weddingId, wish.id);
    setHiddenWishes((prev) => prev.filter((w) => w.id !== wish.id));
    setApprovedWishes((prev) => [{ id: wish.id, guestName: wish.guestName, message: wish.message }, ...prev]);
  };

  const totalRaisedCents = confirmedContributions.reduce((sum, c) => sum + c.amountCents, 0);
  const itemsFullyFunded = registryItems.filter((item) => {
    const raised = item.contributions.reduce((sum, c) => sum + c.amountCents, 0);
    return raised >= item.priceCents;
  }).length;

  const stats = [
    { label: "Total raised", value: formatMoney(totalRaisedCents, money) },
    { label: "Items fully funded", value: `${itemsFullyFunded} / ${registryItems.length}` },
    { label: "Guest uploads", value: approvedMedia.length },
    { label: "Wishes", value: approvedWishes.length },
  ];

  return (
    <AdminWeddingProvider weddingId={weddingId} money={money}>
    <div className="mx-auto max-w-6xl px-5 pt-4 pb-16 sm:px-8">
      <LiveRefresh />
      <div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-(family-name:--m-display) text-4xl leading-none font-extrabold tracking-[-0.03em] sm:text-5xl">
            {coupleTitle ?? `${story.brideName} & ${story.groomName}`}
          </h1>
          <a
            href={guestUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-(--m-ink) px-5 py-2.5 text-sm font-semibold text-(--m-paper) hover:bg-(--m-emerald)"
          >
            View guest site
          </a>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-[6px] border border-(--m-mist) bg-white p-4">
              <p className="text-sm text-(--m-ink)/60">{stat.label}</p>
              <p className="mt-1 font-(family-name:--m-display) text-3xl font-extrabold tracking-tight">{stat.value}</p>
            </div>
          ))}
        </div>

        <div role="tablist" aria-label="Dashboard sections" className="mt-10 mb-8 flex gap-1.5 overflow-x-auto pb-1">
          {tabs.filter((tab) => isOwner || !OWNER_TABS.includes(tab)).map((tab) => {
            const isActive = tab === activeTab;
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive ? "bg-(--m-ink) text-(--m-paper)" : "text-(--m-ink)/70 hover:bg-(--m-mist) hover:text-(--m-ink)"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* A disabled fieldset disables every control inside it; the server refuses changes too. */}
        <fieldset disabled={readOnly} className="min-w-0 disabled:opacity-80">
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
        {activeTab === "Our Story" && (
          <StoryTab story={story} photos={storyPhotos} storyBeats={storyBeats} />
        )}
        {activeTab === "Design" && <DesignTab {...design} guestUrl={guestUrl} names={[story.brideName, story.groomName]} />}
        {activeTab === "Wording" && <WordingTab copy={copy} canRemoveBranding={copy.canRemoveBranding} />}
        {activeTab === "People" && <MembersTab members={members} isOwner={isOwner} />}
        {activeTab === "Settings" && isOwner && <SettingsTab settings={settings} />}
        {activeTab === "Billing" && isOwner && <BillingTab billing={billing} />}
        </fieldset>
      </div>
    </div>
    </AdminWeddingProvider>
  );
}
