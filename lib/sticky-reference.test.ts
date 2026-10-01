import { describe, expect, it } from "vitest";
import { forgetReference, stickyReference } from "@/lib/sticky-reference";

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

describe("stickyReference", () => {
  it("keeps the same reference for a gift until it's forgotten", () => {
    const storage = memoryStorage();
    let n = 0;
    const make = () => `HONEY-${++n}`;
    const first = stickyReference(storage, "amara:gift1", make);
    expect(stickyReference(storage, "amara:gift1", make)).toBe(first);
    expect(stickyReference(storage, "amara:gift2", make)).not.toBe(first);
    forgetReference(storage, "amara:gift1");
    expect(stickyReference(storage, "amara:gift1", make)).not.toBe(first);
  });
  it("still works when storage refuses", () => {
    const broken = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };
    expect(stickyReference(broken, "k", () => "GIFT-ABC234")).toBe("GIFT-ABC234");
    expect(() => forgetReference(broken, "k")).not.toThrow();
  });
});
