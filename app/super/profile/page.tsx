import StaffProfileForm from "@/components/super/staff-profile-form";
import { getCountries } from "@/lib/countries";
import { requirePermission } from "@/lib/dal";
import { ROLE_LABELS } from "@/lib/permissions";
import { getStaffProfileView } from "@/lib/staff-profiles";
import { LastUpdated } from "@/components/super/last-updated";

/** Every staff member's own details. */
export default async function MyProfilePage() {
  const me = await requirePermission("console.view");
  const [profile, countries] = await Promise.all([getStaffProfileView(me.id), getCountries()]);
  if (!profile) return null;

  return (
    <div className="flex max-w-4xl flex-col gap-5">
      <div>
        <h2 className="font-(family-name:--m-display) text-2xl font-bold tracking-tight">My profile</h2>
        <p className="mt-1 text-sm text-foreground/65">
          {profile.user.email} · {ROLE_LABELS[profile.user.role]}. To change your email or access level, ask a super admin.
        </p>
        <LastUpdated lastUpdated={profile.lastUpdated} self />
      </div>
      <StaffProfileForm userId={me.id} values={profile.values} countries={countries} self />
    </div>
  );
}
