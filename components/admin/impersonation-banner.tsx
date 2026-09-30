import { stopImpersonating } from "@/lib/actions/super";

export default function ImpersonationBanner({ email }: { email: string }) {
  return (
    <form
      action={stopImpersonating}
      className="sticky top-0 z-banner flex flex-wrap items-center justify-center gap-3 bg-danger px-4 py-2 text-[13px] text-paper"
    >
      You&apos;re viewing the site as {email}. Anything you change is saved for real.
      <button type="submit" className="min-h-8 rounded-full border border-paper/60 px-3 font-semibold hover:bg-paper hover:text-danger">
        Stop
      </button>
    </form>
  );
}
