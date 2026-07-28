import { Pulse } from "@/components/skeleton";

export default function MonetaryGiftSkeleton() {
  return (
    <div className="bg-foreground p-9 shadow-[0_26px_50px_-28px_rgba(58,46,40,0.55)] sm:-rotate-[0.6deg]">
      <Pulse tone="dark" className="h-7 w-40" />
      <Pulse tone="dark" className="mt-2 mb-4 h-3 w-36" />
      <Pulse tone="dark" className="h-8 w-full" />
      <Pulse tone="dark" className="mt-2 h-8 w-full" />
      <Pulse tone="dark" className="mt-2 h-8 w-full" />
      <Pulse tone="dark" className="mt-2 h-8 w-full" />
    </div>
  );
}
