import type { Metadata } from "next";
import LegalDocumentView from "@/components/marketing/legal-document";
import { TERMS } from "@/lib/legal";

export const metadata: Metadata = { title: "Terms of Service — Vowly" };

export default function TermsPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 pt-10 pb-24 sm:px-8">
      <LegalDocumentView doc={TERMS} />
    </section>
  );
}
