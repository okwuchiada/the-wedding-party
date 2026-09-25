import Link from "next/link";
import ActionButton from "@/components/super/action-button";
import { date, SearchForm, Table } from "@/components/super/table";
import { impersonateUser, sendUserPasswordReset } from "@/lib/actions/super";
import { requirePermission } from "@/lib/dal";
import { can, isStaff, ROLE_LABELS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const LIMIT = 100;

export default async function StaffUsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const staff = await requirePermission("console.view");
  const allowed = { reset: can(staff.role, "user.reset"), impersonate: can(staff.role, "user.impersonate") };
  const { q = "" } = await searchParams;
  const term = q.trim();

  const users = await prisma.user.findMany({
    where: term
      ? { OR: [{ email: { contains: term, mode: "insensitive" } }, { name: { contains: term, mode: "insensitive" } }] }
      : {},
    orderBy: { createdAt: "desc" },
    take: LIMIT,
    include: { memberships: { include: { wedding: { select: { id: true, slug: true } } } } },
  });

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
    </div>
  );
}
