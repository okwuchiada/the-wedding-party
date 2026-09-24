import { redirect } from "next/navigation";
import LoginForm from "@/components/auth/login-form";
import { AuthHeading } from "@/components/auth/fields";
import { getCurrentUser } from "@/lib/dal";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getCurrentUser()) redirect("/dashboard");
  const { next } = await searchParams;

  return (
    <>
      <AuthHeading eyebrow="Welcome back" title="Sign in" />
      <LoginForm next={typeof next === "string" ? next : undefined} />
    </>
  );
}
