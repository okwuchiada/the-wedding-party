import Link from "next/link";
import { notFound } from "next/navigation";
import ActionButton from "@/components/super/action-button";
import SupportReplyForm from "@/components/support/reply-form";
import { SupportStatusBadge } from "@/components/support/status-badge";
import { SupportThread } from "@/components/support/thread";
import { assignSupportRequestToMe, replyAsStaff, setSupportRequestStatus } from "@/lib/actions/support";
import { requirePermission } from "@/lib/dal";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { SUPPORT_STATUS_LABELS, SUPPORT_STATUSES, topicLabel } from "@/lib/support";

const when = (d: Date) => d.toISOString().slice(0, 16).replace("T", " ");

/** One couple's request: the thread, a reply box, and its status and owner. */
export default async function SupportRequestPage({ params }: { params: Promise<{ requestId: string }> }) {
  const staff = await requirePermission("console.view");
  const canRespond = can(staff.role, "support.respond");
  const { requestId } = await params;

  const request = await prisma.supportRequest.findUnique({
    where: { id: requestId },
    include: {
      requester: { select: { email: true, name: true, phone: true } },
      assignee: { select: { id: true, email: true, name: true } },
      wedding: { select: { id: true, slug: true } },
      messages: { orderBy: { createdAt: "asc" }, include: { author: { select: { name: true, email: true } } } },
    },
  });
  if (!request) notFound();

  return (
    <div className="flex flex-col gap-8">
      <Link href="/super/requests" className="self-start text-sm underline decoration-ink/25 underline-offset-4 hover:decoration-ink">
        All requests
      </Link>

      <section className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide text-ink/60 uppercase">{topicLabel(request.topic)}</p>
          <h2 className="mt-1 font-(family-name:--m-display) text-3xl font-extrabold tracking-tight">{request.subject}</h2>
          <p className="mt-2 text-sm text-ink/65">Raised {when(request.createdAt)}</p>
        </div>
        <SupportStatusBadge status={request.status} />
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="flex flex-col gap-4">
          <h3 className="font-(family-name:--m-display) text-2xl font-bold tracking-tight">Conversation</h3>
          <SupportThread messages={request.messages} viewer="staff" />
          {canRespond ? (
            <SupportReplyForm
              action={replyAsStaff.bind(null, request.id)}
              label="Reply to the couple"
              placeholder="They'll see this in their dashboard and get an email."
              allowResolve
            />
          ) : (
            <p className="text-sm text-ink/60">Your role can read requests but not reply.</p>
          )}
        </section>

        <aside className="flex flex-col gap-4">
          <section className="flex flex-col gap-2 rounded-[6px] border border-border bg-card p-4 text-sm">
            <h3 className="font-semibold">Couple</h3>
            <p>{request.requester.name ?? "No name given"}</p>
            <p className="text-ink/70 select-all">{request.requester.email}</p>
            {request.requester.phone && <p className="text-ink/70 select-all">{request.requester.phone}</p>}
            {request.wedding ? (
              <Link href={`/super/weddings/${request.wedding.id}`} className="underline decoration-ink/25 underline-offset-4 hover:decoration-ink">
                Open /w/{request.wedding.slug} case file
              </Link>
            ) : (
              <p className="text-ink/60">Not about a particular wedding</p>
            )}
          </section>

          <section className="flex flex-col gap-3 rounded-[6px] border border-border bg-card p-4 text-sm">
            <h3 className="font-semibold">Handling</h3>
            <p className="text-ink/70">
              Assigned to {request.assignee ? (request.assignee.id === staff.id ? "you" : (request.assignee.name ?? request.assignee.email)) : "nobody yet"}
            </p>
            {canRespond && (
              <div className="flex flex-wrap gap-2">
                {request.assignee?.id !== staff.id && <ActionButton action={assignSupportRequestToMe.bind(null, request.id)} label="Assign to me" />}
                {SUPPORT_STATUSES.filter((s) => s !== request.status).map((s) => (
                  <ActionButton key={s} action={setSupportRequestStatus.bind(null, request.id, s)} label={`Mark ${SUPPORT_STATUS_LABELS[s].toLowerCase()}`} />
                ))}
              </div>
            )}
            {request.resolvedAt && <p className="text-xs text-ink/55">Resolved {when(request.resolvedAt)}</p>}
          </section>
        </aside>
      </div>
    </div>
  );
}
