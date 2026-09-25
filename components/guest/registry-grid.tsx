"use client";

import { useState } from "react";
import type { BankDetailsView } from "@/lib/types";
import type { RegistryItemWithContributions } from "@/lib/types";
import GiftCard from "./gift-card";

export type GiftCardVariant = "card" | "row" | "bold";

export default function RegistryGrid({
  items,
  bankDetails,
  variant = "card",
}: {
  items: RegistryItemWithContributions[];
  bankDetails: BankDetailsView;
  /** card: photo on top (Classic). row: a list, photo beside (Editorial, Minimal). bold: coloured top (Owambe). */
  variant?: GiftCardVariant;
}) {
  const categories = ["All", ...new Set(items.map((item) => item.category))];
  const [active, setActive] = useState("All");
  const filtered = active === "All" ? items : items.filter((item) => item.category === active);

  return (
    <div>
      <div className="mb-9 flex gap-1 overflow-x-auto border-b border-olive/20">
        {categories.map((category) => {
          const isActive = category === active;
          return (
            <button
              key={category}
              type="button"
              onClick={() => setActive(category)}
              className={`-mb-px px-4.5 py-3 text-xs tracking-[.12em] whitespace-nowrap uppercase transition-colors ${
                isActive
                  ? "border-b-2 border-burnt-orange text-foreground"
                  : "border-b-2 border-transparent text-foreground/45"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      <div
        key={active}
        className={
          variant === "row"
            ? "flex flex-col gap-4"
            : "grid grid-cols-1 items-start gap-5.5 sm:grid-cols-2 lg:grid-cols-3"
        }
      >
        {filtered.map((item) => (
          <GiftCard key={item.id} gift={item} bankDetails={bankDetails} variant={variant} />
        ))}
      </div>
    </div>
  );
}
