"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {}

function Avatar({ className, ...props }: AvatarProps) {
  return (
    <div
      className={cn(
        "relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  )
}

interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  onLoadingStatusChange?: (status: "loading" | "loaded" | "error") => void
}

function AvatarImage({ className, src, alt, onLoadingStatusChange, ...props }: AvatarImageProps) {
  const [status, setStatus] = React.useState<"loading" | "loaded" | "error">("loading")

  React.useEffect(() => {
    if (!src || typeof src !== "string") {
      setStatus("error")
      return
    }

    const img = new Image()
    img.src = src as string
    img.onload = () => {
      setStatus("loaded")
      onLoadingStatusChange?.("loaded")
    }
    img.onerror = () => {
      setStatus("error")
      onLoadingStatusChange?.("error")
    }
  }, [src, onLoadingStatusChange])

  if (status !== "loaded") {
    return null
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn("aspect-square h-full w-full object-cover", className)}
      {...props}
    />
  )
}

interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {
  delayMs?: number
}

function AvatarFallback({ className, children, delayMs = 0, ...props }: AvatarFallbackProps) {
  const [show, setShow] = React.useState(delayMs === 0)

  React.useEffect(() => {
    if (delayMs > 0) {
      const timer = setTimeout(() => setShow(true), delayMs)
      return () => clearTimeout(timer)
    }
  }, [delayMs])

  if (!show) return null

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-muted",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { Avatar, AvatarImage, AvatarFallback }
