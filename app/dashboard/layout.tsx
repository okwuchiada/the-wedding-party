import ImpersonationBanner from "@/components/admin/impersonation-banner";
import { BRAND_CLASS, BRAND_STYLE } from "@/components/marketing/brand";
import { getCurrentUser } from "@/lib/dal";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <div style={BRAND_STYLE} className={`${BRAND_CLASS} min-h-screen`}>
      {user?.impersonatorId && <ImpersonationBanner email={user.email} />}
      {children}
    </div>
  );
}
