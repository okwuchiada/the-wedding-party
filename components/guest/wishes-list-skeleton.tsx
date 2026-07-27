import { Pulse } from "@/components/skeleton";

function WishCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 bg-white p-5 shadow-[0_18px_40px_-20px_rgba(58,46,40,0.45)]">
      <Pulse className="h-4 w-full" />
      <Pulse className="h-4 w-2/3" />
      <Pulse className="mt-1 h-3 w-24" />
    </div>
  );
}

export default function WishesListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <WishCardSkeleton key={i} />
      ))}
    </div>
  );
}
