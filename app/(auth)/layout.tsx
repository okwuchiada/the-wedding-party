import MarketingShell, { WovenBand } from "@/components/marketing/shell";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <MarketingShell>
      <div className="flex justify-center px-5 pt-6 pb-20 sm:pt-12">
        <div className="w-full max-w-md overflow-hidden rounded-[6px] border border-(--m-mist) bg-white shadow-[0_30px_60px_-40px_rgb(22_32_74/0.45)]">
          <WovenBand className="h-2" />
          <div className="p-7 sm:p-9">{children}</div>
        </div>
      </div>
    </MarketingShell>
  );
}
