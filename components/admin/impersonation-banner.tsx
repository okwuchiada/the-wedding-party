import { Button } from "@/components/ui/button";
import { stopImpersonating } from "@/lib/actions/super";

export default function ImpersonationBanner({ email }: { email: string }) {
  return (
    <form
      action={stopImpersonating}
      className="sticky top-0 z-70 flex flex-wrap items-center justify-center gap-3 bg-coral-deep px-4 py-2 text-xs text-paper"
    >
      You&apos;re viewing the site as {email}. Anything you change is saved for real.
      <Button type="submit" variant="outline" size="xs" className="border-paper/60 py-1 text-paper hover:border-paper hover:bg-paper hover:text-coral-deep">
        Stop
      </Button>
    </form>
  );
}
