import type { LegalDocument } from "@/lib/legal";

/** Renders a full Terms/Privacy document, used by both the standalone pages and the signup modal. */
export default function LegalDocumentView({ doc, compact = false }: { doc: LegalDocument; compact?: boolean }) {
  return (
    <div>
      {compact ? (
        <h2 className="font-(family-name:--m-display) text-2xl font-extrabold tracking-[-0.02em]">{doc.title}</h2>
      ) : (
        <h1 className="font-(family-name:--m-display) text-4xl font-extrabold tracking-[-0.02em] sm:text-5xl">{doc.title}</h1>
      )}
      <p className={`text-sm text-(--m-ink)/55 ${compact ? "mt-1" : "mt-3"}`}>Last updated {doc.updated}</p>
      <p className="mt-5 max-w-2xl leading-relaxed text-(--m-ink)/75">{doc.intro}</p>
      <div className="mt-8 flex max-w-2xl flex-col gap-8">
        {doc.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-(family-name:--m-display) text-xl font-bold tracking-tight">{section.heading}</h2>
            <div className="mt-2 flex flex-col gap-3">
              {section.body.map((p, i) => (
                <p key={i} className="leading-relaxed text-(--m-ink)/75">
                  {p}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
