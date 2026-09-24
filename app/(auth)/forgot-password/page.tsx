import ForgotPasswordForm from "@/components/auth/forgot-password-form";
import { AuthHeading } from "@/components/auth/fields";

export default function ForgotPasswordPage() {
  return (
    <>
      <AuthHeading title="Reset your password" intro="Enter your email and we'll send you a link to choose a new one." />
      <ForgotPasswordForm />
    </>
  );
}
