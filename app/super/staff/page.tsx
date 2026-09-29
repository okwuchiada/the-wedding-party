import Link from "next/link";
import { AddStaffForm, ResendPasswordButton, RoleSelect } from "@/components/super/staff-forms";
import { Pagination } from "@/components/super/pagination";
import { date, Table } from "@/components/super/table";
import { requirePermission } from "@/lib/dal";
import { readPagination } from "@/lib/pagination";
import { RoleBadge } from "@/components/super/role-badge";
import { ROLE_DESCRIPTIONS, STAFF_ROLES } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export default async function StaffPage({ searchParams }: { searchParams: Promise<{ page?: string; pageSize?: string }> }) {
  const admin = await requirePermission("staff.manage");
  const sp = await searchParams;
  const { page, pageSize, skip, take } = readPagination(sp);
  const where = { role: { in: [...STAFF_ROLES] } };
  const [total, staff] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({ where, orderBy: [{ role: "desc" }, { email: "asc" }], skip, take }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <AddStaffForm />

      <section>
        <h2 className="mb-3 font-(family-name:--m-display) text-2xl font-bold tracking-tight">Team</h2>
        <Table head={["Person", "Access", "Since", ""]}>
          {staff.map((s) => (
            <tr key={s.id}>
              <td className="px-3 py-3">
                <Link href={`/super/staff/${s.id}`} className="underline decoration-(--m-ink)/20 underline-offset-4 hover:decoration-(--m-ink)">
                  {s.email}
                </Link>
                <p className="text-xs text-foreground/60">
                  {s.name ?? "—"}
                  {s.mustChangePassword
                    ? s.tempPasswordExpiresAt && s.tempPasswordExpiresAt < new Date()
                      ? " · temporary password expired"
                      : " · hasn't chosen their own password yet"
                    : !s.passwordHash && " · invite pending"}
                </p>
              </td>
              <td className="px-3 py-3">
                {s.id === admin.id ? (
                  <span className="flex items-center gap-1.5 text-sm">
                    <RoleBadge role={s.role} /> (you)
                  </span>
                ) : (
                  <RoleSelect userId={s.id} role={s.role} />
                )}
              </td>
              <td className="px-3 py-3 text-foreground/70">{date(s.createdAt)}</td>
              <td className="px-3 py-3">
                {s.id !== admin.id && (s.mustChangePassword || !s.passwordHash) && <ResendPasswordButton userId={s.id} email={s.email} />}
              </td>
            </tr>
          ))}
        </Table>
        <Pagination page={page} pageSize={pageSize} total={total} />
      </section>

      <section className="rounded-[6px] border border-(--m-mist) bg-white p-5">
        <h2 className="font-(family-name:--m-display) text-2xl font-bold tracking-tight">What each level can do</h2>
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {STAFF_ROLES.map((r) => (
            <div key={r}>
              <dt>
                <RoleBadge role={r} />
              </dt>
              <dd className="mt-1 text-sm leading-relaxed text-(--m-ink)/75">{ROLE_DESCRIPTIONS[r]}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
