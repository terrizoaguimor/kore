import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-colors overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white hover:bg-destructive/90",
        outline:
          "text-foreground hover:bg-accent hover:text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  asChild?: boolean
}

function Badge({ className, variant, asChild = false, children, ...props }: BadgeProps) {
  if (asChild && React.isValidElement(children)) {
    const childElement = children as React.ReactElement<{ className?: string }>
    return React.cloneElement(childElement, {
      className: cn(badgeVariants({ variant }), className, childElement.props.className),
      ...props,
    })
  }

  return (
    <span
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    >
      {children}
    </span>
  )
}

export { Badge, badgeVariants }
