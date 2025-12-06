"use client"

import * as React from "react"
import { motion, type HTMLMotionProps } from "motion/react"
import { cn } from "@/lib/utils"

export interface InputProps extends Omit<HTMLMotionProps<"input">, "ref"> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <motion.input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-border/50 bg-secondary/50 px-3 py-2 text-sm transition-all duration-200",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "placeholder:text-muted-foreground",
          "hover:border-border",
          "focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:bg-secondary",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        whileFocus={{ scale: 1.005 }}
        transition={{ duration: 0.15 }}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
