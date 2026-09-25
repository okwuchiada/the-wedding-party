"use client";

import { useState, useTransition } from "react";
import { compWedding, type SuperActionResult } from "@/lib/actions/super";

export default function CompForm({
  weddingId,
  plans,
  comped,
  currentPlanKey,
}: {
  weddingId: string;
  plans: { key: string; name: string }[];
  comped: boolean;
  currentPlanKey: string | null;
}) {
  const [planKey, setPlanKey] = useState(currentPlanKey ?? plans[0]?.key ?? "");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<SuperActionResult | null>(null);
  const run = (key: string | null) => startTransition(async () => setResult(await compWedding(weddingId, key)));

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <span className="inline-flex gap-1">
        <select
          value={planKey}
          onChange={(e) => setPlanKey(e.target.value)}
          className="border border-(--m-mist) bg-white px-1.5 py-1 text-[11px]"
        >
          {plans.map((p) => (
            <option key={p.key} value={p.key}>
              {p.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={pending || !planKey}
          onClick={() => run(planKey)}
          className="border rounded-full border-(--m-ink)/25 px-2.5 py-1 text-[11px] font-medium hover:border-(--m-ink) disabled:opacity-50"
        >
          Comp
        </button>
        {comped && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(null)}
            className="border rounded-full border-(--m-ink)/25 px-2.5 py-1 text-[11px] font-medium hover:border-(--m-ink) disabled:opacity-50"
          >
            Uncomp
          </button>
        )}
      </span>
      {result?.error && <span className="text-[11px] text-burnt-orange">{result.error}</span>}
      {result?.message && <span className="text-[11px] text-olive">{result.message}</span>}
    </span>
  );
}
