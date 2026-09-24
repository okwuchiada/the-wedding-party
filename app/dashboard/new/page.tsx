import Link from "next/link";
import CreateWeddingForm from "@/components/admin/create-wedding-form";
import { verifySession } from "@/lib/dal";

export default async function NewWeddingPage() {
  await verifySession();

  return (
    <div className="min-h-screen bg-ivory px-4 py-12 sm:px-8">
      <div className="mx-auto max-w-lg">
        <Link href="/dashboard" className="text-xs text-foreground/60 hover:text-burnt-orange">
          ← Your weddings
        </Link>
        <p className="mt-6 mb-2 text-xs uppercase tracking-[0.2em] text-olive">New wedding</p>
        <h1 className="font-(family-name:--serif) text-3xl text-foreground sm:text-4xl">
          Let&apos;s set up your site
        </h1>
        <p className="mt-3 text-sm text-foreground/70">
          Your site starts as a private draft. You can preview it and fill in the details before
          publishing.
        </p>
        <div className="mt-8 bg-white p-6 shadow-[0_18px_40px_-20px_rgba(58,46,40,0.45)]">
          <CreateWeddingForm />
        </div>
      </div>
    </div>
  );
}
