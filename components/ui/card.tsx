export function Card({ children, className = "", as: Tag = "div" }: { children: React.ReactNode; className?: string; as?: "div" | "section" | "article" | "li" }) {
  return <Tag className={`rounded-[8px] border border-line bg-surface p-5 ${className}`}>{children}</Tag>;
}
