"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import {
  Brain,
  HardDrive,
  Calendar,
  Users,
  MessageCircle,
  CheckSquare,
  StickyNote,
  ChevronDown,
  Sparkles,
  Shield,
  Zap,
  Globe,
  ArrowRight,
  Play,
  FileText,
  Image,
  Video,
  FolderOpen,
  Share2,
  Bell,
  Search,
  Bot,
  TrendingUp,
  BarChart3,
  Phone,
  Mail,
  MapPin,
} from "lucide-react"
import { NeuralNetworkField } from "@/components/effects/neural-network-field"

gsap.registerPlugin(ScrollTrigger)

// Mock data for showcasing features
const mockFiles = [
  { name: "Q4 Marketing Report.pdf", type: "pdf", size: "2.4 MB", modified: "2 hours ago" },
  { name: "Brand Assets", type: "folder", items: 24, modified: "Yesterday" },
  { name: "Campaign Video.mp4", type: "video", size: "156 MB", modified: "3 days ago" },
  { name: "Team Photo.jpg", type: "image", size: "4.2 MB", modified: "1 week ago" },
  { name: "Product Roadmap.xlsx", type: "spreadsheet", size: "890 KB", modified: "2 weeks ago" },
]

const mockEvents = [
  { title: "Team Standup", time: "9:00 AM", duration: "30 min", color: "#00E5FF", attendees: 8 },
  { title: "Client Presentation", time: "11:00 AM", duration: "1 hour", color: "#FFB830", attendees: 4 },
  { title: "Product Review", time: "2:00 PM", duration: "45 min", color: "#10B981", attendees: 6 },
  { title: "1:1 with Sarah", time: "4:00 PM", duration: "30 min", color: "#8B5CF6", attendees: 2 },
]

const mockMessages = [
  { sender: "Maria Garcia", message: "The new designs look amazing!", time: "2 min ago", avatar: "MG" },
  { sender: "Alex Chen", message: "Meeting moved to 3pm", time: "15 min ago", avatar: "AC" },
  { sender: "Design Team", message: "Sarah: Updated the mockups", time: "1 hour ago", avatar: "DT", isGroup: true },
]

const mockTasks = [
  { title: "Review Q4 metrics", status: "done", priority: "high" },
  { title: "Prepare presentation slides", status: "in_progress", priority: "high" },
  { title: "Send client proposal", status: "todo", priority: "medium" },
  { title: "Update team documentation", status: "todo", priority: "low" },
]

const mockContacts = [
  { name: "Sarah Johnson", role: "Product Manager", email: "sarah@company.com", avatar: "SJ" },
  { name: "Michael Chen", role: "Lead Developer", email: "michael@company.com", avatar: "MC" },
  { name: "Emily Davis", role: "UX Designer", email: "emily@company.com", avatar: "ED" },
]

