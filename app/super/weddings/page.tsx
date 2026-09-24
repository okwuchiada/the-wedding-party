import Link from "next/link";
import ActionButton from "@/components/super/action-button";
import CompForm from "@/components/super/comp-form";
import { date, SearchForm, Table } from "@/components/super/table";
import { impersonateUser, setWeddingStatus } from "@/lib/actions/super";
import { requireSuperAdmin } from "@/lib/dal";
import type { Prisma, WeddingStatus } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { dashboardPath, guestPath } from "@/lib/tenant";

const STATUSES: WeddingStatus[] = ["DRAFT", "ACTIVE", "SUSPENDED", "ARCHIVED"];
const LIMIT = 100;

export default async function SuperWeddingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireSuperAdmin();
  const { q = "", status } = await searchParams;
  const term = q.trim();

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

  const [weddings, plans] = await Promise.all([
    prisma.wedding.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: LIMIT,
      include: {
        story: { select: { brideName: true, groomName: true, weddingDate: true } },
        plan: { select: { name: true } },
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
      {weddings.length === LIMIT && <p className="text-xs text-foreground/60">Showing the newest {LIMIT}; search to narrow down.</p>}

      <Table head={["Wedding", "Status", "Plan", "Owners", "Actions"]}>
        {weddings.map((w) => (
          <tr key={w.id}>
            <td className="px-3 py-3">
              <p className="text-foreground">{w.story ? `${w.story.brideName} & ${w.story.groomName}` : "—"}</p>
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
              {w.comped && <span className="text-xs text-foreground/55"> (comped)</span>}
              {w.paidAt && !w.comped && <span className="text-xs text-foreground/55"> (paid)</span>}
            </td>
            <td className="px-3 py-3">
              {w.members.map((m) => (
                <div key={m.id} className="flex flex-wrap items-center gap-2 text-xs text-foreground/80">
                  {m.user.email}
                  {m.user.role !== "SUPER_ADMIN" && (
                    <ActionButton action={impersonateUser.bind(null, m.user.id)} label="View as" />
                  )}
                </div>
              ))}
            </td>
            <td className="px-3 py-3">
              <div className="flex flex-col items-start gap-2">
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
                <CompForm weddingId={w.id} plans={plans} comped={w.comped} />
              </div>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
