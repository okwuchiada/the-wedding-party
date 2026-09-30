import Link from "next/link";
import { notFound } from "next/navigation";
import ActionButton from "@/components/super/action-button";
import CompForm from "@/components/super/comp-form";
import DomainForm from "@/components/super/domain-form";
import MarkPaidButton from "@/components/super/mark-paid-button";
import NoteForm from "@/components/super/note-form";
import { Pagination } from "@/components/super/pagination";
import { RoleBadge } from "@/components/super/role-badge";
import { StatusBadge } from "@/components/super/status-badge";
import { date, Table } from "@/components/super/table";
import { impersonateUser, reverifyPayment, sendUserPasswordReset, setWeddingStatus } from "@/lib/actions/super";
import { requirePermission } from "@/lib/dal";
import { coupleTitle, resolveLayout } from "@/lib/layouts";
import { formatMoney } from "@/lib/money";
import { readPagination } from "@/lib/pagination";
import { hasFeature, siteClosesAt } from "@/lib/plans";
import { can, isStaff, ROLE_LABELS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { dashboardPath, guestPath } from "@/lib/tenant";
import { buttonClass } from "@/components/ui/button";

const NAIRA = { currency: "NGN", locale: "en-NG" };
const when = (d: Date) => d.toISOString().slice(0, 16).replace("T", " ");

/** A wedding's case file: who, what state it's in, what's been paid, and what staff have done. */
export default async function WeddingCasePage({
  params,
  searchParams,
}: {
  params: Promise<{ weddingId: string }>;
  searchParams: Promise<{ paymentsPage?: string; paymentsPageSize?: string; activityPage?: string; activityPageSize?: string }>;
}) {
  const staff = await requirePermission("console.view");
  const { weddingId } = await params;
  const sp = await searchParams;
  const paymentsPagination = readPagination(sp, { prefix: "payments", defaultPageSize: 10 });
  const activityPagination = readPagination(sp, { prefix: "activity", defaultPageSize: 10 });

  const wedding = await prisma.wedding.findUnique({
    where: { id: weddingId },
    include: {
      story: true,
      theme: { select: { heroNames: true } },
      plan: true,
      members: { include: { user: true }, orderBy: { createdAt: "asc" } },
      payments: {
        include: { plan: true },
        orderBy: { createdAt: "desc" },
        skip: paymentsPagination.skip,
        take: paymentsPagination.take,
      },
      supportNotes: { include: { author: { select: { email: true, name: true } } }, orderBy: { createdAt: "desc" } },
      _count: { select: { rsvps: true, registryItems: true, contributions: true, payments: true } },
    },
  });
  if (!wedding) notFound();

  const [activityTotal, activity, plans] = await Promise.all([
    prisma.auditLog.count({ where: { weddingId: wedding.id } }),
    prisma.auditLog.findMany({
      where: { weddingId: wedding.id },
      orderBy: { createdAt: "desc" },
      skip: activityPagination.skip,
      take: activityPagination.take,
      include: { actor: { select: { email: true } } },
    }),
    prisma.plan.findMany({ orderBy: [{ sortOrder: "asc" }, { priceKobo: "asc" }], select: { key: true, name: true } }),
  ]);

  const allowed = {
    edit: can(staff.role, "wedding.edit"),
    status: can(staff.role, "wedding.status"),
    comp: can(staff.role, "wedding.comp"),
    reset: can(staff.role, "user.reset"),
    impersonate: can(staff.role, "user.impersonate"),
    reverify: can(staff.role, "payment.reverify"),
    resolve: can(staff.role, "payment.resolve"),
    notes: can(staff.role, "notes.write"),
    domain: can(staff.role, "wedding.manage"),
  };
  const closes = siteClosesAt(wedding.plan, wedding.story?.weddingDate);
  const names = coupleTitle(wedding.story, resolveLayout(wedding.theme).heroNames) ?? wedding.slug;

  return (
    <div className="flex flex-col gap-8">
      <Link href="/super/weddings" className="text-sm underline decoration-ink/25 underline-offset-4">
        All weddings
      </Link>

      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-(family-name:--m-display) text-3xl font-extrabold tracking-tight">{names}</h2>
          <p className="mt-2 flex flex-wrap items-center gap-x-1.5 text-sm text-ink/70">
            /w/{wedding.slug} · <StatusBadge status={wedding.status} /> · {wedding.plan?.name ?? "no plan"}
            {wedding.comped ? " (comped)" : wedding.paidAt ? " (paid)" : ""}
            {wedding.story && ` · wedding ${date(wedding.story.weddingDate)}`}
          </p>
          {hasFeature(wedding.plan, "prioritySupport") && (
            <p className="mt-2 inline-block rounded-full bg-action px-2.5 py-0.5 text-xs font-bold">Priority support</p>
          )}
          <p className="mt-1 text-sm text-ink/60">
            {closes ? `Site ${closes <= new Date() ? "closed" : "open until"} ${date(closes)}` : "Site stays online"}
            {wedding.customDomain && ` · ${wedding.customDomain}`}
          </p>
          <p className="mt-1 text-sm text-ink/60">
            {wedding._count.rsvps} RSVPs · {wedding._count.registryItems} registry items · {wedding._count.contributions} contributions
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={dashboardPath(wedding.id)}
            className={buttonClass("inverse", "md")}
          >
            {allowed.edit ? "Open their dashboard" : "View their dashboard"}
          </Link>
          <a
            href={guestPath(wedding.slug)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass("secondary", "md")}
          >
            Guest site
          </a>
        </div>
      </section>

      {(allowed.status || allowed.comp) && (
        <section className="flex flex-wrap items-center gap-3 rounded-[6px] border border-line bg-surface p-4">
          {allowed.status &&
            (wedding.status === "SUSPENDED" || wedding.status === "ARCHIVED" ? (
              <ActionButton action={setWeddingStatus.bind(null, wedding.id, "restore")} label="Restore" />
            ) : (
              <ActionButton
                action={setWeddingStatus.bind(null, wedding.id, "suspend")}
                label="Suspend"
                tone="danger"
                confirmText={`Suspend /w/${wedding.slug}? Guests will no longer see the site.`}
              />
            ))}
          {allowed.comp && (
            <CompForm weddingId={wedding.id} plans={plans} comped={wedding.comped} currentPlanKey={wedding.plan?.key ?? null} />
          )}
        </section>
      )}

      {allowed.domain && (
        <section className="flex flex-col gap-3 rounded-[6px] border border-line bg-surface p-4">
          <div>
            <h3 className="font-(family-name:--m-display) text-xl font-bold tracking-tight">Custom domain</h3>
            <p className="mt-1 text-sm text-ink/65">
              {hasFeature(wedding.plan, "customDomain")
                ? "Their plan includes a custom domain."
                : "Their plan doesn't include a custom domain; connect one only as an agreed exception."}{" "}
              Add the domain to the hosting project and point its DNS there, then save it here. Guests on that domain see this
              wedding&apos;s site.
            </p>
          </div>
          <DomainForm weddingId={wedding.id} domain={wedding.customDomain} />
        </section>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="flex flex-col gap-4">
          <h3 className="font-(family-name:--m-display) text-2xl font-bold tracking-tight">Case notes</h3>
          {allowed.notes && <NoteForm weddingId={wedding.id} />}
          {wedding.supportNotes.length === 0 ? (
            <p className="text-sm text-ink/60">No notes yet.</p>
          ) : (
            <ol className="flex flex-col gap-3">
              {wedding.supportNotes.map((note) => (
                <li key={note.id} className="rounded-[6px] border border-line bg-surface p-4">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{note.body}</p>
                  <p className="mt-2 text-xs text-ink/55">
                    {note.author?.name ?? note.author?.email ?? "Former staff"} · {when(note.createdAt)}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <h3 className="font-(family-name:--m-display) text-2xl font-bold tracking-tight">People</h3>
          <ul className="flex flex-col divide-y divide-line rounded-[6px] border border-line bg-surface">
            {wedding.members.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                <span className="flex flex-wrap items-center gap-x-1.5">
                  {m.user.email} {isStaff(m.user.role) && <RoleBadge role={m.user.role} />}
                  <span className="text-ink/55">({m.role.toLowerCase()})</span>
                  {!m.user.passwordHash && <span className="text-ink/55"> · invite pending</span>}
                </span>
                <span className="flex gap-1">
                  {allowed.impersonate && !isStaff(m.user.role) && (
                    <ActionButton action={impersonateUser.bind(null, m.user.id)} label="View as" />
                  )}
                  {allowed.reset && (
                    <ActionButton
                      action={sendUserPasswordReset.bind(null, m.user.id)}
                      label="Send reset link"
                      confirmText={`Email a password reset link to ${m.user.email}?`}
                    />
                  )}
                </span>
              </li>
            ))}
          </ul>

          <h3 className="mt-4 font-(family-name:--m-display) text-2xl font-bold tracking-tight">Payments</h3>
          {wedding._count.payments === 0 ? (
            <p className="text-sm text-ink/60">No payments.</p>
          ) : (
            <>
              <Table head={["Date", "Plan", "Amount", "Status", ""]}>
                {wedding.payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-3 py-2.5 text-muted">{date(p.createdAt)}</td>
                    <td className="px-3 py-2.5">{p.plan.name}</td>
                    <td className="px-3 py-2.5">{formatMoney(p.amountKobo, NAIRA)}</td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-3 py-2.5">
                      {p.status !== "SUCCESS" && (
                        <div className="flex flex-col items-start gap-1.5">
                          {allowed.reverify && <ActionButton action={reverifyPayment.bind(null, p.reference)} label="Check" />}
                          {allowed.resolve && <MarkPaidButton reference={p.reference} amountLabel={formatMoney(p.amountKobo, NAIRA)} />}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </Table>
              <Pagination
                prefix="payments"
                page={paymentsPagination.page}
                pageSize={paymentsPagination.pageSize}
                total={wedding._count.payments}
              />
            </>
          )}
        </section>
      </div>

      <section>
        <h3 className="mb-3 font-(family-name:--m-display) text-2xl font-bold tracking-tight">Activity</h3>
        {activityTotal === 0 ? (
          <p className="text-sm text-ink/60">Nothing recorded yet.</p>
        ) : (
          <>
            <Table head={["When", "Who", "What"]}>
              {activity.map((a) => {
                const meta = (a.meta ?? {}) as { role?: keyof typeof ROLE_LABELS };
                return (
                  <tr key={a.id}>
                    <td className="px-3 py-2.5 whitespace-nowrap text-muted">{when(a.createdAt)}</td>
                    <td className="px-3 py-2.5 text-muted">
                      {a.actor?.email ?? "system"}
                      {meta.role && <span className="text-muted"> ({ROLE_LABELS[meta.role]})</span>}
                    </td>
                    <td className="px-3 py-2.5">{a.action}</td>
                  </tr>
                );
              })}
            </Table>
            <Pagination prefix="activity" page={activityPagination.page} pageSize={activityPagination.pageSize} total={activityTotal} />
          </>
        )}
      </section>
    </div>
  );
}
