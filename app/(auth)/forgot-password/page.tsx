import ForgotPasswordForm from "@/components/auth/forgot-password-form";
import { AuthHeading } from "@/components/auth/fields";

export default function ForgotPasswordPage() {
  return (
    <>
      <AuthHeading eyebrow="Account" title="Reset your password" />
      <ForgotPasswordForm />
    </>
  );
}
