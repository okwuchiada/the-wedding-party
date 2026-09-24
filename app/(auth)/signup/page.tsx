import { redirect } from "next/navigation";
import SignupForm from "@/components/auth/signup-form";
import { AuthHeading } from "@/components/auth/fields";
import { getCurrentUser } from "@/lib/dal";
import { MIN_PASSWORD_LENGTH } from "@/lib/password";

export default async function SignupPage() {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <>
      <AuthHeading eyebrow="Get started" title="Create your account" />
      <SignupForm minPasswordLength={MIN_PASSWORD_LENGTH} />
    </>
  );
}
