import { Pulse } from "@/components/skeleton";

function GiftCardSkeleton() {
  return (
    <article className="flex flex-col bg-white shadow-[0_18px_40px_-20px_rgba(58,46,40,0.45)]">
      <Pulse className="h-45 w-full" />
      <div className="flex flex-1 flex-col gap-3 p-5.5">
        <Pulse className="h-6 w-3/4" />
        <Pulse className="h-3 w-16" />
        <Pulse className="mt-2 h-1 w-full" />
        <div className="mt-auto grid grid-cols-3 gap-2 pt-5">
          <Pulse className="h-9" />
          <Pulse className="h-9" />
          <Pulse className="h-9" />
        </div>
      </div>
    </article>
  );
}

export default function RegistrySkeleton() {
  return (
    <div>
      <div className="mb-9 flex gap-6 border-b border-olive/20 pb-3">
        <Pulse className="h-3 w-10" />
        <Pulse className="h-3 w-20" />
        <Pulse className="h-3 w-16" />
        <Pulse className="h-3 w-14" />
      </div>

      <div className="grid grid-cols-1 items-start gap-5.5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <GiftCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
