import Link from "next/link";
import ResetPasswordForm from "@/components/auth/reset-password-form";
import { AuthHeading } from "@/components/auth/fields";
import { MIN_PASSWORD_LENGTH } from "@/lib/password";
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
        <AuthHeading eyebrow="Account" title="Link expired" />
        <p className="mb-6 text-sm text-foreground/70">
          This link has expired or was already used.
        </p>
        <Link href="/forgot-password" className="text-xs text-burnt-orange hover:underline">
          Request a new link
        </Link>
      </>
    );
  }

  const isInvite = record.purpose === "INVITE";
  return (
    <>
      <AuthHeading
        eyebrow={isInvite ? "Welcome" : "Account"}
        title={isInvite ? "Set your password" : "Choose a new password"}
      />
      <ResetPasswordForm token={token} email={record.user.email} minPasswordLength={MIN_PASSWORD_LENGTH} />
    </>
  );
}
