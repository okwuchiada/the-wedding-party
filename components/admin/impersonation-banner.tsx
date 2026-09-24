import { stopImpersonating } from "@/lib/actions/super";

export default function ImpersonationBanner({ email }: { email: string }) {
  return (
    <form
      action={stopImpersonating}
      className="sticky top-0 z-70 flex flex-wrap items-center justify-center gap-3 bg-burnt-orange px-4 py-2 text-xs text-ivory"
    >
      You&apos;re viewing the site as {email}. Anything you change is saved for real.
      <button type="submit" className="border border-ivory/60 px-2.5 py-1 font-medium hover:bg-ivory hover:text-burnt-orange">
        Stop
      </button>
    </form>
  );
}
