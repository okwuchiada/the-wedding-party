import Link from "next/link";
import ActionButton from "@/components/super/action-button";
import { Pagination } from "@/components/super/pagination";
import { SearchForm } from "@/components/super/search-form";
import { date, Table } from "@/components/super/table";
import { impersonateUser, sendUserPasswordReset } from "@/lib/actions/super";
import { requirePermission } from "@/lib/dal";
import { can, isStaff, ROLE_LABELS } from "@/lib/permissions";
import { readPagination } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";

export default async function StaffUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string }>;
}) {
  const staff = await requirePermission("console.view");
  const allowed = { reset: can(staff.role, "user.reset"), impersonate: can(staff.role, "user.impersonate") };
  const sp = await searchParams;
  const { q = "" } = sp;
  const term = q.trim();
  const { page, pageSize, skip, take } = readPagination(sp);

  const where: Prisma.UserWhereInput = term
    ? { OR: [{ email: { contains: term, mode: "insensitive" } }, { name: { contains: term, mode: "insensitive" } }] }
    : {};
  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: { memberships: { include: { wedding: { select: { id: true, slug: true } } } } },
    }),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <SearchForm q={term} placeholder="Email or name" />
      <Table head={["User", "Access", "Weddings", "Joined", "Actions"]}>
        {users.map((u) => (
          <tr key={u.id}>
            <td className="px-3 py-3">
              <p>{u.email}</p>
              <p className="text-xs text-foreground/60">
                {u.name ?? "—"}
                {!u.passwordHash && " · hasn't set a password"}
              </p>
            </td>
            <td className="px-3 py-3 text-foreground/80">{ROLE_LABELS[u.role]}</td>
            <td className="px-3 py-3 text-xs text-foreground/80">
              {u.memberships.map((m) => (
                <div key={m.id}>
                  <Link href={`/super/weddings/${m.wedding.id}`} className="underline underline-offset-4">
                    /w/{m.wedding.slug}
                  </Link>{" "}
                  <span className="text-foreground/50">({m.role.toLowerCase()})</span>
                </div>
              ))}
            </td>
            <td className="px-3 py-3 text-foreground/70">{date(u.createdAt)}</td>
            <td className="px-3 py-3">
              {u.id === staff.id ? (
                <span className="text-xs text-foreground/50">You</span>
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
