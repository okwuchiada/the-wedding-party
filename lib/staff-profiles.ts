import "server-only";
import { prisma } from "@/lib/prisma";

/** A staff member's details as the profile form shows them (dates as YYYY-MM-DD). */
export async function getStaffProfileView(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { staffProfile: true } });
  if (!user) return null;
  const p = user.staffProfile;
  const updatedBy = p?.updatedById ? await prisma.user.findUnique({ where: { id: p.updatedById }, select: { name: true, email: true } }) : null;
  return {
    user: { id: user.id, email: user.email, role: user.role, createdAt: user.createdAt },
    values: {
      fullName: user.name ?? "",
      preferredName: p?.preferredName ?? "",
      jobTitle: p?.jobTitle ?? "",
      phone: p?.phone ?? "",
      dateOfBirth: p?.dateOfBirth ? p.dateOfBirth.toISOString().slice(0, 10) : "",
      gender: p?.gender ?? "",
      nationality: p?.nationality ?? "",
      addressLine: p?.addressLine ?? "",
      city: p?.city ?? "",
      state: p?.state ?? "",
      country: p?.country ?? "",
      emergencyName: p?.emergencyName ?? "",
      emergencyRelationship: p?.emergencyRelationship ?? "",
      emergencyPhone: p?.emergencyPhone ?? "",
    },
    lastUpdated: p ? { at: p.updatedAt.toISOString(), by: updatedBy?.name ?? updatedBy?.email ?? null, bySelf: p.updatedById === user.id } : null,
  };
}

export type StaffProfileView = NonNullable<Awaited<ReturnType<typeof getStaffProfileView>>>;
