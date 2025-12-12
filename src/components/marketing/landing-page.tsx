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
import { FeaturesScrollStack } from "@/components/marketing/features-scroll-stack"
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
  { icon: Brain, title: "AI-Powered", description: "Intelligent assistance across all modules", gradient: "from-[#00E5FF] to-[#0EA5E9]" },
  { icon: Shield, title: "Enterprise Security", description: "Bank-level encryption and compliance", gradient: "from-[#10B981] to-[#059669]" },
  { icon: Zap, title: "Lightning Fast", description: "Optimized for speed and performance", gradient: "from-[#FFB830] to-[#F59E0B]" },
  { icon: Globe, title: "Work Anywhere", description: "Access from any device, anywhere", gradient: "from-[#8B5CF6] to-[#7C3AED]" },
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
        boxShadow: "0 0 60px rgba(0, 229, 255, 0.4)",
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
    <div className="relative min-h-screen bg-[#0B0B0B]">
      {/* Fixed Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0B0B0B]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-[#00E5FF] to-[#00E5FF]/50 flex items-center justify-center shadow-lg shadow-[#00E5FF]/20">
              <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-[#0B0B0B]" />
            </div>
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white to-[#00E5FF] bg-clip-text text-transparent">KORE</span>
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
                  activeSection === item.id ? "text-[#00E5FF]" : "text-[#A1A1AA] hover:text-white"
                )}
              >
                {item.label}
                <span className={cn(
                  "absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-[#00E5FF] to-[#FFB830] transition-all duration-300",
                  activeSection === item.id ? "w-full" : "w-0 group-hover:w-full"
                )} />
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <a
              href="#login"
              className="hidden sm:block text-sm text-white hover:text-[#00E5FF] transition-colors"
            >
              Sign In
            </a>
            <Link
              href="/register"
              className="px-3 sm:px-4 py-2 bg-gradient-to-r from-[#00E5FF] to-[#0EA5E9] text-[#0B0B0B] rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-[#00E5FF]/30 transition-all hover:scale-105"
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
        <div className="absolute top-1/4 left-1/4 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-[#00E5FF]/20 rounded-full blur-[100px] sm:blur-[150px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-[#FFB830]/15 rounded-full blur-[100px] sm:blur-[120px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-[#8B5CF6]/10 rounded-full blur-[120px] sm:blur-[180px] animate-pulse" style={{ animationDelay: "2s" }} />

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0B0B] via-transparent to-[#0B0B0B] z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0B0B]/60 via-transparent to-[#0B0B0B]/60 z-10" />

        <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left side - Hero content */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <div className="hero-badge inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-[#00E5FF]/10 to-[#FFB830]/10 border border-[#00E5FF]/20 mb-4 sm:mb-6">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-[#FFB830]" />
                <span className="text-xs sm:text-sm text-white">Introducing KORE AI Platform</span>
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-[#00E5FF]" />
              </div>

              <h1 className="hero-title text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 sm:mb-6 tracking-tight leading-tight">
                <span className="bg-gradient-to-r from-white via-[#00E5FF] to-white bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                  The Future of
                </span>
                <br />
                <span className="bg-gradient-to-r from-[#FFB830] via-[#00E5FF] to-[#8B5CF6] bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                  Collaboration
                </span>
              </h1>

              <p className="hero-subtitle text-base sm:text-lg md:text-xl text-[#A1A1AA] mb-6 sm:mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                One intelligent platform to manage files, schedule meetings, communicate with your team, and unlock AI-powered insights.
              </p>

              <div className="hero-cta flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 mb-8 sm:mb-12">
                <Link
                  href="/register"
                  className="group w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-[#00E5FF] to-[#0EA5E9] text-[#0B0B0B] rounded-xl text-base sm:text-lg font-semibold hover:shadow-xl hover:shadow-[#00E5FF]/30 transition-all hover:scale-105 flex items-center justify-center gap-2"
                >
                  <Rocket className="h-4 w-4 sm:h-5 sm:w-5" />
                  Start Free Trial
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="group w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 border border-white/20 text-white rounded-xl text-base sm:text-lg font-semibold hover:bg-white/5 hover:border-[#00E5FF]/50 transition-all flex items-center justify-center gap-2">
                  <Play className="h-4 w-4 sm:h-5 sm:w-5 group-hover:text-[#00E5FF] transition-colors" />
                  Watch Demo
                </button>
              </div>

              {/* Stats */}
              <div className="hero-stats grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center lg:text-left">
                    <div className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#00E5FF] to-[#FFB830] bg-clip-text text-transparent">
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
                <div className="absolute -inset-1 bg-gradient-to-r from-[#00E5FF] via-[#8B5CF6] to-[#FFB830] rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity" />

                <div className="relative rounded-2xl bg-[#0B0B0B]/90 backdrop-blur-xl border border-white/10 p-6 sm:p-8 shadow-2xl">
                  <div className="text-center mb-6">
                    <div className="float-element inline-flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00E5FF]/20 to-[#00E5FF]/5 mb-4 pulse-glow">
                      <Lock className="h-6 w-6 sm:h-7 sm:w-7 text-[#00E5FF]" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Welcome Back</h2>
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
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A1A1AA] group-focus-within:text-[#00E5FF] transition-colors" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#00E5FF]/50 focus:ring-2 focus:ring-[#00E5FF]/20 transition-all"
                          placeholder="you@company.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#A1A1AA] mb-2">Password</label>
                      <div className="relative group">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A1A1AA] group-focus-within:text-[#00E5FF] transition-colors" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#00E5FF]/50 focus:ring-2 focus:ring-[#00E5FF]/20 transition-all"
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
                        <div className="h-5 w-5 rounded border border-white/20 bg-white/5 flex items-center justify-center peer-checked:bg-[#00E5FF] peer-checked:border-[#00E5FF] transition-all group-hover:border-[#00E5FF]/50">
                          <Check className="h-3 w-3 text-[#0B0B0B] opacity-0 peer-checked:opacity-100" />
                        </div>
                        <span className="text-sm text-[#A1A1AA]">Remember me</span>
                      </label>
                      <Link href="/forgot-password" className="text-sm text-[#00E5FF] hover:underline">
                        Forgot password?
                      </Link>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 bg-gradient-to-r from-[#00E5FF] to-[#0EA5E9] text-[#0B0B0B] rounded-xl font-semibold hover:shadow-lg hover:shadow-[#00E5FF]/30 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
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
                      <Link href="/register" className="text-[#00E5FF] hover:underline font-medium">
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
                        <Cloud className="h-4 w-4 text-[#00E5FF]" />
                        <span className="text-xs">Cloud-based</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Star className="h-4 w-4 text-[#FFB830]" />
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
          <div className="h-10 sm:h-12 w-6 sm:w-7 rounded-full border-2 border-[#00E5FF]/30 flex items-start justify-center p-1.5">
            <div className="h-2 w-2 rounded-full bg-[#00E5FF] animate-bounce" />
          </div>
        </div>
      </section>

      {/* Features Scroll Stack */}
      <div id="features" ref={featuresRef}>
        <FeaturesScrollStack />
      </div>

      {/* CTA Section */}
      <section
        ref={ctaRef}
        className="py-20 sm:py-32 px-4 sm:px-6 relative overflow-hidden"
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0B0B] via-[#00E5FF]/5 to-[#0B0B0B]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[1000px] h-[500px] sm:h-[1000px] bg-[#00E5FF]/10 rounded-full blur-[150px] sm:blur-[200px]" />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#00E5FF]/50 to-transparent" />

        <div className="cta-content relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#00E5FF]/10 to-[#FFB830]/10 border border-[#00E5FF]/20 mb-6">
            <Rocket className="h-4 w-4 text-[#FFB830]" />
            <span className="text-sm text-white">Ready to get started?</span>
          </div>

          <h2 className="text-3xl sm:text-5xl md:text-7xl font-bold text-white mb-4 sm:mb-6">
            Transform your <span className="bg-gradient-to-r from-[#00E5FF] via-[#8B5CF6] to-[#FFB830] bg-clip-text text-transparent">workflow</span> today
          </h2>
          <p className="text-base sm:text-xl text-[#A1A1AA] mb-8 sm:mb-10 max-w-2xl mx-auto">
            Join thousands of teams already using KORE to collaborate better, work smarter, and achieve more.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/register"
              className="group w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-[#00E5FF] to-[#0EA5E9] text-[#0B0B0B] rounded-xl text-lg sm:text-xl font-semibold hover:shadow-xl hover:shadow-[#00E5FF]/30 transition-all hover:scale-105 flex items-center justify-center gap-3"
            >
              <Rocket className="h-5 w-5 sm:h-6 sm:w-6" />
              Get Started Free
              <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#login"
              className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 border border-white/20 text-white rounded-xl text-lg sm:text-xl font-semibold hover:bg-white/5 hover:border-[#00E5FF]/50 transition-all flex items-center justify-center"
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
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-[#00E5FF] to-[#00E5FF]/50 flex items-center justify-center shadow-lg shadow-[#00E5FF]/20">
                <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-[#0B0B0B]" />
              </div>
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white to-[#00E5FF] bg-clip-text text-transparent">KORE</span>
            </div>
            <div className="flex items-center gap-4 sm:gap-8 text-xs sm:text-sm text-[#A1A1AA]">
              <Link href="/privacy" className="hover:text-[#00E5FF] transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-[#00E5FF] transition-colors">Terms</Link>
              <Link href="/status" className="hover:text-[#00E5FF] transition-colors flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
                </span>
                Status
              </Link>
            </div>
            <p className="text-xs sm:text-sm text-[#A1A1AA]">
              © {new Date().getFullYear()} KORE. All rights reserved.
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
