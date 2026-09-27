import type { Metadata } from "next";
import LegalDocumentView from "@/components/marketing/legal-document";
import { PRIVACY } from "@/lib/legal";

export const metadata: Metadata = { title: "Privacy Policy — Vowly" };

export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 pt-10 pb-24 sm:px-8">
      <LegalDocumentView doc={PRIVACY} />
    </section>
  );
}
