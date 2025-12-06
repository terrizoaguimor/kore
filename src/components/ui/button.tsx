"use client"

import * as React from "react"
import { motion, type HTMLMotionProps } from "motion/react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(0,229,255,0.3)]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-[0_0_20px_rgba(255,71,87,0.3)]",
        outline: "border border-border bg-transparent hover:bg-secondary hover:border-primary/50 hover:text-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-secondary hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        glow: "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(0,229,255,0.4)] hover:shadow-[0_0_30px_rgba(0,229,255,0.6)]",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 text-xs",
        lg: "h-11 rounded-md px-6 has-[>svg]:px-4 text-base",
        icon: "size-9",
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

export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "ref">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    // If asChild, render children directly with props
    if (asChild && React.isValidElement(children)) {
      const childElement = children as React.ReactElement<{ className?: string }>
      return React.cloneElement(childElement, {
        className: cn(buttonVariants({ variant, size }), className, childElement.props.className),
        ...props,
      })
    }

    return (
      <motion.button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        whileTap={{ scale: 0.97 }}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        {...props}
      >
        {children}
      </motion.button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
