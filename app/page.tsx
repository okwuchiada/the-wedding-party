import Link from "next/link";

// Placeholder until the marketing landing page ships.
export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-ivory px-6 text-center">
      <p className="mb-3 text-xs uppercase tracking-[0.2em] text-olive">The Wedding Party</p>
      <h1 className="font-(family-name:--serif) text-4xl text-foreground sm:text-5xl">
        Your wedding, beautifully online
      </h1>
      <p className="mt-6 max-w-md text-foreground/80">
        A personal wedding website with RSVPs, a gift registry and a guest gallery.
      </p>
      <Link
        href="/dashboard"
        className="mt-8 bg-olive px-6 py-3 text-sm font-medium text-ivory transition-colors hover:bg-burnt-orange"
      >
        Couple sign in
      </Link>
    </main>
  );
}
