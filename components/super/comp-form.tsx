"use client";

import { useState, useTransition } from "react";
import { compWedding, type SuperActionResult } from "@/lib/actions/super";
import { buttonClass } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";

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
          className={`${inputClass} w-auto py-1.5 text-[13px]`}
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
          className={buttonClass("secondary", "sm")}
        >
          Comp
        </button>
        {comped && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(null)}
            className={buttonClass("secondary", "sm")}
          >
            Uncomp
          </button>
        )}
      </span>
      {result?.error && <span className="text-[13px] text-danger">{result.error}</span>}
      {result?.message && <span className="text-[13px] text-success">{result.message}</span>}
    </span>
  );
}
