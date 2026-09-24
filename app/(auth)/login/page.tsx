import { redirect } from "next/navigation";
import LoginForm from "@/components/auth/login-form";
import { AuthHeading } from "@/components/auth/fields";
import { getCurrentUser } from "@/lib/dal";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getCurrentUser()) redirect("/dashboard");
  const { next } = await searchParams;

  return (
    <>
      <AuthHeading title="Welcome back" intro="Sign in to manage your wedding site." />
      <LoginForm next={typeof next === "string" ? next : undefined} />
    </>
  );
}
