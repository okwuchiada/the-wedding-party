import Link from "next/link";
import ResetPasswordForm from "@/components/auth/reset-password-form";
import { AuthHeading, authLinkClass } from "@/components/auth/fields";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-rules";
import { findValidToken } from "@/lib/tokens";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const record = await findValidToken(token);

  if (!record || typeof token !== "string") {
    return (
      <>
        <AuthHeading title="This link has expired" intro="Reset links work once and expire after an hour. Invite links last 7 days." />
        <Link href="/forgot-password" className={authLinkClass}>
          Send me a new link
        </Link>
      </>
    );
  }

  const isInvite = record.purpose === "INVITE";
  return (
    <>
      <AuthHeading
        title={isInvite ? "Set your password" : "Choose a new password"}
        intro={isInvite ? "You've been invited to help manage a wedding site. Choose a password to get started." : undefined}
      />
      <ResetPasswordForm token={token} email={record.user.email} minPasswordLength={MIN_PASSWORD_LENGTH} />
    </>
  );
}
