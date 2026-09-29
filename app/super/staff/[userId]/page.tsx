import Link from "next/link";
import { notFound } from "next/navigation";
import { LastUpdated } from "@/components/super/last-updated";
import StaffProfileForm from "@/components/super/staff-profile-form";
import { getCountries } from "@/lib/countries";
import { requirePermission } from "@/lib/dal";
import { RoleBadge } from "@/components/super/role-badge";
import { isStaff } from "@/lib/permissions";
import { getStaffProfileView } from "@/lib/staff-profiles";

/** A staff member's details, for super admins. */
export default async function StaffMemberPage({ params }: { params: Promise<{ userId: string }> }) {
  const admin = await requirePermission("staff.manage");
  const { userId } = await params;
  const [profile, countries] = await Promise.all([getStaffProfileView(userId), getCountries()]);
  if (!profile || !isStaff(profile.user.role)) notFound();

  return (
    <div className="flex max-w-4xl flex-col gap-5">
      <Link href="/super/staff" className="text-sm underline decoration-(--m-ink)/25 underline-offset-4">
        All staff
      </Link>
      <div>
        <h2 className="font-(family-name:--m-display) text-2xl font-bold tracking-tight">{profile.values.fullName || profile.user.email}</h2>
        <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-sm text-foreground/65">
          {profile.user.email} · <RoleBadge role={profile.user.role} /> · on the team since{" "}
          {profile.user.createdAt.toISOString().slice(0, 10)}
        </p>
        <LastUpdated lastUpdated={profile.lastUpdated} />
      </div>
      <StaffProfileForm userId={profile.user.id} values={profile.values} countries={countries} self={profile.user.id === admin.id} />
    </div>
  );
}
