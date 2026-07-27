import LoginForm from "@/components/admin/login-form";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ivory px-4">
      <div className="w-full max-w-sm bg-white p-8 shadow-[0_18px_40px_-20px_rgba(58,46,40,0.45)]">
        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-olive">Admin</p>
        <h1 className="mb-6 font-(family-name:--serif) text-2xl text-foreground">Sign in</h1>
        <LoginForm />
      </div>
    </div>
  );
}
