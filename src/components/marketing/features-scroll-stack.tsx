"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import {
  Brain,
  HardDrive,
  Calendar,
  Users,
  MessageCircle,
  CheckSquare,
  Shield,
  Zap,
  Globe,
  Phone,
  Video,
  Bot,
} from "lucide-react"
import { cn } from "@/lib/utils"

gsap.registerPlugin(ScrollTrigger)

const featureCards = [
  {
    id: "core",
    icon: Brain,
    title: "The Core",
    subtitle: "AI-Powered Intelligence",
    description: "Your AI command center that understands your data across all modules. Ask anything, get intelligent answers instantly.",
    color: "#00E5FF",
    gradient: "from-[#00E5FF] to-[#0EA5E9]",
    features: ["Natural language queries", "Smart analytics", "Automated workflows", "Predictive insights"],
  },
  {
    id: "drive",
    icon: HardDrive,
    title: "KORE Drive",
    subtitle: "Secure Cloud Storage",
    description: "All your files in one secure place. Store, share, and collaborate with enterprise-grade encryption.",
    color: "#FFB830",
    gradient: "from-[#FFB830] to-[#F59E0B]",
    features: ["Smart organization", "Version history", "Real-time sync", "Advanced search"],
  },
  {
    id: "calendar",
    icon: Calendar,
    title: "KORE Calendar",
    subtitle: "Smart Scheduling",
    description: "Master your time with intelligent scheduling. Never miss a meeting, always find the perfect time.",
    color: "#10B981",
    gradient: "from-[#10B981] to-[#059669]",
    features: ["Drag-and-drop", "Team availability", "Smart suggestions", "Auto timezone"],
  },
  {
    id: "contacts",
    icon: Users,
    title: "KORE Contacts",
    subtitle: "Network Management",
    description: "Your professional network, perfectly organized. Rich profiles and instant access to connect.",
    color: "#8B5CF6",
    gradient: "from-[#8B5CF6] to-[#7C3AED]",
    features: ["Smart groups", "Quick search", "One-click contact", "Import/Export"],
  },
  {
    id: "talk",
    icon: MessageCircle,
    title: "KORE Talk",
    subtitle: "Unified Communications",
    description: "Real-time messaging, HD video calls, and seamless collaboration in one place.",
    color: "#EC4899",
    gradient: "from-[#EC4899] to-[#DB2777]",
    features: ["Instant messaging", "Video calls", "Screen sharing", "File sharing"],
  },
  {
    id: "tasks",
    icon: CheckSquare,
    title: "Tasks & Notes",
    subtitle: "Productivity Tools",
    description: "Kanban boards, rich notes, and team assignments. Stay organized, hit every deadline.",
    color: "#F59E0B",
    gradient: "from-[#F59E0B] to-[#D97706]",
    features: ["Kanban boards", "Rich text notes", "Due date alerts", "Team assignments"],
  },
]

const highlights = [
  { icon: Shield, text: "Enterprise Security", color: "#10B981" },
  { icon: Zap, text: "Lightning Fast", color: "#FFB830" },
  { icon: Globe, text: "Work Anywhere", color: "#00E5FF" },
  { icon: Bot, text: "AI-Powered", color: "#8B5CF6" },
]

