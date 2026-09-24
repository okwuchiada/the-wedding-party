import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ivory px-4 py-12">
      <Link
        href="/"
        className="mb-8 font-(family-name:--serif) text-2xl text-foreground hover:text-burnt-orange"
      >
        The Wedding Party
      </Link>
      <div className="w-full max-w-sm bg-white p-8 shadow-[0_18px_40px_-20px_rgba(58,46,40,0.45)]">
        {children}
      </div>
    </div>
  );
}
