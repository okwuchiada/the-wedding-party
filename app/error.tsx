"use client";

import { useEffect } from "react";
import { BRAND_CLASS, BRAND_STYLE } from "@/components/marketing/brand";
import { Button } from "@/components/ui/button";

export default function Error({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={BRAND_STYLE} className={`${BRAND_CLASS} flex min-h-screen items-center justify-center px-5`}>
      <div className="flex max-w-md flex-col items-start gap-4">
        <h1 className="font-(family-name:--m-display) text-3xl font-extrabold tracking-[-0.02em]">Something went wrong</h1>
        <p className="text-(--m-ink)/75">We couldn&apos;t load this page. Your changes up to now are saved.</p>
        <Button size="lg" onClick={() => unstable_retry()}>Try again</Button>
        {error.digest && <p className="text-[13px] text-muted-foreground">Reference: {error.digest}</p>}
      </div>
    </div>
  );
}