export function FeaturesScrollStack() {
  const containerRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    const isMobile = window.innerWidth < 1024 || 'ontouchstart' in window

    if (isMobile) {
      // Mobile: Simple stagger animation without pinning
      gsap.fromTo(
        ".stack-card",
        { opacity: 0, y: 100 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 80%",
          },
        }
      )
      return
    }

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".stack-card")
      const totalCards = cards.length

      // Create the main scroll-driven animation
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: `+=${totalCards * 100}%`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      })

      cards.forEach((card, i) => {
        // Initial state
        gsap.set(card, {
          position: "absolute",
          top: "50%",
          left: "50%",
          xPercent: -50,
          yPercent: -50,
          zIndex: totalCards - i,
        })

        if (i === 0) {
          // First card starts visible
          gsap.set(card, { opacity: 1, scale: 1, y: 0 })
        } else {
          // Other cards start below and scaled down
          gsap.set(card, { opacity: 0, scale: 0.8, y: 200 })
        }

        // Animate each card
        if (i < totalCards - 1) {
          // Move current card up and fade out
          tl.to(
            card,
            {
              y: -150,
              scale: 0.85,
              opacity: 0.3,
              duration: 1,
              ease: "power2.inOut",
            },
            i
          )

          // Bring next card in
          tl.to(
            cards[i + 1],
            {
              y: 0,
              scale: 1,
              opacity: 1,
              duration: 1,
              ease: "power2.out",
            },
            i
          )
        }
      })

      // Animate progress indicators
      cards.forEach((_, i) => {
        ScrollTrigger.create({
          trigger: containerRef.current,
          start: `${(i / totalCards) * 100}% top`,
          end: `${((i + 1) / totalCards) * 100}% top`,
          onEnter: () => {
            gsap.to(`.progress-dot-${i}`, {
              scale: 1.5,
              backgroundColor: featureCards[i].color,
              duration: 0.3,
            })
          },
          onLeave: () => {
            if (i < totalCards - 1) {
              gsap.to(`.progress-dot-${i}`, {
                scale: 1,
                backgroundColor: "rgba(255,255,255,0.2)",
                duration: 0.3,
              })
            }
          },
          onEnterBack: () => {
            gsap.to(`.progress-dot-${i}`, {
              scale: 1.5,
              backgroundColor: featureCards[i].color,
              duration: 0.3,
            })
          },
          onLeaveBack: () => {
            if (i > 0) {
              gsap.to(`.progress-dot-${i}`, {
                scale: 1,
                backgroundColor: "rgba(255,255,255,0.2)",
                duration: 0.3,
              })
            }
          },
        })
      })
    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen bg-[#0B0B0B] overflow-hidden"
    >
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#00E5FF]/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#8B5CF6]/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      {/* Section header - Fixed at top */}
      <div className="absolute top-0 left-0 right-0 z-20 pt-24 pb-8 bg-gradient-to-b from-[#0B0B0B] via-[#0B0B0B]/90 to-transparent">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            Everything you need,{" "}
            <span className="bg-gradient-to-r from-[#00E5FF] via-[#8B5CF6] to-[#FFB830] bg-clip-text text-transparent">
              unified
            </span>
          </h2>
          <p className="text-lg text-[#A1A1AA] max-w-2xl mx-auto">
            Six powerful modules working together seamlessly
          </p>
        </div>
      </div>

      {/* Progress indicator - Fixed on left side */}
      <div className="hidden lg:flex absolute left-8 top-1/2 -translate-y-1/2 z-30 flex-col items-center gap-4">
        {featureCards.map((card, i) => (
          <div
            key={card.id}
            className={cn(
              `progress-dot-${i}`,
              "w-3 h-3 rounded-full bg-white/20 transition-all duration-300 cursor-pointer hover:scale-125"
            )}
            style={{ backgroundColor: i === 0 ? card.color : undefined }}
          />
        ))}
      </div>

      {/* Cards container */}
      <div className="relative w-full h-screen flex items-center justify-center">
        {featureCards.map((card, index) => {
          const Icon = card.icon
          return (
            <div
              key={card.id}
              ref={(el) => {
                if (el) cardsRef.current[index] = el
              }}
              className="stack-card w-full max-w-5xl mx-auto px-6"
            >
              <div className="relative">
                {/* Glow effect */}
                <div
                  className="absolute -inset-4 rounded-3xl blur-2xl opacity-30"
                  style={{ backgroundColor: card.color }}
                />

                {/* Card content */}
                <div className="relative rounded-3xl bg-[#1A1A1A]/90 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl">
                  <div className="grid lg:grid-cols-2 gap-0">
                    {/* Left side - Info */}
                    <div className="p-8 lg:p-12 flex flex-col justify-center">
                      <div className="flex items-center gap-4 mb-6">
                        <div
                          className={cn(
                            "h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br",
                            card.gradient
                          )}
                          style={{ boxShadow: `0 10px 40px ${card.color}40` }}
                        >
                          <Icon className="h-7 w-7 text-white" />
                        </div>
                        <div>
                          <span
                            className="text-sm font-semibold uppercase tracking-wider"
                            style={{ color: card.color }}
                          >
                            {card.subtitle}
                          </span>
                          <h3 className="text-3xl lg:text-4xl font-bold text-white">
                            {card.title}
                          </h3>
                        </div>
                      </div>

                      <p className="text-lg text-[#A1A1AA] mb-8 leading-relaxed">
                        {card.description}
                      </p>

                      <div className="grid grid-cols-2 gap-3">
                        {card.features.map((feature, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group cursor-pointer"
                          >
                            <div
                              className="w-2 h-2 rounded-full group-hover:scale-150 transition-transform"
                              style={{ backgroundColor: card.color }}
                            />
                            <span className="text-sm text-white">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right side - Visual */}
                    <div
                      className="relative min-h-[300px] lg:min-h-[500px] flex items-center justify-center p-8"
                      style={{
                        background: `linear-gradient(135deg, ${card.color}10 0%, transparent 50%, ${card.color}05 100%)`,
                      }}
                    >
                      {/* Decorative circles */}
                      <div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full opacity-20 animate-pulse"
                        style={{ border: `2px solid ${card.color}` }}
                      />
                      <div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full opacity-30 animate-pulse"
                        style={{ border: `2px solid ${card.color}`, animationDelay: "0.5s" }}
                      />

                      {/* Central icon */}
                      <div
                        className="relative z-10 h-32 w-32 rounded-3xl flex items-center justify-center shadow-2xl bg-gradient-to-br"
                        style={{
                          background: `linear-gradient(135deg, ${card.color}40, ${card.color}20)`,
                          boxShadow: `0 20px 60px ${card.color}30`,
                        }}
                      >
                        <Icon className="h-16 w-16 text-white" />
                      </div>

                      {/* Floating elements */}
                      <div
                        className="absolute top-1/4 right-1/4 h-12 w-12 rounded-xl flex items-center justify-center animate-bounce"
                        style={{ backgroundColor: `${card.color}20`, animationDuration: "3s" }}
                      >
                        <Shield className="h-6 w-6" style={{ color: card.color }} />
                      </div>
                      <div
                        className="absolute bottom-1/4 left-1/4 h-10 w-10 rounded-lg flex items-center justify-center animate-bounce"
                        style={{ backgroundColor: `${card.color}20`, animationDuration: "2.5s", animationDelay: "0.5s" }}
                      >
                        <Zap className="h-5 w-5" style={{ color: card.color }} />
                      </div>
                    </div>
                  </div>

                  {/* Bottom highlights bar */}
                  <div className="px-8 lg:px-12 py-6 bg-white/5 border-t border-white/10">
                    <div className="flex flex-wrap items-center justify-center gap-6">
                      {highlights.map((highlight, i) => {
                        const HIcon = highlight.icon
                        return (
                          <div key={i} className="flex items-center gap-2 text-sm text-[#A1A1AA]">
                            <HIcon className="h-4 w-4" style={{ color: highlight.color }} />
                            <span>{highlight.text}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Scroll hint at bottom */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 opacity-50">
        <span className="text-xs text-[#A1A1AA] uppercase tracking-widest">Scroll to explore</span>
        <div className="h-8 w-5 rounded-full border-2 border-white/30 flex items-start justify-center p-1">
          <div className="h-2 w-1 rounded-full bg-white/50 animate-bounce" />
        </div>
      </div>
    </section>
  )
}