const features = [
  { icon: Brain, title: "AI-Powered", description: "Intelligent assistance across all modules" },
  { icon: Shield, title: "Enterprise Security", description: "Bank-level encryption and compliance" },
  { icon: Zap, title: "Lightning Fast", description: "Optimized for speed and performance" },
  { icon: Globe, title: "Work Anywhere", description: "Access from any device, anywhere" },
]

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const coreRef = useRef<HTMLDivElement>(null)
  const driveRef = useRef<HTMLDivElement>(null)
  const calendarRef = useRef<HTMLDivElement>(null)
  const contactsRef = useRef<HTMLDivElement>(null)
  const talkRef = useRef<HTMLDivElement>(null)
  const tasksRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero animations
      gsap.fromTo(
        ".hero-title",
        { opacity: 0, y: 100, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 1.5, ease: "power4.out" }
      )
      gsap.fromTo(
        ".hero-subtitle",
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 1, delay: 0.5, ease: "power3.out" }
      )
      gsap.fromTo(
        ".hero-cta",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, delay: 0.8, ease: "power2.out" }
      )
      gsap.fromTo(
        ".scroll-indicator",
        { opacity: 0 },
        { opacity: 1, duration: 1, delay: 1.5 }
      )

      // Scroll indicator bounce
      gsap.to(".scroll-indicator", {
        y: 10,
        duration: 1,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
      })

      // Features section
      gsap.fromTo(
        ".feature-card",
        { opacity: 0, y: 80, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: featuresRef.current,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse",
          },
        }
      )

      // The Core section - Pin and reveal
      ScrollTrigger.create({
        trigger: coreRef.current,
        start: "top top",
        end: "+=100%",
        pin: true,
        pinSpacing: true,
      })

      gsap.fromTo(
        ".core-title",
        { opacity: 0, x: -100 },
        {
          opacity: 1,
          x: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: coreRef.current,
            start: "top 60%",
            toggleActions: "play none none reverse",
          },
        }
      )

      gsap.fromTo(
        ".core-mockup",
        { opacity: 0, x: 100, scale: 0.8 },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: coreRef.current,
            start: "top 50%",
            toggleActions: "play none none reverse",
          },
        }
      )

      gsap.fromTo(
        ".core-feature",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: coreRef.current,
            start: "top 40%",
            toggleActions: "play none none reverse",
          },
        }
      )

      // Drive section
      ScrollTrigger.create({
        trigger: driveRef.current,
        start: "top top",
        end: "+=100%",
        pin: true,
        pinSpacing: true,
      })

      gsap.fromTo(
        ".drive-content",
        { opacity: 0, y: 100 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: driveRef.current,
            start: "top 60%",
            toggleActions: "play none none reverse",
          },
        }
      )

      gsap.fromTo(
        ".file-item",
        { opacity: 0, x: -50 },
        {
          opacity: 1,
          x: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: driveRef.current,
            start: "top 40%",
            toggleActions: "play none none reverse",
          },
        }
      )

      // Calendar section
      ScrollTrigger.create({
        trigger: calendarRef.current,
        start: "top top",
        end: "+=100%",
        pin: true,
        pinSpacing: true,
      })

      gsap.fromTo(
        ".calendar-content",
        { opacity: 0, scale: 0.9 },
        {
          opacity: 1,
          scale: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: calendarRef.current,
            start: "top 60%",
            toggleActions: "play none none reverse",
          },
        }
      )

      gsap.fromTo(
        ".event-item",
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: calendarRef.current,
            start: "top 40%",
            toggleActions: "play none none reverse",
          },
        }
      )

      // Contacts section
      ScrollTrigger.create({
        trigger: contactsRef.current,
        start: "top top",
        end: "+=100%",
        pin: true,
        pinSpacing: true,
      })

      gsap.fromTo(
        ".contacts-content",
        { opacity: 0, x: -100 },
        {
          opacity: 1,
          x: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: contactsRef.current,
            start: "top 60%",
            toggleActions: "play none none reverse",
          },
        }
      )

      gsap.fromTo(
        ".contact-card",
        { opacity: 0, scale: 0.8 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.5,
          stagger: 0.15,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: contactsRef.current,
            start: "top 40%",
            toggleActions: "play none none reverse",
          },
        }
      )

      // Talk section
      ScrollTrigger.create({
        trigger: talkRef.current,
        start: "top top",
        end: "+=100%",
        pin: true,
        pinSpacing: true,
      })

      gsap.fromTo(
        ".talk-content",
        { opacity: 0, y: 100 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: talkRef.current,
            start: "top 60%",
            toggleActions: "play none none reverse",
          },
        }
      )

      gsap.fromTo(
        ".message-item",
        { opacity: 0, x: 50 },
        {
          opacity: 1,
          x: 0,
          duration: 0.4,
          stagger: 0.15,
          ease: "power2.out",
          scrollTrigger: {
            trigger: talkRef.current,
            start: "top 40%",
            toggleActions: "play none none reverse",
          },
        }
      )

      // Tasks section
      ScrollTrigger.create({
        trigger: tasksRef.current,
        start: "top top",
        end: "+=100%",
        pin: true,
        pinSpacing: true,
      })

      gsap.fromTo(
        ".tasks-content",
        { opacity: 0, scale: 0.9 },
        {
          opacity: 1,
          scale: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: tasksRef.current,
            start: "top 60%",
            toggleActions: "play none none reverse",
          },
        }
      )

      gsap.fromTo(
        ".task-item",
        { opacity: 0, x: -30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.4,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: tasksRef.current,
            start: "top 40%",
            toggleActions: "play none none reverse",
          },
        }
      )

      // CTA section
      gsap.fromTo(
        ".cta-content",
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ctaRef.current,
            start: "top 70%",
            toggleActions: "play none none reverse",
          },
        }
      )
    })

    return () => ctx.revert()
  }, [])

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="h-5 w-5 text-red-400" />
      case "folder":
        return <FolderOpen className="h-5 w-5 text-[#FFB830]" />
      case "video":
        return <Video className="h-5 w-5 text-purple-400" />
      case "image":
        return <Image className="h-5 w-5 text-green-400" />
      case "spreadsheet":
        return <FileText className="h-5 w-5 text-emerald-400" />
      default:
        return <FileText className="h-5 w-5 text-gray-400" />
    }
  }

  return (
    <div className="relative">
      {/* Fixed Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0B0B0B]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#00E5FF] to-[#00E5FF]/50 flex items-center justify-center">
              <Brain className="h-5 w-5 text-[#0B0B0B]" />
            </div>
            <span className="text-xl font-bold text-white">KORE</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-[#A1A1AA] hover:text-white transition-colors">Features</a>
            <a href="#core" className="text-sm text-[#A1A1AA] hover:text-white transition-colors">The Core</a>
            <a href="#drive" className="text-sm text-[#A1A1AA] hover:text-white transition-colors">Drive</a>
            <a href="#calendar" className="text-sm text-[#A1A1AA] hover:text-white transition-colors">Calendar</a>
            <a href="#talk" className="text-sm text-[#A1A1AA] hover:text-white transition-colors">Talk</a>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-white hover:text-[#00E5FF] transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-[#00E5FF] text-[#0B0B0B] rounded-lg text-sm font-medium hover:bg-[#00E5FF]/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Neural Network Background */}
        <div className="absolute inset-0 z-0">
          <NeuralNetworkField particleCount={600} hubCount={18} />
        </div>

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0B0B] via-transparent to-[#0B0B0B] z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0B]/50 via-transparent to-[#0B0B0B]/50 z-10" />

        <div className="relative z-20 text-center px-6 max-w-5xl mx-auto">
          <h1 className="hero-title text-6xl md:text-8xl lg:text-9xl font-bold text-white mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-white via-[#00E5FF] to-white bg-clip-text text-transparent">
              KORE
            </span>
          </h1>
          <p className="hero-subtitle text-xl md:text-2xl lg:text-3xl text-[#A1A1AA] mb-8 max-w-3xl mx-auto leading-relaxed">
            The intelligent workspace that connects your team, amplifies productivity, and transforms how you work.
          </p>
          <div className="hero-cta flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="group px-8 py-4 bg-[#00E5FF] text-[#0B0B0B] rounded-xl text-lg font-semibold hover:bg-[#00E5FF]/90 transition-all hover:scale-105 flex items-center gap-2"
            >
              Start Free Trial
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="px-8 py-4 border border-white/20 text-white rounded-xl text-lg font-semibold hover:bg-white/5 transition-all flex items-center gap-2">
              <Play className="h-5 w-5" />
              Watch Demo
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="scroll-indicator absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
          <span className="text-xs text-[#A1A1AA] uppercase tracking-widest">Scroll to explore</span>
          <ChevronDown className="h-6 w-6 text-[#00E5FF]" />
        </div>
      </section>

      {/* Features Overview */}
      <section
        ref={featuresRef}
        id="features"
        className="py-32 px-6 relative"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Everything you need, unified
            </h2>
            <p className="text-lg text-[#A1A1AA] max-w-2xl mx-auto">
              One platform to manage files, schedule meetings, communicate with your team, and get AI-powered insights.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="feature-card group p-6 rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 hover:border-[#00E5FF]/30 transition-all hover:scale-105"
                >
                  <div className="h-14 w-14 rounded-xl bg-[#00E5FF]/10 flex items-center justify-center mb-4 group-hover:bg-[#00E5FF]/20 transition-colors">
                    <Icon className="h-7 w-7 text-[#00E5FF]" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-[#A1A1AA]">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* The Core Section */}
      <section
        ref={coreRef}
        id="core"
        className="min-h-screen flex items-center px-6 relative overflow-hidden"
      >
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#00E5FF]/10 rounded-full blur-[150px]" />

        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <div>
            <div className="core-title">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#00E5FF] to-[#00E5FF]/50 flex items-center justify-center">
                  <Brain className="h-6 w-6 text-[#0B0B0B]" />
                </div>
                <span className="text-[#00E5FF] font-semibold text-lg">THE CORE</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
                Your AI-Powered Command Center
              </h2>
              <p className="text-xl text-[#A1A1AA] mb-8">
                Ask anything. Get intelligent answers. The Core understands your data across all modules and provides actionable insights in seconds.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { icon: Sparkles, text: "Natural language queries across all your data" },
                { icon: TrendingUp, text: "AI-powered analytics and trend predictions" },
                { icon: Bot, text: "Automated workflows and smart suggestions" },
                { icon: BarChart3, text: "Real-time insights from your organization" },
              ].map((item, index) => {
                const Icon = item.icon
                return (
                  <div key={index} className="core-feature flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-[#00E5FF]" />
                    </div>
                    <span className="text-white">{item.text}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Core Mockup */}
          <div className="core-mockup">
            <div className="rounded-2xl bg-[#1F1F1F] border border-white/10 p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-[#00E5FF]/20 flex items-center justify-center">
                  <Brain className="h-5 w-5 text-[#00E5FF]" />
                </div>
                <div>
                  <p className="text-white font-medium">The Core</p>
                  <p className="text-xs text-[#A1A1AA]">AI Assistant</p>
                </div>
              </div>

              {/* Chat mockup */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-end">
                  <div className="bg-[#00E5FF] text-[#0B0B0B] rounded-2xl rounded-br-md px-4 py-2 max-w-[80%]">
                    <p className="text-sm">What were our top performing campaigns last quarter?</p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-[#2A2A2A] text-white rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%]">
                    <p className="text-sm mb-2">Based on your analytics data, here are your top 3 campaigns from Q3:</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <div className="h-2 w-2 rounded-full bg-[#00E5FF]" />
                        <span>Summer Sale - 245% ROI</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="h-2 w-2 rounded-full bg-[#FFB830]" />
                        <span>Product Launch - 189% ROI</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="h-2 w-2 rounded-full bg-[#10B981]" />
                        <span>Email Nurture - 156% ROI</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-[#2A2A2A] rounded-xl px-4 py-3">
                <input
                  type="text"
                  placeholder="Ask The Core anything..."
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-[#A1A1AA] outline-none"
                  disabled
                />
                <div className="h-8 w-8 rounded-lg bg-[#00E5FF] flex items-center justify-center">
                  <ArrowRight className="h-4 w-4 text-[#0B0B0B]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Drive Section */}
      <section
        ref={driveRef}
        id="drive"
        className="min-h-screen flex items-center px-6 relative overflow-hidden"
      >
        <div className="absolute top-1/2 right-0 w-[600px] h-[600px] bg-[#FFB830]/10 rounded-full blur-[150px]" />

        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center relative z-10">
          {/* Drive Mockup */}
          <div className="drive-content order-2 lg:order-1">
            <div className="rounded-2xl bg-[#1F1F1F] border border-white/10 overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <HardDrive className="h-5 w-5 text-[#FFB830]" />
                  <span className="text-white font-medium">KORE Drive</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center">
                    <Search className="h-4 w-4 text-[#A1A1AA]" />
                  </div>
                  <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center">
                    <Share2 className="h-4 w-4 text-[#A1A1AA]" />
                  </div>
                </div>
              </div>

              {/* File list */}
              <div className="p-4 space-y-2">
                {mockFiles.map((file, index) => (
                  <div
                    key={index}
                    className="file-item flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-[#A1A1AA]">
                        {file.type === "folder" ? `${file.items} items` : file.size} • {file.modified}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Storage indicator */}
              <div className="px-6 py-4 border-t border-white/10">
                <div className="flex items-center justify-between text-xs text-[#A1A1AA] mb-2">
                  <span>Storage used</span>
                  <span>24.5 GB of 100 GB</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full w-1/4 bg-gradient-to-r from-[#FFB830] to-[#00E5FF] rounded-full" />
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#FFB830] to-[#FFB830]/50 flex items-center justify-center">
                <HardDrive className="h-6 w-6 text-[#0B0B0B]" />
              </div>
              <span className="text-[#FFB830] font-semibold text-lg">KORE DRIVE</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              All Your Files, One Secure Place
            </h2>
            <p className="text-xl text-[#A1A1AA] mb-8">
              Store, share, and collaborate on files with enterprise-grade security. Access everything from anywhere, on any device.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: FolderOpen, text: "Smart organization" },
                { icon: Share2, text: "Secure sharing" },
                { icon: Search, text: "Instant search" },
                { icon: Shield, text: "End-to-end encryption" },
              ].map((item, index) => {
                const Icon = item.icon
                return (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                    <Icon className="h-5 w-5 text-[#FFB830]" />
                    <span className="text-white text-sm">{item.text}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Calendar Section */}
      <section
        ref={calendarRef}
        id="calendar"
        className="min-h-screen flex items-center px-6 relative overflow-hidden"
      >
        <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-[#10B981]/10 rounded-full blur-[150px]" />

        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#10B981] to-[#10B981]/50 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-[#0B0B0B]" />
              </div>
              <span className="text-[#10B981] font-semibold text-lg">KORE CALENDAR</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Master Your Time
            </h2>
            <p className="text-xl text-[#A1A1AA] mb-8">
              Schedule meetings, set reminders, and coordinate with your team effortlessly. Smart scheduling that respects everyone&apos;s time.
            </p>

            <div className="space-y-4">
              {[
                "Drag-and-drop scheduling",
                "Team availability at a glance",
                "Smart meeting suggestions",
                "Automatic timezone conversion",
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-[#10B981]" />
                  <span className="text-white">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Calendar Mockup */}
          <div className="calendar-content">
            <div className="rounded-2xl bg-[#1F1F1F] border border-white/10 overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-[#10B981]" />
                  <span className="text-white font-medium">December 2024</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#A1A1AA]">
                  <span>Week</span>
                  <span className="text-white bg-white/10 px-2 py-1 rounded">Day</span>
                  <span>Month</span>
                </div>
              </div>

              <div className="p-6">
                <div className="text-xs text-[#A1A1AA] mb-4">MONDAY, DEC 9</div>
                <div className="space-y-3">
                  {mockEvents.map((event, index) => (
                    <div
                      key={index}
                      className="event-item flex items-center gap-4 p-3 rounded-lg bg-white/5 border-l-4"
                      style={{ borderColor: event.color }}
                    >
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm">{event.title}</p>
                        <p className="text-xs text-[#A1A1AA]">
                          {event.time} • {event.duration}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="flex -space-x-2">
                          {Array.from({ length: Math.min(event.attendees, 3) }).map((_, i) => (
                            <div
                              key={i}
                              className="h-6 w-6 rounded-full bg-white/20 border-2 border-[#1F1F1F]"
                            />
                          ))}
                        </div>
                        {event.attendees > 3 && (
                          <span className="text-xs text-[#A1A1AA]">+{event.attendees - 3}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contacts Section */}
      <section
        ref={contactsRef}
        id="contacts"
        className="min-h-screen flex items-center px-6 relative overflow-hidden"
      >
        <div className="absolute top-1/2 right-0 w-[600px] h-[600px] bg-[#8B5CF6]/10 rounded-full blur-[150px]" />

        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center relative z-10">
          {/* Contacts Mockup */}
          <div className="contacts-content order-2 lg:order-1">
            <div className="rounded-2xl bg-[#1F1F1F] border border-white/10 overflow-hidden shadow-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <Users className="h-5 w-5 text-[#8B5CF6]" />
                <span className="text-white font-medium">KORE Contacts</span>
              </div>

              <div className="grid gap-4">
                {mockContacts.map((contact, index) => (
                  <div
                    key={index}
                    className="contact-card flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#00E5FF] flex items-center justify-center text-white font-semibold">
                      {contact.avatar}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{contact.name}</p>
                      <p className="text-sm text-[#A1A1AA]">{contact.role}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-[#00E5FF]/20 transition-colors">
                        <Mail className="h-4 w-4 text-[#A1A1AA]" />
                      </div>
                      <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-[#00E5FF]/20 transition-colors">
                        <Phone className="h-4 w-4 text-[#A1A1AA]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#8B5CF6]/50 flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <span className="text-[#8B5CF6] font-semibold text-lg">KORE CONTACTS</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Your Network, Organized
            </h2>
            <p className="text-xl text-[#A1A1AA] mb-8">
              Keep all your contacts in one place. Rich profiles, smart groups, and instant access to connect with anyone.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Users, text: "Smart groups" },
                { icon: Search, text: "Quick search" },
                { icon: Mail, text: "One-click contact" },
                { icon: MapPin, text: "Location info" },
              ].map((item, index) => {
                const Icon = item.icon
                return (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                    <Icon className="h-5 w-5 text-[#8B5CF6]" />
                    <span className="text-white text-sm">{item.text}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Talk Section */}
      <section
        ref={talkRef}
        id="talk"
        className="min-h-screen flex items-center px-6 relative overflow-hidden"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#EC4899]/10 rounded-full blur-[150px]" />

        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#EC4899] to-[#EC4899]/50 flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <span className="text-[#EC4899] font-semibold text-lg">KORE TALK</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Connect Instantly
            </h2>
            <p className="text-xl text-[#A1A1AA] mb-8">
              Real-time messaging, HD video calls, and seamless collaboration. Stay connected with your team wherever you are.
            </p>

            <div className="space-y-4">
              {[
                "Instant messaging with threads",
                "Crystal-clear video calls",
                "Screen sharing & recording",
                "File sharing in conversations",
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-[#EC4899]" />
                  <span className="text-white">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Talk Mockup */}
          <div className="talk-content">
            <div className="rounded-2xl bg-[#1F1F1F] border border-white/10 overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-[#EC4899]" />
                  <span className="text-white font-medium">Messages</span>
                </div>
                <div className="h-8 w-8 rounded-lg bg-[#EC4899] flex items-center justify-center">
                  <Bell className="h-4 w-4 text-white" />
                </div>
              </div>

              <div className="p-4 space-y-3">
                {mockMessages.map((msg, index) => (
                  <div
                    key={index}
                    className="message-item flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-medium ${msg.isGroup ? 'bg-gradient-to-br from-[#EC4899] to-[#8B5CF6]' : 'bg-gradient-to-br from-[#00E5FF] to-[#10B981]'}`}>
                      {msg.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium text-sm">{msg.sender}</p>
                        <span className="text-xs text-[#A1A1AA]">{msg.time}</span>
                      </div>
                      <p className="text-sm text-[#A1A1AA] truncate">{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Video call preview */}
              <div className="p-4 border-t border-white/10">
                <div className="rounded-xl bg-gradient-to-br from-[#EC4899]/20 to-[#8B5CF6]/20 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#EC4899] flex items-center justify-center animate-pulse">
                      <Phone className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Incoming call</p>
                      <p className="text-xs text-[#A1A1AA]">Design Team</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-[#10B981] flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                      <Phone className="h-5 w-5 text-white" />
                    </div>
                    <div className="h-10 w-10 rounded-full bg-red-500 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                      <Phone className="h-5 w-5 text-white rotate-[135deg]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tasks Section */}
      <section
        ref={tasksRef}
        id="tasks"
        className="min-h-screen flex items-center px-6 relative overflow-hidden"
      >
        <div className="absolute top-1/2 right-0 w-[600px] h-[600px] bg-[#F59E0B]/10 rounded-full blur-[150px]" />

        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-16 items-center relative z-10">
          {/* Tasks Mockup */}
          <div className="tasks-content order-2 lg:order-1">
            <div className="grid gap-6">
              {/* Tasks Card */}
              <div className="rounded-2xl bg-[#1F1F1F] border border-white/10 overflow-hidden shadow-2xl">
                <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3">
                  <CheckSquare className="h-5 w-5 text-[#F59E0B]" />
                  <span className="text-white font-medium">Tasks</span>
                </div>
                <div className="p-4 space-y-2">
                  {mockTasks.map((task, index) => (
                    <div
                      key={index}
                      className="task-item flex items-center gap-3 p-3 rounded-lg bg-white/5"
                    >
                      <div className={`h-5 w-5 rounded border-2 flex items-center justify-center ${task.status === 'done' ? 'bg-[#10B981] border-[#10B981]' : 'border-white/30'}`}>
                        {task.status === 'done' && (
                          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className={`flex-1 text-sm ${task.status === 'done' ? 'text-[#A1A1AA] line-through' : 'text-white'}`}>
                        {task.title}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                        task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes Card */}
              <div className="rounded-2xl bg-[#1F1F1F] border border-white/10 overflow-hidden shadow-2xl">
                <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3">
                  <StickyNote className="h-5 w-5 text-[#F59E0B]" />
                  <span className="text-white font-medium">Quick Note</span>
                </div>
                <div className="p-4">
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-white text-sm mb-2 font-medium">Meeting Notes - Q4 Planning</p>
                    <p className="text-[#A1A1AA] text-sm">
                      Key takeaways from today&apos;s session:
                      <br />• Focus on user retention
                      <br />• Launch new features by Dec 15
                      <br />• Schedule follow-up with marketing
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#F59E0B]/50 flex items-center justify-center">
                <CheckSquare className="h-6 w-6 text-[#0B0B0B]" />
              </div>
              <span className="text-[#F59E0B] font-semibold text-lg">TASKS & NOTES</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Stay on Track
            </h2>
            <p className="text-xl text-[#A1A1AA] mb-8">
              Manage tasks with Kanban boards, capture ideas with rich notes, and never miss a deadline again.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: CheckSquare, text: "Kanban boards" },
                { icon: StickyNote, text: "Rich text notes" },
                { icon: Bell, text: "Due date alerts" },
                { icon: Users, text: "Team assignments" },
              ].map((item, index) => {
                const Icon = item.icon
                return (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                    <Icon className="h-5 w-5 text-[#F59E0B]" />
                    <span className="text-white text-sm">{item.text}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        ref={ctaRef}
        className="py-32 px-6 relative overflow-hidden"
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0B0B] via-[#00E5FF]/5 to-[#0B0B0B]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-[#00E5FF]/10 rounded-full blur-[200px]" />

        <div className="cta-content relative z-10 max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Ready to transform your workflow?
          </h2>
          <p className="text-xl text-[#A1A1AA] mb-10 max-w-2xl mx-auto">
            Join thousands of teams already using KORE to collaborate better, work smarter, and achieve more.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="group px-10 py-5 bg-[#00E5FF] text-[#0B0B0B] rounded-xl text-xl font-semibold hover:bg-[#00E5FF]/90 transition-all hover:scale-105 flex items-center gap-3"
            >
              Get Started Free
              <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="px-10 py-5 border border-white/20 text-white rounded-xl text-xl font-semibold hover:bg-white/5 transition-all"
            >
              Sign In
            </Link>
          </div>
          <p className="mt-6 text-sm text-[#A1A1AA]">
            No credit card required • Free 14-day trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#00E5FF] to-[#00E5FF]/50 flex items-center justify-center">
                <Brain className="h-5 w-5 text-[#0B0B0B]" />
              </div>
              <span className="text-xl font-bold text-white">KORE</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-[#A1A1AA]">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Security</a>
              <a href="#" className="hover:text-white transition-colors">Status</a>
            </div>
            <p className="text-sm text-[#A1A1AA]">
              © 2024 KORE. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
