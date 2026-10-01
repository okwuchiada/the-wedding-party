"use client";

import { useState } from "react";
import { DASHBOARD_TABS, dashboardTabHref, type TabId } from "@/lib/dashboard-tabs";
import LiveRefresh from "@/components/live-refresh";
import { useSyncedState } from "./use-synced-state";
import type {
  MediaView,
  WishView,
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
import { confirmContribution, unconfirmContribution } from "@/lib/actions/contributions";
import { setWishStatus } from "@/lib/actions/wishes";
import { deleteMedia, setMediaStatusMany } from "@/lib/actions/media";
import { useToast } from "@/components/ui/toast";
import { reviewMessage, type ReviewStatus } from "./review";
import { setGalleryEnabled } from "@/lib/actions/story";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";



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
  capacity,
  initialTab,
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
  design: {
    theme: ResolvedTheme;
    layout: ResolvedLayout;
    emptySections: string[];
    allowCustom: boolean;
    allowedThemes: string[];
    planName: string | null;
    isDraft: boolean;
  };
  copy: CopyView & { canCustomCredit: boolean; brandingRemoved: boolean; brandingPlan: string | null; creditPlan: string | null };
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
  /** Most guests who can attend, after the plan's cap. */
  capacity: number;
  /** The tab named in the URL (?tab=), already checked against the viewer's access. */
  initialTab: TabId;
  bankDetails: BankDetailsView;
}) {
  const [activeTab, setActiveTab] = useState<TabId>(initialTab);
  const visibleTabs = DASHBOARD_TABS.filter((t) => isOwner || !("ownerOnly" in t && t.ownerOnly));

  // Keep the open tab in the URL without a navigation, so a reload or a shared link opens it.
  const selectTab = (id: TabId) => {
    setActiveTab(id);
    window.history.replaceState(null, "", dashboardTabHref(weddingId, id));
  };


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

  const toast = useToast();

  const handleConfirmContribution = async (contribution: PendingContributionView) => {
    if (!(await attempt(() => confirmContribution(weddingId, contribution.id)))) return;
    const confirmed: ConfirmedContributionView = { ...contribution, dateConfirmed: new Date().toISOString().slice(0, 10) };
    setPendingContributions((prev) => prev.filter((c) => c.id !== contribution.id));
    setConfirmedContributions((prev) => [confirmed, ...prev]);
    toast({
      message: `${formatMoney(contribution.amountCents, money)} from ${contribution.guestName} confirmed`,
      undo: async () => {
        await unconfirmContribution(weddingId, contribution.id);
        setConfirmedContributions((prev) => prev.filter((c) => c.id !== contribution.id));
        setPendingContributions((prev) => [contribution, ...prev]);
      },
    });
  };

  const wishLists: Record<ReviewStatus, [WishView[], (fn: (prev: WishView[]) => WishView[]) => void]> = {
    PENDING: [pendingWishes, setPendingWishes],
    APPROVED: [approvedWishes, setApprovedWishes],
    HIDDEN: [hiddenWishes, setHiddenWishes],
  };
  const mediaLists: Record<ReviewStatus, [MediaView[], (fn: (prev: MediaView[]) => MediaView[]) => void]> = {
    PENDING: [pendingMedia, setPendingMedia],
    APPROVED: [approvedMedia, setApprovedMedia],
    HIDDEN: [hiddenMedia, setHiddenMedia],
  };

  /** Moves items between the local lists (the server has already been told). */
  function moveLocal<T extends { id: string }>(
    lists: Record<ReviewStatus, [T[], (fn: (prev: T[]) => T[]) => void]>,
    items: T[],
    from: ReviewStatus,
    to: ReviewStatus
  ) {
    const ids = new Set(items.map((i) => i.id));
    lists[from][1]((prev) => prev.filter((i) => !ids.has(i.id)));
    lists[to][1]((prev) => [...items, ...prev]);
  }

  /** Runs a review action; on failure nothing moves and the couple is told. */
  const attempt = async (action: () => Promise<void>) => {
    try {
      await action();
      return true;
    } catch {
      toast({ message: "That didn't save. Check your connection and try again.", tone: "error" });
      return false;
    }
  };

  const handleWishChange = async (wish: WishView, from: ReviewStatus, to: ReviewStatus) => {
    if (!(await attempt(() => setWishStatus(weddingId, wish.id, to)))) return;
    moveLocal(wishLists, [wish], from, to);
    toast({
      message: reviewMessage("Wish", 1, from, to),
      undo: async () => {
        await setWishStatus(weddingId, wish.id, from);
        moveLocal(wishLists, [wish], to, from);
      },
    });
  };

  const handleMediaChange = async (items: MediaView[], from: ReviewStatus, to: ReviewStatus) => {
    const ids = items.map((i) => i.id);
    if (!(await attempt(() => setMediaStatusMany(weddingId, ids, to)))) return;
    moveLocal(mediaLists, items, from, to);
    toast({
      message: reviewMessage("Photo", items.length, from, to),
      undo: async () => {
        await setMediaStatusMany(weddingId, ids, from);
        moveLocal(mediaLists, items, to, from);
      },
    });
  };

  const handleDeleteApprovedMedia = async (media: MediaView) => {
    await deleteMedia(weddingId, media.id);
    setApprovedMedia((prev) => prev.filter((m) => m.id !== media.id));
    toast({ message: "Photo deleted" });
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
            className={buttonVariants({ variant: "ink" })}
          >
            View guest site
          </a>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="gap-0 rounded-md p-4 shadow-none">
              <p className="text-sm text-ink/60">{stat.label}</p>
              <p className="mt-1 font-(family-name:--m-display) text-3xl font-extrabold tracking-tight">{stat.value}</p>
            </Card>
          ))}
        </div>

        {/* shadcn Tabs: arrow keys, Home and End move between sections. */}
        <Tabs value={activeTab} onValueChange={(v) => selectTab(v as TabId)} className="gap-0">
          <TabsList
            aria-label="Dashboard sections"
            className="mt-10 mb-8 h-auto w-full justify-start gap-1.5 overflow-x-auto rounded-none bg-transparent p-0 pb-1 group-data-[orientation=horizontal]/tabs:h-auto"
          >
            {visibleTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="h-auto flex-none rounded-full border-0 px-4 py-2 text-ink/70 hover:bg-mist hover:text-ink focus-visible:ring-ink/40 data-[state=active]:bg-ink data-[state=active]:text-paper data-[state=active]:shadow-none"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

        {/* One panel for whichever section is open. A disabled fieldset disables every control inside it; the server refuses changes too. */}
        <TabsContent value={activeTab}>
        <fieldset disabled={readOnly} className="min-w-0 disabled:opacity-80">
        {activeTab === "registry" && <RegistryTab items={registryItems} bankDetails={bankDetails} />}
        {activeTab === "contributions" && (
          <ContributionsTab
            pending={pendingContributions}
            confirmed={confirmedContributions}
            onConfirm={handleConfirmContribution}
          />
        )}
        {activeTab === "media" && (
          <MediaTab
            pending={pendingMedia}
            approved={approvedMedia}
            hidden={hiddenMedia}
            galleryEnabled={galleryEnabled}
            onChange={handleMediaChange}
            onDeleteApproved={handleDeleteApprovedMedia}
            onToggleGallery={handleToggleGallery}
          />
        )}
        {activeTab === "wishes" && (
          <WishesTab
            pending={pendingWishes}
            approved={approvedWishes}
            hidden={hiddenWishes}
            onChange={handleWishChange}
          />
        )}
        {activeTab === "rsvps" && <RsvpTab rsvps={rsvps} capacity={capacity} />}
        {activeTab === "story" && (
          <StoryTab story={story} photos={storyPhotos} storyBeats={storyBeats} />
        )}
        {activeTab === "design" && <DesignTab {...design} guestUrl={guestUrl} names={[story.brideName, story.groomName]} />}
        {activeTab === "wording" && <WordingTab copy={copy} canCustomCredit={copy.canCustomCredit} brandingRemoved={copy.brandingRemoved} plans={{ brandingPlan: copy.brandingPlan, creditPlan: copy.creditPlan }} />}
        {activeTab === "people" && <MembersTab members={members} isOwner={isOwner} />}
        {activeTab === "settings" && isOwner && <SettingsTab settings={settings} guestUrl={guestUrl} />}
        {activeTab === "billing" && isOwner && <BillingTab billing={billing} />}
        </fieldset>
        </TabsContent>
        </Tabs>
      </div>
    </div>
    </AdminWeddingProvider>
  );
}
