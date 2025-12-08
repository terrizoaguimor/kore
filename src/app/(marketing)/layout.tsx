"use client"

import { useEffect } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

gsap.registerPlugin(ScrollTrigger)

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // Refresh ScrollTrigger on route changes
    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      {children}
    </div>
  )
}
