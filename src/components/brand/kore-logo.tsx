"use client"

import { cn } from "@/lib/utils"
import { Brain } from "lucide-react"

interface KoreLogoProps {
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
  variant?: "full" | "icon"
  color?: "light" | "dark" | "primary" | "gradient"
}

export function KoreLogo({
  className,
  size = "md",
  variant = "full",
  color = "gradient",
}: KoreLogoProps) {
  const sizes = {
    sm: { icon: 28, iconInner: 14, text: "text-lg", gap: "gap-2" },
    md: { icon: 36, iconInner: 18, text: "text-xl", gap: "gap-2.5" },
    lg: { icon: 44, iconInner: 22, text: "text-2xl", gap: "gap-3" },
    xl: { icon: 56, iconInner: 28, text: "text-4xl", gap: "gap-4" },
  }

  const iconSize = sizes[size].icon
  const iconInnerSize = sizes[size].iconInner

  // New gradient icon style matching the landing page
  const GradientIcon = () => (
    <div
      className={cn(
        "rounded-xl flex items-center justify-center",
        "bg-gradient-to-br from-[#0046E2] to-[#0046E2]/50",
        "shadow-lg shadow-[#0046E2]/20",
        "group-hover:shadow-[#0046E2]/40 transition-all duration-300"
      )}
      style={{ width: iconSize, height: iconSize }}
    >
      <Brain
        className="text-[#0f1a4a]"
        style={{ width: iconInnerSize, height: iconInnerSize }}
      />
    </div>
  )

  // Legacy solid icon style
  const SolidIcon = () => {
    const colors = {
      light: "fill-white",
      dark: "fill-[#0f1a4a]",
      primary: "fill-[#0046E2]",
      gradient: "fill-[#0046E2]",
    }
    const strokeColor =
      color === "light" ? "#0f1a4a" : color === "dark" ? "#FFFFFF" : "#0f1a4a"

    return (
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("shrink-0", colors[color])}
      >
        <circle cx="24" cy="24" r="22" fill="currentColor" />
        <path d="M18 12L18 36" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
        <path d="M18 24L30 12" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
        <path d="M18 24L30 36" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
        <circle cx="24" cy="24" r="3" fill={strokeColor} />
      </svg>
    )
  }

  const textColors = {
    light: "text-white",
    dark: "text-[#0f1a4a]",
    primary: "text-[#0046E2]",
    gradient: "bg-gradient-to-r from-white to-[#0046E2] bg-clip-text text-transparent",
  }

  if (variant === "icon") {
    return (
      <div className={cn("inline-flex items-center group", className)}>
        {color === "gradient" ? <GradientIcon /> : <SolidIcon />}
      </div>
    )
  }

  return (
    <div className={cn("inline-flex items-center group", sizes[size].gap, className)}>
      {color === "gradient" ? <GradientIcon /> : <SolidIcon />}
      <span
        className={cn(
          "font-bold tracking-[0.15em] uppercase",
          sizes[size].text,
          textColors[color]
        )}
        style={{ fontFamily: "var(--font-monument), var(--font-inter), sans-serif" }}
      >
        KORE
      </span>
    </div>
  )
}

// Alternative isotipo with more abstract design
export function KoreIsotipo({
  className,
  size = 32,
  color = "light",
}: {
  className?: string
  size?: number
  color?: "light" | "dark" | "primary"
}) {
  const fillColor = color === "light" ? "#FFFFFF" : color === "dark" ? "#0f1a4a" : "#0046E2"
  const cutColor = color === "light" ? "#0f1a4a" : color === "dark" ? "#FFFFFF" : "#0f1a4a"

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Main circle - the core */}
      <circle cx="24" cy="24" r="22" fill={fillColor} />
      {/* Geometric incision forming abstract K */}
      <path
        d="M16 14V34M16 24L28 14M16 24L28 34"
        stroke={cutColor}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Central nucleus point */}
      <circle cx="22" cy="24" r="2.5" fill={cutColor} />
    </svg>
  )
}
