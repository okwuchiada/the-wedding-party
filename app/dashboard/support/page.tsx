import Link from "next/link";
import { redirect } from "next/navigation";
import DashboardBar from "@/components/admin/dashboard-bar";
import SupportReplyForm from "@/components/support/reply-form";
import SupportRequestForm from "@/components/support/request-form";
import { SupportStatusBadge } from "@/components/support/status-badge";
import { SupportThread } from "@/components/support/thread";
import { replyToSupportRequest } from "@/lib/actions/support";
import { verifySession } from "@/lib/dal";
import { coupleTitle, resolveLayout } from "@/lib/layouts";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { topicLabel } from "@/lib/support";

const day = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** Dashboard → Support: raise a request with the Vowly team and follow the replies. Staff answer in Staff console → Requests. */
export default async function SupportPage({ searchParams }: { searchParams: Promise<{ wedding?: string }> }) {
  const me = await verifySession();
  if (can(me.role, "console.view") && !me.impersonatorId) redirect("/super/requests");

  const [memberships, requests] = await Promise.all([
    prisma.weddingMember.findMany({
      where: { userId: me.id },
      orderBy: { createdAt: "asc" },
      select: { wedding: { select: { id: true, slug: true, story: { select: { brideName: true, groomName: true } }, theme: { select: { heroNames: true } } } } },
    }),
    prisma.supportRequest.findMany({
      where: { requesterId: me.id },
      orderBy: { updatedAt: "desc" },
      include: {
        wedding: { select: { slug: true } },
        messages: { orderBy: { createdAt: "asc" }, include: { author: { select: { name: true, email: true } } } },
      },
    }),
  ]);
  const weddings = memberships.map(({ wedding: w }) => ({ id: w.id, name: coupleTitle(w.story, resolveLayout(w.theme).heroNames) ?? w.slug }));
  const weddingParam = (await searchParams).wedding;
  const defaultWeddingId = weddings.some((w) => w.id === weddingParam) ? weddingParam : undefined;
  const back = weddings.length === 1 ? { href: `/dashboard/${weddings[0].id}`, label: `Back to dashboard` } : { href: "/dashboard", label: "Your weddings" };

  return (
    <>
      <DashboardBar />
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-5 pt-4 pb-20 sm:px-8">
        <Link href={back.href} className="self-start text-sm underline decoration-ink/25 underline-offset-4 hover:decoration-ink">
          {back.label}
        </Link>
        <div>
          <h1 className="font-(family-name:--m-display) text-4xl font-extrabold tracking-[-0.03em]">Contact support</h1>
          <p className="mt-2 max-w-xl text-ink/65">
            Tell us what&apos;s going on and the Vowly team will get back to you here. We&apos;ll also email you at {me.email} when we reply.
          </p>
        </div>

        <SupportRequestForm weddings={weddings} defaultWeddingId={defaultWeddingId} />

        <section className="flex flex-col gap-4">
          <h2 className="font-(family-name:--m-display) text-2xl font-bold tracking-tight">Your requests</h2>
          {requests.length === 0 ? (
            <p className="text-sm text-ink/60">You haven&apos;t raised any requests yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {requests.map((r, i) => (
                <li key={r.id}>
                  {/* The most recent request starts open; the rest expand on click. */}
                  <details open={i === 0} className="group rounded-[6px] border border-border bg-white">
                    <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-4">
                      <span className="min-w-0">
                        <span className="block font-semibold">{r.subject}</span>
                        <span className="mt-0.5 block text-xs text-ink/60">
                          {topicLabel(r.topic)}
                          {r.wedding && ` · /w/${r.wedding.slug}`} · Updated {day(r.updatedAt)}
                        </span>
                      </span>
                      <SupportStatusBadge status={r.status} />
                    </summary>
                    <div className="flex flex-col gap-4 border-t border-border p-4">
                      <SupportThread messages={r.messages} viewer="couple" />
                      <SupportReplyForm
                        action={replyToSupportRequest.bind(null, r.id)}
                        label={r.status === "RESOLVED" ? "Still need help?" : "Add a reply"}
                        note={r.status === "RESOLVED" ? "Replying reopens this request." : undefined}
                      />
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
