"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
  Eye,
  EyeOff,
  Loader2,
  Check,
  X,
  ChevronRight,
  Star,
  Rocket,
  Lock,
  Cloud,
} from "lucide-react"
import { NeuralNetworkField } from "@/components/effects/neural-network-field"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

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
  { title: "Team Standup", time: "9:00 AM", duration: "30 min", color: "#0046E2", attendees: 8 },
  { title: "Client Presentation", time: "11:00 AM", duration: "1 hour", color: "#FDFBE7", attendees: 4 },
  { title: "Product Review", time: "2:00 PM", duration: "45 min", color: "#10B981", attendees: 6 },
  { title: "1:1 with Sarah", time: "4:00 PM", duration: "30 min", color: "#1b2d7c", attendees: 2 },
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
  { icon: Brain, title: "AI-Powered", description: "Intelligent assistance across all modules", gradient: "from-[#0046E2] to-[#1A5AE8]" },
  { icon: Shield, title: "Enterprise Security", description: "Bank-level encryption and compliance", gradient: "from-[#10B981] to-[#059669]" },
  { icon: Zap, title: "Lightning Fast", description: "Optimized for speed and performance", gradient: "from-[#1b2d7c] to-[#0046E2]" },
  { icon: Globe, title: "Work Anywhere", description: "Access from any device, anywhere", gradient: "from-[#FDFBE7] to-[#0046E2]" },
]

const stats = [
  { value: "99.9%", label: "Uptime" },
  { value: "50K+", label: "Teams" },
  { value: "10M+", label: "Files Stored" },
  { value: "24/7", label: "Support" },
]

