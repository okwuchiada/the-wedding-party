import Link from "next/link";
import ActionButton from "@/components/super/action-button";
import CompForm from "@/components/super/comp-form";
import { Pagination } from "@/components/super/pagination";
import { SearchForm } from "@/components/super/search-form";
import { date, Table } from "@/components/super/table";
import { impersonateUser, setWeddingStatus } from "@/lib/actions/super";
import { requirePermission } from "@/lib/dal";
import { coupleTitle, resolveLayout } from "@/lib/layouts";
import { can, isStaff } from "@/lib/permissions";
import type { Prisma, WeddingStatus } from "@/lib/generated/prisma/client";
import { readPagination } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { dashboardPath, guestPath } from "@/lib/tenant";
import { hasFeature } from "@/lib/plans";

const STATUSES: WeddingStatus[] = ["DRAFT", "ACTIVE", "SUSPENDED", "ARCHIVED"];

export default async function SuperWeddingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string; pageSize?: string }>;
}) {
  const staff = await requirePermission("console.view");
  const allowed = {
    status: can(staff.role, "wedding.status"),
    comp: can(staff.role, "wedding.comp"),
    impersonate: can(staff.role, "user.impersonate"),
  };
  const sp = await searchParams;
  const { q = "", status } = sp;
  const term = q.trim();
  const { page, pageSize, skip, take } = readPagination(sp);

  const where: Prisma.WeddingWhereInput = {
    ...(STATUSES.includes(status as WeddingStatus) ? { status: status as WeddingStatus } : {}),
    ...(term
      ? {
          OR: [
            { slug: { contains: term, mode: "insensitive" } },
            { story: { brideName: { contains: term, mode: "insensitive" } } },
            { story: { groomName: { contains: term, mode: "insensitive" } } },
            { members: { some: { user: { email: { contains: term, mode: "insensitive" } } } } },
          ],
        }
      : {}),
  };

  const [total, weddings, plans] = await Promise.all([
    prisma.wedding.count({ where }),
    prisma.wedding.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        story: { select: { brideName: true, groomName: true, weddingDate: true } },
        theme: { select: { heroNames: true } },
        plan: { select: { key: true, name: true, features: true } },
        members: { where: { role: "OWNER" }, include: { user: { select: { id: true, email: true, role: true } } } },
      },
    }),
    prisma.plan.findMany({ orderBy: [{ sortOrder: "asc" }, { priceKobo: "asc" }], select: { key: true, name: true } }),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <SearchForm q={term} placeholder="Slug, couple name or owner email">
        <select name="status" defaultValue={status ?? ""} className="border border-(--m-mist) bg-white px-3 py-2 text-sm">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.toLowerCase()}
            </option>
          ))}
        </select>
      </SearchForm>
      <Table head={["Wedding", "Status", "Plan", "Owners", "Actions"]}>
        {weddings.map((w) => (
          <tr key={w.id}>
            <td className="px-3 py-3">
              <Link href={`/super/weddings/${w.id}`} className="font-medium text-foreground underline decoration-(--m-ink)/20 underline-offset-4 hover:decoration-(--m-ink)">
                {coupleTitle(w.story, resolveLayout(w.theme).heroNames) ?? w.slug}
              </Link>
              <p className="text-xs text-foreground/60">
                /w/{w.slug} · {w.story ? date(w.story.weddingDate) : "no date"} · created {date(w.createdAt)}
              </p>
              <p className="mt-1 flex gap-3 text-xs">
                <Link href={dashboardPath(w.id)} className="text-olive underline hover:text-burnt-orange">
                  Dashboard
                </Link>
                <a href={guestPath(w.slug)} target="_blank" rel="noopener noreferrer" className="text-olive underline hover:text-burnt-orange">
                  Guest site
                </a>
              </p>
            </td>
            <td className="px-3 py-3 text-foreground/80">{w.status.toLowerCase()}</td>
            <td className="px-3 py-3 text-foreground/80">
              {w.plan?.name ?? "—"}
              {hasFeature(w.plan, "prioritySupport") && (
                <span className="ml-1.5 rounded-full bg-(--m-gold) px-1.5 py-0.5 text-[10px] font-bold">Priority</span>
              )}
              {w.comped && <span className="text-xs text-foreground/55"> (comped)</span>}
              {w.paidAt && !w.comped && <span className="text-xs text-foreground/55"> (paid)</span>}
            </td>
            <td className="px-3 py-3">
              {w.members.map((m) => (
                <div key={m.id} className="flex flex-wrap items-center gap-2 text-xs text-foreground/80">
                  {m.user.email}
                  {allowed.impersonate && !isStaff(m.user.role) && (
                    <ActionButton action={impersonateUser.bind(null, m.user.id)} label="View as" />
                  )}
                </div>
              ))}
            </td>
            <td className="px-3 py-3">
              <div className="flex flex-col items-start gap-2">
                {allowed.status && (
                <div className="flex flex-wrap gap-1">
                  {w.status === "SUSPENDED" || w.status === "ARCHIVED" ? (
                    <ActionButton action={setWeddingStatus.bind(null, w.id, "restore")} label="Restore" />
                  ) : (
                    <ActionButton
                      action={setWeddingStatus.bind(null, w.id, "suspend")}
                      label="Suspend"
                      tone="danger"
                      confirmText={`Suspend /w/${w.slug}? Guests will no longer see the site.`}
                    />
                  )}
                  {w.status !== "ARCHIVED" && (
                    <ActionButton
                      action={setWeddingStatus.bind(null, w.id, "archive")}
                      label="Archive"
                      confirmText={`Archive /w/${w.slug}? Guests will no longer see the site.`}
                    />
                  )}
                </div>
                )}
                {allowed.comp && (
                  <CompForm weddingId={w.id} plans={plans} comped={w.comped} currentPlanKey={w.plan?.key ?? null} />
                )}
                {!allowed.status && !allowed.comp && (
                  <Link href={`/super/weddings/${w.id}`} className="text-xs underline underline-offset-4">
                    Open case
                  </Link>
                )}
              </div>
            </td>
          </tr>
        ))}
      </Table>
      <Pagination page={page} pageSize={pageSize} total={total} />
    </div>
  );
}
