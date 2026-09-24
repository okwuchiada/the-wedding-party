import ActionButton from "@/components/super/action-button";
import { date, SearchForm, Table } from "@/components/super/table";
import { impersonateUser, sendUserPasswordReset, setUserRole } from "@/lib/actions/super";
import { requireSuperAdmin } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

const LIMIT = 100;

export default async function SuperUsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const admin = await requireSuperAdmin();
  const { q = "" } = await searchParams;
  const term = q.trim();

  const users = await prisma.user.findMany({
    where: term
      ? { OR: [{ email: { contains: term, mode: "insensitive" } }, { name: { contains: term, mode: "insensitive" } }] }
      : {},
    orderBy: { createdAt: "desc" },
    take: LIMIT,
    include: { memberships: { include: { wedding: { select: { slug: true } } } } },
  });

  return (
    <div className="flex flex-col gap-5">
      <SearchForm q={term} placeholder="Email or name" />
      <Table head={["User", "Role", "Weddings", "Joined", "Actions"]}>
        {users.map((u) => (
          <tr key={u.id}>
            <td className="px-3 py-3">
              <p>{u.email}</p>
              <p className="text-xs text-foreground/60">
                {u.name ?? "—"}
                {!u.passwordHash && " · hasn't set a password"}
              </p>
            </td>
            <td className="px-3 py-3 text-foreground/80">{u.role === "SUPER_ADMIN" ? "Super admin" : "User"}</td>
            <td className="px-3 py-3 text-xs text-foreground/80">
              {u.memberships.map((m) => (
                <div key={m.id}>
                  /w/{m.wedding.slug} <span className="text-foreground/50">({m.role.toLowerCase()})</span>
                </div>
              ))}
            </td>
            <td className="px-3 py-3 text-foreground/70">{date(u.createdAt)}</td>
            <td className="px-3 py-3">
              {u.id === admin.id ? (
                <span className="text-xs text-foreground/50">You</span>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {u.role !== "SUPER_ADMIN" && <ActionButton action={impersonateUser.bind(null, u.id)} label="View as" />}
                  <ActionButton
                    action={sendUserPasswordReset.bind(null, u.id)}
                    label="Send reset link"
                    confirmText={`Email a password reset link to ${u.email}?`}
                  />
                  {u.role === "SUPER_ADMIN" ? (
                    <ActionButton
                      action={setUserRole.bind(null, u.id, "USER")}
                      label="Remove super admin"
                      tone="danger"
                      confirmText={`Remove super admin access from ${u.email}?`}
                    />
                  ) : (
                    <ActionButton
                      action={setUserRole.bind(null, u.id, "SUPER_ADMIN")}
                      label="Make super admin"
                      tone="danger"
                      confirmText={`Give ${u.email} full access to every wedding and this console?`}
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
