import { cn } from "@/lib/utils";

type Message = {
  id: string;
  body: string;
  fromStaff: boolean;
  createdAt: Date;
  author: { name: string | null; email: string } | null;
};

const when = (d: Date) => d.toISOString().slice(0, 16).replace("T", " ");

/**
 * A request's messages, oldest first. Couples see the team as "Vowly support";
 * staff see who on the team wrote each reply.
 */
export function SupportThread({ messages, viewer }: { messages: Message[]; viewer: "couple" | "staff" }) {
  return (
    <ol className="flex flex-col gap-3">
      {messages.map((m) => {
        const who = m.fromStaff
          ? viewer === "staff"
            ? `${m.author?.name ?? m.author?.email ?? "Former staff"} (Vowly)`
            : "Vowly support"
          : viewer === "couple"
            ? "You"
            : (m.author?.name ?? m.author?.email ?? "Couple");
        return (
          <li
            key={m.id}
            className={cn("rounded-[6px] border p-4", m.fromStaff ? "border-emerald/25 bg-emerald/5" : "border-border bg-card")}
          >
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.body}</p>
            <p className="mt-2 text-xs text-ink/55">
              {who} · {when(m.createdAt)}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
