"use server";

import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { getCountries } from "@/lib/countries";
import { requirePermission } from "@/lib/dal";
import { can, isStaff } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { changedFields, FIELD_LABELS, parseStaffProfile } from "@/lib/staff-profile";

export type StaffProfileState = { error?: string; message?: string } | undefined;

/**
 * Saves a staff member's details. Anyone on staff may update their own; only
 * super admins (staff.manage) may update someone else's. The audit log records
 * which fields changed, not their values.
 */
export async function saveStaffProfile(targetUserId: string, _prev: StaffProfileState, formData: FormData): Promise<StaffProfileState> {
  const me = await requirePermission("console.view");
  const self = targetUserId === me.id;
  if (!self && !can(me.role, "staff.manage")) return { error: "You can only update your own profile" };

  const target = await prisma.user.findUnique({ where: { id: targetUserId }, include: { staffProfile: true } });
  if (!target || !isStaff(target.role)) return { error: "Staff member not found" };

  const countries = new Set((await getCountries()).map((c) => c.code));
  const parsed = parseStaffProfile((name) => formData.get(name), countries);
  if (!parsed.data) return { error: parsed.error };
  const { fullName, ...profile } = parsed.data;

  const changed = changedFields({ fullName: target.name, ...(target.staffProfile ?? {}) }, parsed.data);
  if (changed.length === 0) return { message: "No changes to save." };

  await prisma.$transaction([
    prisma.user.update({ where: { id: target.id }, data: { name: fullName } }),
    prisma.staffProfile.upsert({
      where: { userId: target.id },
      update: { ...profile, updatedById: me.id },
      create: { userId: target.id, ...profile, updatedById: me.id },
    }),
  ]);
  await audit(me.id, "staff.profile.update", { meta: { userId: target.id, email: target.email, self, fields: changed } });

  revalidatePath("/super/profile");
  revalidatePath(`/super/staff/${target.id}`);
  revalidatePath("/super/staff");
  return { message: `Saved: ${changed.map((f) => FIELD_LABELS[f].toLowerCase()).join(", ")}.` };
}
