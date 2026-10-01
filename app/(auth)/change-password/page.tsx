import { redirect } from "next/navigation";
import ChangePasswordForm from "@/components/auth/change-password-form";
import { AuthHeading } from "@/components/auth/fields";
import { getCurrentUser, LOGIN_PATH } from "@/lib/dal";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-rules";

/** Where someone who signed in with a temporary password must choose their own. */
export default async function ChangePasswordPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  // Not verifySession: that would send them straight back here.
  const user = await getCurrentUser();
  if (!user) redirect(LOGIN_PATH);
  const { next } = await searchParams;
  if (!user.mustChangePassword) redirect(next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");

  return (
    <>
      <AuthHeading
        title="Choose your own password"
        intro="You signed in with a temporary password. Pick one only you know to continue; the temporary one stops working."
      />
      <ChangePasswordForm email={user.email} next={next} minPasswordLength={MIN_PASSWORD_LENGTH} />
    </>
  );
}
