"use client"

import { cn } from "@/lib/utils"

interface KoreLogoProps {
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
  variant?: "full" | "icon"
  color?: "light" | "dark" | "primary"
}

export function KoreLogo({
  className,
  size = "md",
  variant = "full",
  color = "light",
}: KoreLogoProps) {
  const sizes = {
    sm: { icon: 24, text: "text-lg" },
    md: { icon: 32, text: "text-xl" },
    lg: { icon: 40, text: "text-2xl" },
    xl: { icon: 56, text: "text-4xl" },
  }

  const colors = {
    light: "fill-white text-white",
    dark: "fill-[#0B0B0B] text-[#0B0B0B]",
    primary: "fill-[#00E5FF] text-[#00E5FF]",
  }

  const iconSize = sizes[size].icon

  // Isotipo: Circle with geometric K cutout representing a core/nucleus
  const Isotipo = () => (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", colors[color].split(" ")[0])}
    >
      {/* Outer circle */}
      <circle cx="24" cy="24" r="22" fill="currentColor" />
      {/* Inner geometric K cut - representing the core/nucleus */}
      <path
        d="M18 12L18 36"
        stroke={color === "light" ? "#0B0B0B" : color === "dark" ? "#FFFFFF" : "#0B0B0B"}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M18 24L30 12"
        stroke={color === "light" ? "#0B0B0B" : color === "dark" ? "#FFFFFF" : "#0B0B0B"}
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M18 24L30 36"
        stroke={color === "light" ? "#0B0B0B" : color === "dark" ? "#FFFFFF" : "#0B0B0B"}
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Central light point */}
      <circle
        cx="24"
        cy="24"
        r="3"
        fill={color === "light" ? "#0B0B0B" : color === "dark" ? "#FFFFFF" : "#0B0B0B"}
      />
    </svg>
  )

  if (variant === "icon") {
    return (
      <div className={cn("inline-flex items-center", className)}>
        <Isotipo />
      </div>
    )
  }

  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <Isotipo />
      <span
        className={cn(
          "font-bold tracking-[0.2em] uppercase",
          sizes[size].text,
          colors[color].split(" ")[1]
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
  const fillColor = color === "light" ? "#FFFFFF" : color === "dark" ? "#0B0B0B" : "#00E5FF"
  const cutColor = color === "light" ? "#0B0B0B" : color === "dark" ? "#FFFFFF" : "#0B0B0B"

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
