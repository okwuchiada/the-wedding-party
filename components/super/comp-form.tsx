"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { compWedding, type SuperActionResult } from "@/lib/actions/super";
import { ResultText } from "@/components/result-text";

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
        <Select value={planKey} onValueChange={setPlanKey}>
          <SelectTrigger size="sm" aria-label="Plan to comp" className="gap-1 px-1.5 text-[11px] data-[size=sm]:h-6">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {plans.map((p) => (
              <SelectItem key={p.key} value={p.key} className="text-xs">
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" size="xs" disabled={pending || !planKey} onClick={() => run(planKey)} className="px-2.5 py-1 text-[11px]">
          Comp
        </Button>
        {comped && (
          <Button type="button" variant="outline" size="xs" disabled={pending} onClick={() => run(null)} className="px-2.5 py-1 text-[11px]">
            Uncomp
          </Button>
        )}
      </span>
      <ResultText error={result?.error} message={result?.message} className="text-[11px]" />
    </span>
  );
}
