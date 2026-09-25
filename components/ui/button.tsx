import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "text" | "danger" | "inverse";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-action text-action-ink hover:bg-ink hover:text-paper",
  secondary: "border border-ink/25 text-ink hover:border-ink",
  text: "text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink",
  danger: "bg-danger text-white hover:bg-danger/85",
  inverse: "bg-ink text-paper hover:bg-success",
};

const SIZES: Record<Size, string> = {
  sm: "min-h-9 px-3.5 text-[13px]",
  md: "min-h-10 px-5 text-sm",
  lg: "min-h-12 px-6 text-sm",
};

/** Class string for a button-styled element; use on <Link> and <a> too. */
export function buttonClass(variant: Variant = "primary", size: Size = "md") {
  const shape = variant === "text" ? "px-0 min-h-0" : `rounded-full ${SIZES[size]}`;
  return `inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink active:translate-y-px disabled:pointer-events-none disabled:opacity-55 motion-reduce:transition-none ${shape} ${VARIANTS[variant]}`;
}

export function Button({
  variant = "primary",
  size = "md",
  pending = false,
  pendingLabel,
  className = "",
  children,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; pending?: boolean; pendingLabel?: string }) {
  return (
    <button type={type} disabled={pending || props.disabled} className={`${buttonClass(variant, size)} ${className}`} {...props}>
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
