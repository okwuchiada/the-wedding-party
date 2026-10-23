import Link from "next/link";
import { Pagination } from "@/components/super/pagination";
import { FilterSelect, SearchForm } from "@/components/super/search-form";
import { date, Table } from "@/components/super/table";
import { SupportStatusBadge } from "@/components/support/status-badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { requirePermission } from "@/lib/dal";
import type { Prisma } from "@/lib/generated/prisma/client";
import { readPagination } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { isSupportStatus, SUPPORT_STATUS_LABELS, SUPPORT_STATUSES, SUPPORT_TOPICS, topicLabel } from "@/lib/support";

// "waiting" (open or in progress) is the default view: what still needs someone.
const VIEWS = [
  { value: "waiting", label: "Needs attention" },
  ...SUPPORT_STATUSES.map((s) => ({ value: s, label: SUPPORT_STATUS_LABELS[s] })),
  { value: "all", label: "All requests" },
];

/** Requests couples have raised from Dashboard → Support, oldest-waiting first. */
export default async function SuperRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; topic?: string; mine?: string; page?: string; pageSize?: string }>;
}) {
  const staff = await requirePermission("console.view");
  const sp = await searchParams;
  const { q = "", topic, mine } = sp;
  const view = sp.status && VIEWS.some((v) => v.value === sp.status) ? sp.status : "waiting";
  const term = q.trim();
  const { page, pageSize, skip, take } = readPagination(sp);

  const where: Prisma.SupportRequestWhereInput = {
    ...(view === "waiting" ? { status: { not: "RESOLVED" } } : isSupportStatus(view) ? { status: view } : {}),
    ...(topic && SUPPORT_TOPICS.some((t) => t.key === topic) ? { topic } : {}),
    ...(mine === "1" ? { assigneeId: staff.id } : {}),
    ...(term
      ? {
          OR: [
            { subject: { contains: term, mode: "insensitive" } },
            { requester: { email: { contains: term, mode: "insensitive" } } },
            { wedding: { slug: { contains: term, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
  const [total, requests] = await Promise.all([
    prisma.supportRequest.count({ where }),
    prisma.supportRequest.findMany({
      where,
      // Waiting requests: longest-waiting first. Otherwise most recent activity first.
      orderBy: view === "waiting" ? [{ updatedAt: "asc" }, { id: "asc" }] : [{ updatedAt: "desc" }, { id: "asc" }],
      skip,
      take,
      include: {
        requester: { select: { email: true, name: true } },
        assignee: { select: { email: true, name: true } },
        wedding: { select: { slug: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { fromStaff: true } },
      },
    }),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <SearchForm q={term} placeholder="Subject, couple's email or wedding slug">
        <FilterSelect name="status" defaultValue={view} label="Status" options={VIEWS} />
        <FilterSelect name="topic" defaultValue={topic ?? ""} allLabel="All topics" label="Topic" options={SUPPORT_TOPICS.map((t) => ({ value: t.key, label: t.label }))} />
        <FilterSelect
          name="mine"
          defaultValue={mine === "1" ? "1" : ""}
          allLabel="Anyone's"
          label="Assigned to"
          options={[{ value: "1", label: "Assigned to me" }]}
        />
      </SearchForm>
      <Table head={["Updated", "Subject", "From", "Wedding", "Status", "Assigned to"]}>
        {requests.map((r) => {
          const awaitingUs = r.status !== "RESOLVED" && !r.messages[0]?.fromStaff;
          return (
            <TableRow key={r.id}>
              <TableCell className="text-muted-foreground">{date(r.updatedAt)}</TableCell>
              <TableCell className="max-w-72">
                <Link href={`/super/requests/${r.id}`} className="font-medium underline decoration-ink/25 underline-offset-4 hover:decoration-ink">
                  {r.subject}
                </Link>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {topicLabel(r.topic)}
                  {awaitingUs && <span className="font-semibold text-coral-deep"> · Waiting on us</span>}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground">{r.requester.name ?? r.requester.email}</TableCell>
              <TableCell className="text-muted-foreground">{r.wedding ? `/w/${r.wedding.slug}` : "—"}</TableCell>
              <TableCell>
                <SupportStatusBadge status={r.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">{r.assignee ? (r.assignee.name ?? r.assignee.email) : "Unassigned"}</TableCell>
            </TableRow>
          );
        })}
      </Table>
      {total === 0 && <p className="text-sm text-ink/60">No requests here. Nice.</p>}
      <Pagination page={page} pageSize={pageSize} total={total} />
    </div>
  );
}