export default function LandingPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [activeSection, setActiveSection] = useState("hero")
  const [isMobile, setIsMobile] = useState(false)

  const heroRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const coreRef = useRef<HTMLDivElement>(null)
  const driveRef = useRef<HTMLDivElement>(null)
  const calendarRef = useRef<HTMLDivElement>(null)
  const contactsRef = useRef<HTMLDivElement>(null)
  const talkRef = useRef<HTMLDivElement>(null)
  const tasksRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024 || 'ontouchstart' in window)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError("Please fill in all fields")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        router.push("/core")
      }
    } catch {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Check if mobile for GSAP config
    const isMobileDevice = window.innerWidth < 1024 || 'ontouchstart' in window

    const ctx = gsap.context(() => {
      // Hero animations with more dramatic entrance
      const heroTl = gsap.timeline()

      heroTl
        .fromTo(
          ".hero-badge",
          { opacity: 0, y: -30, scale: 0.8 },
          { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "back.out(1.7)" }
        )
        .fromTo(
          ".hero-title",
          { opacity: 0, y: 100, scale: 0.8 },
          { opacity: 1, y: 0, scale: 1, duration: 1.2, ease: "power4.out" },
          "-=0.4"
        )
        .fromTo(
          ".hero-subtitle",
          { opacity: 0, y: 50 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" },
          "-=0.6"
        )
        .fromTo(
          ".hero-cta",
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" },
          "-=0.4"
        )
        .fromTo(
          ".hero-stats",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
          "-=0.2"
        )
        .fromTo(
          ".login-panel",
          { opacity: 0, x: 100, scale: 0.9 },
          { opacity: 1, x: 0, scale: 1, duration: 1, ease: "power3.out" },
          "-=0.8"
        )
        .fromTo(
          ".scroll-indicator",
          { opacity: 0 },
          { opacity: 1, duration: 0.8 }
        )

      // Scroll indicator bounce
      gsap.to(".scroll-indicator", {
        y: 10,
        duration: 1,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
      })

      // Floating animation for hero elements
      gsap.to(".float-element", {
        y: -15,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
        stagger: 0.3,
      })

      // Pulse animation for glowing elements
      gsap.to(".pulse-glow", {
        boxShadow: "0 0 60px rgba(0, 70, 226, 0.4)",
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
      })

      // Features section with stagger
      gsap.fromTo(
        ".feature-card",
        { opacity: 0, y: 80, scale: 0.9, rotateX: 15 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          rotateX: 0,
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

      // Stats counter animation
      gsap.fromTo(
        ".stat-item",
        { opacity: 0, scale: 0.5 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: ".stats-section",
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      )

      // The Core section - Pin and reveal (desktop only)
      if (!isMobileDevice) {
        ScrollTrigger.create({
          trigger: coreRef.current,
          start: "top top",
          end: "+=100%",
          pin: true,
          pinSpacing: true,
          onEnter: () => setActiveSection("core"),
        })
      }

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
        { opacity: 0, x: 100, scale: 0.8, rotateY: -15 },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          rotateY: 0,
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
        { opacity: 0, y: 30, x: -20 },
        {
          opacity: 1,
          y: 0,
          x: 0,
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

      // Drive section (desktop only pin)
      if (!isMobileDevice) {
        ScrollTrigger.create({
          trigger: driveRef.current,
          start: "top top",
          end: "+=100%",
          pin: true,
          pinSpacing: true,
          onEnter: () => setActiveSection("drive"),
        })
      }

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
        { opacity: 0, x: -50, rotateY: 10 },
        {
          opacity: 1,
          x: 0,
          rotateY: 0,
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

      // Calendar section (desktop only pin)
      if (!isMobileDevice) {
        ScrollTrigger.create({
          trigger: calendarRef.current,
          start: "top top",
          end: "+=100%",
          pin: true,
          pinSpacing: true,
          onEnter: () => setActiveSection("calendar"),
        })
      }

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
        { opacity: 0, y: 20, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
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

      // Contacts section (desktop only pin)
      if (!isMobileDevice) {
        ScrollTrigger.create({
          trigger: contactsRef.current,
          start: "top top",
          end: "+=100%",
          pin: true,
          pinSpacing: true,
          onEnter: () => setActiveSection("contacts"),
        })
      }

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
        { opacity: 0, scale: 0.8, rotateX: 20 },
        {
          opacity: 1,
          scale: 1,
          rotateX: 0,
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

      // Talk section (desktop only pin)
      if (!isMobileDevice) {
        ScrollTrigger.create({
          trigger: talkRef.current,
          start: "top top",
          end: "+=100%",
          pin: true,
          pinSpacing: true,
          onEnter: () => setActiveSection("talk"),
        })
      }

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
        { opacity: 0, x: 50, scale: 0.9 },
        {
          opacity: 1,
          x: 0,
          scale: 1,
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

      // Tasks section (desktop only pin)
      if (!isMobileDevice) {
        ScrollTrigger.create({
          trigger: tasksRef.current,
          start: "top top",
          end: "+=100%",
          pin: true,
          pinSpacing: true,
          onEnter: () => setActiveSection("tasks"),
        })
      }

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
        { opacity: 0, y: 50, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
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
        return <FolderOpen className="h-5 w-5 text-[#FDFBE7]" />
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
    <div className="relative min-h-screen bg-[#0f1a4a]">
      {/* Fixed Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f1a4a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-[#0046E2] to-[#0046E2]/50 flex items-center justify-center shadow-lg shadow-[#0046E2]/20">
              <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-bold font-[family-name:var(--font-montserrat)] bg-gradient-to-r from-white to-[#0046E2] bg-clip-text text-transparent">KORE</span>
              <span className="text-[8px] sm:text-[10px] text-[#FDFBE7]/70 -mt-1 tracking-wider">BY SOCIOS</span>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-6 xl:gap-8">
            {[
              { id: "features", label: "Features" },
              { id: "core", label: "The Core" },
              { id: "drive", label: "Drive" },
              { id: "calendar", label: "Calendar" },
              { id: "talk", label: "Talk" },
            ].map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={cn(
                  "text-sm transition-all duration-300 relative group",
                  activeSection === item.id ? "text-[#0046E2]" : "text-[#A1A1AA] hover:text-white"
                )}
              >
                {item.label}
                <span className={cn(
                  "absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-[#0046E2] to-[#FDFBE7] transition-all duration-300",
                  activeSection === item.id ? "w-full" : "w-0 group-hover:w-full"
                )} />
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <a
              href="#login"
              className="hidden sm:block text-sm text-white hover:text-[#0046E2] transition-colors"
            >
              Sign In
            </a>
            <Link
              href="/register"
              className="px-3 sm:px-4 py-2 bg-[#FDFBE7] text-[#0f1a4a] rounded-lg text-sm font-semibold hover:bg-[#F5F3D9] hover:shadow-lg hover:shadow-[#FDFBE7]/30 transition-all hover:scale-105"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        ref={heroRef}
        id="hero"
        className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 sm:pt-20"
      >
        {/* Neural Network Background - More particles */}
        <div className="absolute inset-0 z-0">
          <NeuralNetworkField particleCount={isMobile ? 200 : 800} hubCount={isMobile ? 8 : 20} />
        </div>

        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-[#0046E2]/20 rounded-full blur-[100px] sm:blur-[150px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-[#FDFBE7]/15 rounded-full blur-[100px] sm:blur-[120px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-[#1b2d7c]/30 rounded-full blur-[120px] sm:blur-[180px] animate-pulse" style={{ animationDelay: "2s" }} />

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f1a4a] via-transparent to-[#0f1a4a] z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f1a4a]/60 via-transparent to-[#0f1a4a]/60 z-10" />

        <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left side - Hero content */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <div className="hero-badge inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-[#0046E2]/10 to-[#FDFBE7]/10 border border-[#0046E2]/20 mb-4 sm:mb-6">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-[#FDFBE7]" />
                <span className="text-xs sm:text-sm text-white">Introducing KORE By Socios</span>
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-[#0046E2]" />
              </div>

              <h1 className="hero-title text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-[family-name:var(--font-montserrat)] text-white mb-4 sm:mb-6 tracking-tight leading-tight">
                <span className="bg-gradient-to-r from-white via-[#0046E2] to-white bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                  The Origin of
                </span>
                <br />
                <span className="bg-gradient-to-r from-[#FDFBE7] via-[#0046E2] to-[#1b2d7c] bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                  Everything
                </span>
              </h1>

              <p className="hero-subtitle text-base sm:text-lg md:text-xl text-[#A1A1AA] mb-6 sm:mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                One intelligent platform to manage files, schedule meetings, communicate with your team, and unlock AI-powered insights.
              </p>

              <div className="hero-cta flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 mb-8 sm:mb-12">
                <Link
                  href="/register"
                  className="group w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-[#FDFBE7] text-[#0f1a4a] rounded-xl text-base sm:text-lg font-bold hover:bg-[#F5F3D9] hover:shadow-xl hover:shadow-[#FDFBE7]/30 transition-all hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Rocket className="h-4 w-4 sm:h-5 sm:w-5" />
                  Start Free Trial
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="group w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 border border-white/20 text-white rounded-xl text-base sm:text-lg font-semibold hover:bg-white/5 hover:border-[#FDFBE7]/50 transition-all flex items-center justify-center gap-2">
                  <Play className="h-4 w-4 sm:h-5 sm:w-5 group-hover:text-[#FDFBE7] transition-colors" />
                  Watch Demo
                </button>
              </div>

              {/* Stats */}
              <div className="hero-stats grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center lg:text-left">
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#0046E2] to-[#FDFBE7] bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <div className="text-xs sm:text-sm text-[#A1A1AA]">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right side - Login Panel */}
            <div id="login" className="login-panel w-full max-w-md mx-auto lg:ml-auto">
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-[#0046E2] via-[#1b2d7c] to-[#FDFBE7] rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />

                <div className="relative rounded-2xl bg-[#0f1a4a]/90 backdrop-blur-xl border border-white/10 p-6 sm:p-8 shadow-2xl">
                  <div className="text-center mb-6">
                    <div className="float-element inline-flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0046E2]/20 to-[#0046E2]/5 mb-4 pulse-glow">
                      <Lock className="h-6 w-6 sm:h-7 sm:w-7 text-[#0046E2]" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold font-[family-name:var(--font-montserrat)] text-white mb-2">Welcome Back</h2>
                    <p className="text-sm text-[#A1A1AA]">Sign in to access your workspace</p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    {error && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                        <X className="h-4 w-4 flex-shrink-0" />
                        {error}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-[#A1A1AA] mb-2">Email</label>
                      <div className="relative group">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A1A1AA] group-focus-within:text-[#0046E2] transition-colors" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#0046E2]/50 focus:ring-2 focus:ring-[#0046E2]/20 transition-all"
                          placeholder="you@company.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#A1A1AA] mb-2">Password</label>
                      <div className="relative group">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A1A1AA] group-focus-within:text-[#0046E2] transition-colors" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#0046E2]/50 focus:ring-2 focus:ring-[#0046E2]/20 transition-all"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="h-5 w-5 rounded border border-white/20 bg-white/5 flex items-center justify-center peer-checked:bg-[#0046E2] peer-checked:border-[#0046E2] transition-all group-hover:border-[#0046E2]/50">
                          <Check className="h-3 w-3 text-white opacity-0 peer-checked:opacity-100" />
                        </div>
                        <span className="text-sm text-[#A1A1AA]">Remember me</span>
                      </label>
                      <Link href="/forgot-password" className="text-sm text-[#0046E2] hover:underline">
                        Forgot password?
                      </Link>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 bg-[#FDFBE7] text-[#0f1a4a] rounded-xl font-bold hover:bg-[#F5F3D9] hover:shadow-lg hover:shadow-[#FDFBE7]/30 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          Sign In
                          <ArrowRight className="h-5 w-5" />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="mt-6 text-center">
                    <p className="text-sm text-[#A1A1AA]">
                      Don&apos;t have an account?{" "}
                      <Link href="/register" className="text-[#0046E2] hover:underline font-medium">
                        Create one free
                      </Link>
                    </p>
                  </div>

                  {/* Trust badges */}
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <div className="flex items-center justify-center gap-4 text-[#A1A1AA]">
                      <div className="flex items-center gap-1.5">
                        <Shield className="h-4 w-4 text-[#10B981]" />
                        <span className="text-xs">Secure</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Cloud className="h-4 w-4 text-[#0046E2]" />
                        <span className="text-xs">Cloud-based</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Star className="h-4 w-4 text-[#FDFBE7]" />
                        <span className="text-xs">5-star rated</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="scroll-indicator absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
          <span className="text-[10px] sm:text-xs text-[#A1A1AA] uppercase tracking-widest">Scroll to explore</span>
          <div className="h-10 sm:h-12 w-6 sm:w-7 rounded-full border-2 border-[#0046E2]/30 flex items-start justify-center p-1.5">
            <div className="h-2 w-2 rounded-full bg-[#0046E2] animate-bounce" />
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section
        ref={featuresRef}
        id="features"
        className="py-20 sm:py-32 px-4 sm:px-6 relative overflow-hidden"
      >
        {/* Background elements */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#0046E2]/50 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#FDFBE7]/50 to-transparent" />

        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0046E2]/10 border border-[#0046E2]/20 mb-4">
              <Sparkles className="h-4 w-4 text-[#0046E2]" />
              <span className="text-sm text-[#0046E2]">Why Choose KORE</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Everything you need, <span className="bg-gradient-to-r from-[#0046E2] to-[#FDFBE7] bg-clip-text text-transparent">unified</span>
            </h2>
            <p className="text-base sm:text-lg text-[#A1A1AA] max-w-2xl mx-auto">
              One platform to manage files, schedule meetings, communicate with your team, and get AI-powered insights.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="feature-card group p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 hover:border-[#0046E2]/30 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-[#0046E2]/10 cursor-pointer"
                >
                  <div className={cn(
                    "h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg",
                    feature.gradient
                  )}>
                    <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 group-hover:text-[#0046E2] transition-colors">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-[#A1A1AA]">{feature.description}</p>
                </div>
              )
            })}
          </div>

          {/* Stats Section */}
          <div className="stats-section mt-16 sm:mt-24 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item text-center p-4 sm:p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-[#0046E2]/30 transition-all hover:scale-105">
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#0046E2] to-[#FDFBE7] bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm sm:text-base text-[#A1A1AA]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Core Section */}
      <section
        ref={coreRef}
        id="core"
        className="min-h-screen flex items-center px-4 sm:px-6 relative overflow-hidden"
      >
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[800px] h-[400px] sm:h-[800px] bg-[#0046E2]/10 rounded-full blur-[100px] sm:blur-[150px]" />

        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-8 lg:gap-16 items-center relative z-10">
          <div className="order-2 lg:order-1">
            <div className="core-title">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-[#0046E2] to-[#1A5AE8] flex items-center justify-center shadow-lg shadow-[#0046E2]/30">
                  <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-[#0f1a4a]" />
                </div>
                <span className="text-[#0046E2] font-semibold text-base sm:text-lg">THE CORE</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6">
                Your <span className="bg-gradient-to-r from-[#0046E2] to-[#1b2d7c] bg-clip-text text-transparent">AI-Powered</span> Command Center
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-[#A1A1AA] mb-6 sm:mb-8">
                Ask anything. Get intelligent answers. The Core understands your data across all modules and provides actionable insights in seconds.
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {[
                { icon: Sparkles, text: "Natural language queries across all your data" },
                { icon: TrendingUp, text: "AI-powered analytics and trend predictions" },
                { icon: Bot, text: "Automated workflows and smart suggestions" },
                { icon: BarChart3, text: "Real-time insights from your organization" },
              ].map((item, index) => {
                const Icon = item.icon
                return (
                  <div key={index} className="core-feature flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#0046E2]/30 hover:bg-white/10 transition-all group cursor-pointer">
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-gradient-to-br from-[#0046E2]/20 to-transparent flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-[#0046E2]" />
                    </div>
                    <span className="text-sm sm:text-base text-white">{item.text}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Core Mockup */}
          <div className="core-mockup order-1 lg:order-2">
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-[#0046E2]/30 via-[#1b2d7c]/20 to-[#FDFBE7]/30 rounded-2xl blur-xl opacity-50" />
              <div className="relative rounded-2xl bg-[#1b2d7c] border border-white/10 p-4 sm:p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-[#0046E2]/20 flex items-center justify-center">
                    <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-[#0046E2]" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm sm:text-base">The Core</p>
                    <p className="text-[10px] sm:text-xs text-[#A1A1AA]">AI Assistant</p>
                  </div>
                </div>

                {/* Chat mockup */}
                <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                  <div className="flex justify-end">
                    <div className="bg-gradient-to-r from-[#0046E2] to-[#1A5AE8] text-[#0f1a4a] rounded-2xl rounded-br-md px-3 sm:px-4 py-2 max-w-[85%]">
                      <p className="text-xs sm:text-sm">What were our top performing campaigns last quarter?</p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-[#243178] text-white rounded-2xl rounded-bl-md px-3 sm:px-4 py-3 max-w-[90%]">
                      <p className="text-xs sm:text-sm mb-2">Based on your analytics data, here are your top 3 campaigns from Q3:</p>
                      <div className="space-y-2">
                        {[
                          { color: "#0046E2", text: "Summer Sale - 245% ROI" },
                          { color: "#FDFBE7", text: "Product Launch - 189% ROI" },
                          { color: "#10B981", text: "Email Nurture - 156% ROI" },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center gap-2 text-[10px] sm:text-xs group cursor-pointer hover:translate-x-1 transition-transform">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                            <span>{item.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 bg-[#243178] rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 group hover:ring-2 hover:ring-[#0046E2]/30 transition-all">
                  <input
                    type="text"
                    placeholder="Ask The Core anything..."
                    className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder:text-[#A1A1AA] outline-none"
                    disabled
                  />
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-gradient-to-r from-[#0046E2] to-[#1A5AE8] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-[#0f1a4a]" />
                  </div>
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
        className="min-h-screen flex items-center px-4 sm:px-6 relative overflow-hidden"
      >
        <div className="absolute top-1/2 right-0 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-[#FDFBE7]/10 rounded-full blur-[100px] sm:blur-[150px]" />

        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-8 lg:gap-16 items-center relative z-10">
          {/* Drive Mockup */}
          <div className="drive-content">
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-[#FDFBE7]/30 to-[#FDFBE7]/20 rounded-2xl blur-xl opacity-50" />
              <div className="relative rounded-2xl bg-[#1b2d7c] border border-white/10 overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <HardDrive className="h-4 w-4 sm:h-5 sm:w-5 text-[#FDFBE7]" />
                    <span className="text-white font-medium text-sm sm:text-base">KORE Drive</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer">
                      <Search className="h-3 w-3 sm:h-4 sm:w-4 text-[#A1A1AA]" />
                    </div>
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer">
                      <Share2 className="h-3 w-3 sm:h-4 sm:w-4 text-[#A1A1AA]" />
                    </div>
                  </div>
                </div>

                {/* File list */}
                <div className="p-3 sm:p-4 space-y-1 sm:space-y-2">
                  {mockFiles.map((file, index) => (
                    <div
                      key={index}
                      className="file-item flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-lg hover:bg-white/5 transition-all cursor-pointer group"
                    >
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                        {getFileIcon(file.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs sm:text-sm font-medium truncate group-hover:text-[#FDFBE7] transition-colors">{file.name}</p>
                        <p className="text-[10px] sm:text-xs text-[#A1A1AA]">
                          {file.type === "folder" ? `${file.items} items` : file.size} • {file.modified}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Storage indicator */}
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-white/10">
                  <div className="flex items-center justify-between text-[10px] sm:text-xs text-[#A1A1AA] mb-2">
                    <span>Storage used</span>
                    <span>24.5 GB of 100 GB</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full w-1/4 bg-gradient-to-r from-[#FDFBE7] to-[#0046E2] rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-[#FDFBE7] to-[#FDFBE7] flex items-center justify-center shadow-lg shadow-[#FDFBE7]/30">
                <HardDrive className="h-5 w-5 sm:h-6 sm:w-6 text-[#0f1a4a]" />
              </div>
              <span className="text-[#FDFBE7] font-semibold text-base sm:text-lg">KORE DRIVE</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6">
              All Your Files, <span className="bg-gradient-to-r from-[#FDFBE7] to-[#FDFBE7] bg-clip-text text-transparent">One Secure Place</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-[#A1A1AA] mb-6 sm:mb-8">
              Store, share, and collaborate on files with enterprise-grade security. Access everything from anywhere, on any device.
            </p>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {[
                { icon: FolderOpen, text: "Smart organization" },
                { icon: Share2, text: "Secure sharing" },
                { icon: Search, text: "Instant search" },
                { icon: Shield, text: "End-to-end encryption" },
              ].map((item, index) => {
                const Icon = item.icon
                return (
                  <div key={index} className="flex items-center gap-2 sm:gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:border-[#FDFBE7]/30 hover:bg-white/10 transition-all cursor-pointer group">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-[#FDFBE7] group-hover:scale-110 transition-transform" />
                    <span className="text-white text-xs sm:text-sm">{item.text}</span>
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
        className="min-h-screen flex items-center px-4 sm:px-6 relative overflow-hidden"
      >
        <div className="absolute top-1/2 left-0 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-[#10B981]/10 rounded-full blur-[100px] sm:blur-[150px]" />

        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-8 lg:gap-16 items-center relative z-10">
          <div className="order-2 lg:order-1">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center shadow-lg shadow-[#10B981]/30">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <span className="text-[#10B981] font-semibold text-base sm:text-lg">KORE CALENDAR</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6">
              Master <span className="bg-gradient-to-r from-[#10B981] to-[#059669] bg-clip-text text-transparent">Your Time</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-[#A1A1AA] mb-6 sm:mb-8">
              Schedule meetings, set reminders, and coordinate with your team effortlessly. Smart scheduling that respects everyone&apos;s time.
            </p>

            <div className="space-y-3 sm:space-y-4">
              {[
                "Drag-and-drop scheduling",
                "Team availability at a glance",
                "Smart meeting suggestions",
                "Automatic timezone conversion",
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 group cursor-pointer">
                  <div className="h-2 w-2 rounded-full bg-[#10B981] group-hover:scale-150 transition-transform" />
                  <span className="text-sm sm:text-base text-white group-hover:text-[#10B981] transition-colors">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Calendar Mockup */}
          <div className="calendar-content order-1 lg:order-2">
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-[#10B981]/30 to-[#059669]/20 rounded-2xl blur-xl opacity-50" />
              <div className="relative rounded-2xl bg-[#1b2d7c] border border-white/10 overflow-hidden shadow-2xl">
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-[#10B981]" />
                    <span className="text-white font-medium text-sm sm:text-base">December 2024</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-[#A1A1AA]">
                    <span className="hover:text-white cursor-pointer transition-colors">Week</span>
                    <span className="text-white bg-white/10 px-2 py-1 rounded">Day</span>
                    <span className="hover:text-white cursor-pointer transition-colors">Month</span>
                  </div>
                </div>

                <div className="p-4 sm:p-6">
                  <div className="text-[10px] sm:text-xs text-[#A1A1AA] mb-3 sm:mb-4">MONDAY, DEC 9</div>
                  <div className="space-y-2 sm:space-y-3">
                    {mockEvents.map((event, index) => (
                      <div
                        key={index}
                        className="event-item flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-lg bg-white/5 border-l-4 hover:bg-white/10 transition-all cursor-pointer group"
                        style={{ borderColor: event.color }}
                      >
                        <div className="flex-1">
                          <p className="text-white font-medium text-xs sm:text-sm group-hover:translate-x-1 transition-transform">{event.title}</p>
                          <p className="text-[10px] sm:text-xs text-[#A1A1AA]">
                            {event.time} • {event.duration}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="flex -space-x-2">
                            {Array.from({ length: Math.min(event.attendees, 3) }).map((_, i) => (
                              <div
                                key={i}
                                className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-white/20 border-2 border-[#1b2d7c]"
                              />
                            ))}
                          </div>
                          {event.attendees > 3 && (
                            <span className="text-[10px] sm:text-xs text-[#A1A1AA]">+{event.attendees - 3}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
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
        className="min-h-screen flex items-center px-4 sm:px-6 relative overflow-hidden"
      >
        <div className="absolute top-1/2 right-0 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-[#1b2d7c]/10 rounded-full blur-[100px] sm:blur-[150px]" />

        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-8 lg:gap-16 items-center relative z-10">
          {/* Contacts Mockup */}
          <div className="contacts-content">
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-[#1b2d7c]/30 to-[#0f1a4a]/20 rounded-2xl blur-xl opacity-50" />
              <div className="relative rounded-2xl bg-[#1b2d7c] border border-white/10 overflow-hidden shadow-2xl p-4 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-[#1b2d7c]" />
                  <span className="text-white font-medium text-sm sm:text-base">KORE Contacts</span>
                </div>

                <div className="grid gap-3 sm:gap-4">
                  {mockContacts.map((contact, index) => (
                    <div
                      key={index}
                      className="contact-card flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer group"
                    >
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-[#1b2d7c] to-[#0046E2] flex items-center justify-center text-white font-semibold text-sm sm:text-base group-hover:scale-110 transition-transform">
                        {contact.avatar}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm sm:text-base">{contact.name}</p>
                        <p className="text-xs sm:text-sm text-[#A1A1AA]">{contact.role}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-[#0046E2]/20 transition-colors">
                          <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-[#A1A1AA]" />
                        </div>
                        <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-[#0046E2]/20 transition-colors">
                          <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-[#A1A1AA]" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-[#1b2d7c] to-[#0f1a4a] flex items-center justify-center shadow-lg shadow-[#1b2d7c]/30">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <span className="text-[#1b2d7c] font-semibold text-base sm:text-lg">KORE CONTACTS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6">
              Your Network, <span className="bg-gradient-to-r from-[#1b2d7c] to-[#0f1a4a] bg-clip-text text-transparent">Organized</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-[#A1A1AA] mb-6 sm:mb-8">
              Keep all your contacts in one place. Rich profiles, smart groups, and instant access to connect with anyone.
            </p>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {[
                { icon: Users, text: "Smart groups" },
                { icon: Search, text: "Quick search" },
                { icon: Mail, text: "One-click contact" },
                { icon: MapPin, text: "Location info" },
              ].map((item, index) => {
                const Icon = item.icon
                return (
                  <div key={index} className="flex items-center gap-2 sm:gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:border-[#1b2d7c]/30 hover:bg-white/10 transition-all cursor-pointer group">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-[#1b2d7c] group-hover:scale-110 transition-transform" />
                    <span className="text-white text-xs sm:text-sm">{item.text}</span>
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
        className="min-h-screen flex items-center px-4 sm:px-6 relative overflow-hidden"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[800px] h-[400px] sm:h-[800px] bg-[#0046E2]/10 rounded-full blur-[100px] sm:blur-[150px]" />

        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-8 lg:gap-16 items-center relative z-10">
          <div className="order-2 lg:order-1">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-[#0046E2] to-[#1A5AE8] flex items-center justify-center shadow-lg shadow-[#0046E2]/30">
                <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <span className="text-[#0046E2] font-semibold text-base sm:text-lg">KORE TALK</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6">
              Connect <span className="bg-gradient-to-r from-[#0046E2] to-[#1A5AE8] bg-clip-text text-transparent">Instantly</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-[#A1A1AA] mb-6 sm:mb-8">
              Real-time messaging, HD video calls, and seamless collaboration. Stay connected with your team wherever you are.
            </p>

            <div className="space-y-3 sm:space-y-4">
              {[
                "Instant messaging with threads",
                "Crystal-clear video calls",
                "Screen sharing & recording",
                "File sharing in conversations",
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 group cursor-pointer">
                  <div className="h-2 w-2 rounded-full bg-[#0046E2] group-hover:scale-150 transition-transform" />
                  <span className="text-sm sm:text-base text-white group-hover:text-[#0046E2] transition-colors">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Talk Mockup */}
          <div className="talk-content order-1 lg:order-2">
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-[#0046E2]/30 to-[#1A5AE8]/20 rounded-2xl blur-xl opacity-50" />
              <div className="relative rounded-2xl bg-[#1b2d7c] border border-white/10 overflow-hidden shadow-2xl">
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-[#0046E2]" />
                    <span className="text-white font-medium text-sm sm:text-base">Messages</span>
                  </div>
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-[#0046E2] flex items-center justify-center">
                    <Bell className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                </div>

                <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                  {mockMessages.map((msg, index) => (
                    <div
                      key={index}
                      className="message-item flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg hover:bg-white/5 transition-all cursor-pointer group"
                    >
                      <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-medium flex-shrink-0 group-hover:scale-110 transition-transform ${msg.isGroup ? 'bg-gradient-to-br from-[#0046E2] to-[#1b2d7c]' : 'bg-gradient-to-br from-[#0046E2] to-[#10B981]'}`}>
                        {msg.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium text-xs sm:text-sm">{msg.sender}</p>
                          <span className="text-[10px] sm:text-xs text-[#A1A1AA]">{msg.time}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-[#A1A1AA] truncate">{msg.message}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Video call preview */}
                <div className="p-3 sm:p-4 border-t border-white/10">
                  <div className="rounded-xl bg-gradient-to-br from-[#0046E2]/20 to-[#1b2d7c]/20 p-3 sm:p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-[#0046E2] flex items-center justify-center animate-pulse">
                        <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white text-xs sm:text-sm font-medium">Incoming call</p>
                        <p className="text-[10px] sm:text-xs text-[#A1A1AA]">Design Team</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-[#10B981] flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                        <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-red-500 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                        <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-white rotate-[135deg]" />
                      </div>
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
        className="min-h-screen flex items-center px-4 sm:px-6 relative overflow-hidden"
      >
        <div className="absolute top-1/2 right-0 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-[#FDFBE7]/10 rounded-full blur-[100px] sm:blur-[150px]" />

        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-8 lg:gap-16 items-center relative z-10">
          {/* Tasks Mockup */}
          <div className="tasks-content">
            <div className="grid gap-4 sm:gap-6">
              {/* Tasks Card */}
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-[#FDFBE7]/30 to-[#0046E2]/20 rounded-2xl blur-xl opacity-50" />
                <div className="relative rounded-2xl bg-[#1b2d7c] border border-white/10 overflow-hidden shadow-2xl">
                  <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 flex items-center gap-2 sm:gap-3">
                    <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5 text-[#FDFBE7]" />
                    <span className="text-white font-medium text-sm sm:text-base">Tasks</span>
                  </div>
                  <div className="p-3 sm:p-4 space-y-2">
                    {mockTasks.map((task, index) => (
                      <div
                        key={index}
                        className="task-item flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer group"
                      >
                        <div className={`h-4 w-4 sm:h-5 sm:w-5 rounded border-2 flex items-center justify-center transition-all ${task.status === 'done' ? 'bg-[#10B981] border-[#10B981]' : 'border-white/30 group-hover:border-[#FDFBE7]'}`}>
                          {task.status === 'done' && (
                            <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-white" />
                          )}
                        </div>
                        <span className={`flex-1 text-xs sm:text-sm ${task.status === 'done' ? 'text-[#A1A1AA] line-through' : 'text-white'}`}>
                          {task.title}
                        </span>
                        <span className={`text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 rounded-full ${
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
              </div>

              {/* Notes Card */}
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-[#FDFBE7]/20 to-[#0046E2]/10 rounded-2xl blur-xl opacity-50" />
                <div className="relative rounded-2xl bg-[#1b2d7c] border border-white/10 overflow-hidden shadow-2xl">
                  <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 flex items-center gap-2 sm:gap-3">
                    <StickyNote className="h-4 w-4 sm:h-5 sm:w-5 text-[#FDFBE7]" />
                    <span className="text-white font-medium text-sm sm:text-base">Quick Note</span>
                  </div>
                  <div className="p-3 sm:p-4">
                    <div className="bg-white/5 rounded-lg p-3 sm:p-4 hover:bg-white/10 transition-all cursor-pointer">
                      <p className="text-white text-xs sm:text-sm mb-2 font-medium">Meeting Notes - Q4 Planning</p>
                      <p className="text-[#A1A1AA] text-xs sm:text-sm leading-relaxed">
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
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-[#FDFBE7] to-[#0046E2] flex items-center justify-center shadow-lg shadow-[#FDFBE7]/30">
                <CheckSquare className="h-5 w-5 sm:h-6 sm:w-6 text-[#0f1a4a]" />
              </div>
              <span className="text-[#FDFBE7] font-semibold text-base sm:text-lg">TASKS & NOTES</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6">
              Stay <span className="bg-gradient-to-r from-[#FDFBE7] to-[#0046E2] bg-clip-text text-transparent">on Track</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-[#A1A1AA] mb-6 sm:mb-8">
              Manage tasks with Kanban boards, capture ideas with rich notes, and never miss a deadline again.
            </p>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {[
                { icon: CheckSquare, text: "Kanban boards" },
                { icon: StickyNote, text: "Rich text notes" },
                { icon: Bell, text: "Due date alerts" },
                { icon: Users, text: "Team assignments" },
              ].map((item, index) => {
                const Icon = item.icon
                return (
                  <div key={index} className="flex items-center gap-2 sm:gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:border-[#FDFBE7]/30 hover:bg-white/10 transition-all cursor-pointer group">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-[#FDFBE7] group-hover:scale-110 transition-transform" />
                    <span className="text-white text-xs sm:text-sm">{item.text}</span>
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
        className="py-20 sm:py-32 px-4 sm:px-6 relative overflow-hidden"
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f1a4a] via-[#0046E2]/5 to-[#0f1a4a]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[1000px] h-[500px] sm:h-[1000px] bg-[#0046E2]/10 rounded-full blur-[150px] sm:blur-[200px]" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#0046E2]/50 to-transparent" />

        <div className="cta-content relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#0046E2]/10 to-[#FDFBE7]/10 border border-[#0046E2]/20 mb-6">
            <Rocket className="h-4 w-4 text-[#FDFBE7]" />
            <span className="text-sm text-white">Ready to get started?</span>
          </div>

          <h2 className="text-3xl sm:text-5xl md:text-7xl font-bold text-white mb-4 sm:mb-6">
            Transform your <span className="bg-gradient-to-r from-[#0046E2] via-[#1b2d7c] to-[#FDFBE7] bg-clip-text text-transparent">workflow</span> today
          </h2>
          <p className="text-base sm:text-xl text-[#A1A1AA] mb-8 sm:mb-10 max-w-2xl mx-auto">
            Join thousands of teams already using KORE to collaborate better, work smarter, and achieve more.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/register"
              className="group w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-[#0046E2] to-[#1A5AE8] text-[#0f1a4a] rounded-xl text-lg sm:text-xl font-semibold hover:shadow-xl hover:shadow-[#0046E2]/30 transition-all hover:scale-105 flex items-center justify-center gap-3"
            >
              <Rocket className="h-5 w-5 sm:h-6 sm:w-6" />
              Get Started Free
              <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#login"
              className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 border border-white/20 text-white rounded-xl text-lg sm:text-xl font-semibold hover:bg-white/5 hover:border-[#0046E2]/50 transition-all flex items-center justify-center"
            >
              Sign In
            </a>
          </div>
          <p className="mt-6 text-xs sm:text-sm text-[#A1A1AA]">
            No credit card required • Free 14-day trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 sm:px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-[#0046E2] to-[#0046E2]/50 flex items-center justify-center shadow-lg shadow-[#0046E2]/20">
                <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg sm:text-xl font-bold font-[family-name:var(--font-montserrat)] bg-gradient-to-r from-white to-[#0046E2] bg-clip-text text-transparent">KORE</span>
                <span className="text-[8px] sm:text-[10px] text-[#FDFBE7]/70 -mt-1 tracking-wider">BY SOCIOS</span>
              </div>
            </div>
            <div className="flex items-center gap-4 sm:gap-8 text-xs sm:text-sm text-[#A1A1AA]">
              <Link href="/privacy" className="hover:text-[#0046E2] transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-[#0046E2] transition-colors">Terms</Link>
              <Link href="/status" className="hover:text-[#0046E2] transition-colors flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
                </span>
                Status
              </Link>
            </div>
            <p className="text-xs sm:text-sm text-[#A1A1AA]">
              © {new Date().getFullYear()} KORE By Socios. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Add custom styles for gradient animation */}
      <style jsx global>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          animation: gradient 6s ease infinite;
        }
      `}</style>
    </div>
  )
}
