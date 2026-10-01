export const DASHBOARD_TABS = [
  { id: "registry", label: "Registry" },
  { id: "contributions", label: "Contributions" },
  { id: "media", label: "Photos" },
  { id: "wishes", label: "Wishes" },
  { id: "rsvps", label: "RSVPs" },
  { id: "story", label: "Our story" },
  { id: "design", label: "Design" },
  { id: "wording", label: "Wording" },
  { id: "people", label: "People" },
  { id: "settings", label: "Settings", ownerOnly: true },
  { id: "billing", label: "Billing", ownerOnly: true },
] as const satisfies readonly { id: string; label: string; ownerOnly?: boolean }[];

export type TabId = (typeof DASHBOARD_TABS)[number]["id"];

export function tabFromParam(param: string | string[] | undefined, isOwner: boolean): TabId {
  const tab = DASHBOARD_TABS.find((t) => t.id === param);
  if (!tab || ("ownerOnly" in tab && tab.ownerOnly && !isOwner)) return DASHBOARD_TABS[0].id;
  return tab.id;
}

export function dashboardTabHref(weddingId: string, tab: TabId) {
  return `/dashboard/${weddingId}?tab=${tab}`;
}
