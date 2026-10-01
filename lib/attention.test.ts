import { describe, expect, it } from "vitest";
import { attentionItems, newArrivals } from "@/lib/attention";

describe("attentionItems", () => {
  it("lists what's waiting, in tab order, with plain labels", () => {
    expect(attentionItems({ contributions: 2, media: 1, wishes: 3 })).toEqual([
      { tab: "contributions", count: 2, label: "2 transfers to confirm" },
      { tab: "media", count: 1, label: "1 photo or video to review" },
      { tab: "wishes", count: 3, label: "3 wishes to review" },
    ]);
  });
  it("uses the singular for one", () => {
    expect(attentionItems({ contributions: 1, media: 0, wishes: 1 }).map((i) => i.label)).toEqual(["1 transfer to confirm", "1 wish to review"]);
  });
  it("is empty when nothing is waiting", () => {
    expect(attentionItems({ contributions: 0, media: 0, wishes: 0 })).toEqual([]);
  });
  it("says photos and videos for several uploads", () => {
    expect(attentionItems({ contributions: 0, media: 4, wishes: 0 })[0].label).toBe("4 photos and videos to review");
  });
});

describe("newArrivals", () => {
  it("returns only items not seen before", () => {
    expect(newArrivals(new Set(["a", "b"]), [{ id: "a" }, { id: "c" }, { id: "b" }, { id: "d" }])).toEqual([{ id: "c" }, { id: "d" }]);
  });
  it("finds nothing new when items only went away", () => {
    expect(newArrivals(new Set(["a", "b"]), [{ id: "a" }])).toEqual([]);
  });
});
