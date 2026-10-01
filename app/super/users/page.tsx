import Link from "next/link";
import ActionButton from "@/components/super/action-button";
import { RoleBadge } from "@/components/super/role-badge";
import { Pagination } from "@/components/super/pagination";
import { FilterSelect, SearchForm } from "@/components/super/search-form";
import { date, Table } from "@/components/super/table";
import { TableCell, TableRow } from "@/components/ui/table";
import { impersonateUser, sendUserPasswordReset } from "@/lib/actions/super";
import { requirePermission } from "@/lib/dal";
import { can, isStaff, ROLE_LABELS } from "@/lib/permissions";
import { readPagination } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import type { Prisma, UserRole } from "@/lib/generated/prisma/client";

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
        <FilterSelect
          name="role"
          defaultValue={role ?? ""}
          allLabel="All access levels"
          label="Access level"
          options={[{ value: "staff", label: "All staff" }, ...ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))]}
        />
        <FilterSelect name="sort" defaultValue={sortKey} label="Sort" options={Object.entries(SORTS).map(([key, { label }]) => ({ value: key, label }))} />
      </SearchForm>
      <Table head={["User", "Access", "Weddings", "Joined", "Actions"]}>
        {users.map((u) => (
          <TableRow key={u.id}>
            <TableCell>
              <p>{u.email}</p>
              <p className="text-xs text-muted-foreground">
                {u.name ?? "—"}
                {u.phone && ` · ${u.phone}`}
                {!u.passwordHash && " · hasn't set a password"}
              </p>
            </TableCell>
            <TableCell>
              <RoleBadge role={u.role} />
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {u.memberships.map((m) => (
                <div key={m.id}>
                  <Link href={`/super/weddings/${m.wedding.id}`} className="underline underline-offset-4">
                    /w/{m.wedding.slug}
                  </Link>{" "}
                  <span className="text-muted-foreground">({m.role.toLowerCase()})</span>
                </div>
              ))}
            </TableCell>
            <TableCell className="text-muted-foreground">{date(u.createdAt)}</TableCell>
            <TableCell>
              {u.id === staff.id ? (
                <span className="text-xs text-muted-foreground">You</span>
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
            </TableCell>
          </TableRow>
        ))}
      </Table>
      <Pagination page={page} pageSize={pageSize} total={total} />
    </div>
  );
}
