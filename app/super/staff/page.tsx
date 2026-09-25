import { AddStaffForm, RoleSelect } from "@/components/super/staff-forms";
import { date, Table } from "@/components/super/table";
import { requirePermission } from "@/lib/dal";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, STAFF_ROLES } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export default async function StaffPage() {
  const admin = await requirePermission("staff.manage");
  const staff = await prisma.user.findMany({
    where: { role: { in: [...STAFF_ROLES] } },
    orderBy: [{ role: "desc" }, { email: "asc" }],
  });

  return (
    <div className="flex flex-col gap-8">
      <AddStaffForm />

      <section>
        <h2 className="mb-3 font-(family-name:--m-display) text-2xl font-bold tracking-tight">Team</h2>
        <Table head={["Person", "Access", "Since", ""]}>
          {staff.map((s) => (
            <tr key={s.id}>
              <td className="px-3 py-3">
                <p>{s.email}</p>
                <p className="text-xs text-foreground/60">
                  {s.name ?? "—"}
                  {!s.passwordHash && " · invite pending"}
                </p>
              </td>
              <td className="px-3 py-3">
                {s.id === admin.id ? (
                  <span className="text-sm">{ROLE_LABELS[s.role]} (you)</span>
                ) : (
                  <RoleSelect userId={s.id} role={s.role} />
                )}
              </td>
              <td className="px-3 py-3 text-foreground/70">{date(s.createdAt)}</td>
              <td />
            </tr>
          ))}
        </Table>
      </section>

      <section className="rounded-[6px] border border-(--m-mist) bg-white p-5">
        <h2 className="font-(family-name:--m-display) text-2xl font-bold tracking-tight">What each level can do</h2>
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {STAFF_ROLES.map((r) => (
            <div key={r}>
              <dt className="font-semibold">{ROLE_LABELS[r]}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-(--m-ink)/75">{ROLE_DESCRIPTIONS[r]}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
