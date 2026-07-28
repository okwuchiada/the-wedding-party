import { Pulse } from "@/components/skeleton";

export default function HowWeMetSkeleton() {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-1/2 hidden w-px bg-olive/20 sm:block" />
      <div className="flex flex-col gap-16">
        {Array.from({ length: 3 }).map((_, i) => {
          const flip = i % 2 === 1;
          return (
            <div
              key={i}
              className="grid grid-cols-1 items-center gap-6 sm:grid-cols-2 sm:gap-12"
            >
              <div
                className={`flex justify-center ${flip ? "sm:order-2 sm:justify-start" : "sm:order-1 sm:justify-end"}`}
              >
                <Pulse className="h-64 w-60" />
              </div>
              <div className={flip ? "sm:order-1" : "sm:order-2"}>
                <Pulse className="mx-auto h-3 w-28 sm:mx-0" />
                <Pulse className="mx-auto mt-3 h-6 w-56 sm:mx-0" />
                <Pulse className="mx-auto mt-3 h-4 w-72 max-w-full sm:mx-0" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
