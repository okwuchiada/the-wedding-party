import { Button } from "@/components/ui/button";
import { stopImpersonating } from "@/lib/actions/super";

export default function ImpersonationBanner({ email }: { email: string }) {
  return (
    <form
      action={stopImpersonating}
      className="sticky top-0 z-banner flex flex-wrap items-center justify-center gap-3 bg-coral-deep px-4 py-2 text-[13px] text-paper"
    >
      You&apos;re viewing the site as {email}. Anything you change is saved for real.
      <Button type="submit" variant="outline" size="sm" className="min-h-8 border-paper/60 text-paper hover:border-paper hover:bg-paper hover:text-coral-deep">
        Stop
      </Button>
    </form>
  );
}
