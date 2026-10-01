import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  // Vowly buttons are pills: gold for the main action, ink for the secondary one.
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-60 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-gold text-ink hover:bg-ink hover:text-paper",
        ink: "bg-ink text-paper hover:bg-emerald",
        destructive: "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20",
        outline: "border border-ink/25 bg-transparent font-medium hover:border-ink",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "font-medium hover:bg-mist",
        link: "rounded-none font-medium text-ink underline-offset-4 hover:underline",
      },
      size: {
        default: "px-5 py-2.5 text-sm",
        sm: "px-4 py-2 text-xs",
        xs: "gap-1 px-3 py-1.5 text-xs [&_svg:not([class*='size-'])]:size-3",
        lg: "px-6 py-2.5 text-sm",
        icon: "size-9",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
