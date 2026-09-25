import Link from "next/link";
import ActionButton from "@/components/super/action-button";
import { RoleBadge } from "@/components/super/role-badge";
import { Pagination } from "@/components/super/pagination";
import { SearchForm } from "@/components/super/search-form";
import { date, Table } from "@/components/super/table";
import { impersonateUser, sendUserPasswordReset } from "@/lib/actions/super";
import { requirePermission } from "@/lib/dal";
import { can, isStaff, ROLE_LABELS } from "@/lib/permissions";
import { readPagination } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import type { Prisma, UserRole } from "@/lib/generated/prisma/client";
import { inputClass } from "@/components/ui/field";

const ROLES = Object.keys(ROLE_LABELS) as UserRole[];

const SORTS = {
  newest: { label: "Newest first", orderBy: { createdAt: "desc" } },
  oldest: { label: "Oldest first", orderBy: { createdAt: "asc" } },
  email: { label: "Email A-Z", orderBy: { email: "asc" } },
  name: { label: "Name A-Z", orderBy: { name: { sort: "asc", nulls: "last" } } },
} satisfies Record<string, { label: string; orderBy: Prisma.UserOrderByWithRelationInput }>;
type SortKey = keyof typeof SORTS;

export default async function StaffUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; sort?: string; page?: string; pageSize?: string }>;
}) {
  const staff = await requirePermission("console.view");
  const allowed = { reset: can(staff.role, "user.reset"), impersonate: can(staff.role, "user.impersonate") };
  const sp = await searchParams;
  const { q = "", role, sort } = sp;
  const term = q.trim();
  const sortKey: SortKey = sort && sort in SORTS ? (sort as SortKey) : "newest";
  const { page, pageSize, skip, take } = readPagination(sp);

  const where: Prisma.UserWhereInput = {
    ...(role === "staff"
      ? { role: { not: "USER" } }
      : ROLES.includes(role as UserRole)
        ? { role: role as UserRole }
        : {}),
    ...(term
      ? { OR: [{ email: { contains: term, mode: "insensitive" } }, { name: { contains: term, mode: "insensitive" } }] }
      : {}),
  };
  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: [SORTS[sortKey].orderBy, { id: "asc" }],
      skip,
      take,
      include: { memberships: { include: { wedding: { select: { id: true, slug: true } } } } },
    }),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <SearchForm q={term} placeholder="Email or name">
        <select name="role" defaultValue={role ?? ""} aria-label="Access level" className={`${inputClass} w-auto`}>
          <option value="">All access levels</option>
          <option value="staff">All staff</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
        <select name="sort" defaultValue={sortKey} aria-label="Sort" className={`${inputClass} w-auto`}>
          {Object.entries(SORTS).map(([key, { label }]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </SearchForm>
      <Table head={["User", "Access", "Weddings", "Joined", "Actions"]}>
        {users.map((u) => (
          <tr key={u.id}>
            <td className="px-3 py-3">
              <p>{u.email}</p>
              <p className="text-xs text-muted">
                {u.name ?? "—"}
                {u.phone && ` · ${u.phone}`}
                {!u.passwordHash && " · hasn't set a password"}
              </p>
            </td>
            <td className="px-3 py-3">
              <RoleBadge role={u.role} />
            </td>
            <td className="px-3 py-3 text-xs text-muted">
              {u.memberships.map((m) => (
                <div key={m.id}>
                  <Link href={`/super/weddings/${m.wedding.id}`} className="underline underline-offset-4">
                    /w/{m.wedding.slug}
                  </Link>{" "}
                  <span className="text-muted">({m.role.toLowerCase()})</span>
                </div>
              ))}
            </td>
            <td className="px-3 py-3 text-muted">{date(u.createdAt)}</td>
            <td className="px-3 py-3">
              {u.id === staff.id ? (
                <span className="text-xs text-muted">You</span>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {allowed.impersonate && !isStaff(u.role) && (
                    <ActionButton action={impersonateUser.bind(null, u.id)} label="View as" />
                  )}
                  {allowed.reset && (
                    <ActionButton
                      action={sendUserPasswordReset.bind(null, u.id)}
                      label="Send reset link"
                      confirmText={`Email a password reset link to ${u.email}?`}
                    />
                  )}
                </div>
              )}
            </td>
          </tr>
        ))}
      </Table>
      <Pagination page={page} pageSize={pageSize} total={total} />
    </div>
  );
}
