import { redirect } from "next/navigation";
import SignupForm from "@/components/auth/signup-form";
import { AuthHeading } from "@/components/auth/fields";
import { getCurrentUser } from "@/lib/dal";
import { MIN_PASSWORD_LENGTH } from "@/lib/password-rules";

export default async function SignupPage() {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <>
      <AuthHeading title="Create your site" intro="Free to build and preview. You only pay when you publish." />
      <SignupForm minPasswordLength={MIN_PASSWORD_LENGTH} />
    </>
  );
}
