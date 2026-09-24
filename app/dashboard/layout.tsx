import ImpersonationBanner from "@/components/admin/impersonation-banner";
import { getCurrentUser } from "@/lib/dal";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <>
      {user?.impersonatorId && <ImpersonationBanner email={user.email} />}
      {children}
    </>
  );
}
