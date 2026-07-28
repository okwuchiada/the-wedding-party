import { Pulse } from "@/components/skeleton";

export default function CoupleGallerySkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Pulse key={i} className="aspect-square w-full" />
      ))}
    </div>
  );
}
