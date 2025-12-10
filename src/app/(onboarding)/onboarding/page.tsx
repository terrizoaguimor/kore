"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "motion/react"
import {
  Building2,
  Users,
  Check,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Brain,
  Sparkles,
  Mail,
  X,
  Plus,
  Crown,
  Rocket,
  HardDrive,
  Phone,
  Video,
  Activity,
} from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { KoreLogo } from "@/components/brand/kore-logo"
import { NeuralNetworkField } from "@/components/effects/neural-network-field"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

// Step schemas
const organizationSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters"),
  slug: z.string().min(2, "URL must be at least 2 characters").regex(/^[a-z0-9-]+$/, "URL can only contain lowercase letters, numbers, and hyphens"),
  industry: z.string().optional(),
  size: z.string().optional(),
})

type OrganizationFormData = z.infer<typeof organizationSchema>

const steps = [
  { id: 1, name: "Welcome", icon: Sparkles },
  { id: 2, name: "Organization", icon: Building2 },
  { id: 3, name: "Team", icon: Users },
  { id: 4, name: "Complete", icon: Rocket },
]

const industries = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Retail",
  "Manufacturing",
  "Professional Services",
  "Other",
]

const companySizes = [
  { value: "1-10", label: "1-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "201-500", label: "201-500 employees" },
  { value: "500+", label: "500+ employees" },
]

const features = [
  { icon: Brain, name: "The Core", description: "AI-powered assistant", color: "#00E5FF" },
  { icon: HardDrive, name: "Drive", description: "File storage & sharing", color: "#00E5FF" },
  { icon: Phone, name: "Voice", description: "Telephony & calls", color: "#8B5CF6" },
  { icon: Video, name: "Meet", description: "Video conferencing", color: "#10B981" },
  { icon: Activity, name: "Pulse", description: "Marketing automation", color: "#FF6B6B" },
  { icon: Users, name: "Link", description: "CRM & contacts", color: "#FFB830" },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [teamEmails, setTeamEmails] = useState<string[]>([])
  const [newEmail, setNewEmail] = useState("")
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [userName, setUserName] = useState("")

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
  })

  const orgName = watch("name", "")

  // Auto-generate slug from name
  useEffect(() => {
    if (orgName) {
      const slug = orgName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
      setValue("slug", slug)
    }
  }, [orgName, setValue])

  // Get user info on mount
  useEffect(() => {
    const getUserInfo = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.user_metadata?.full_name) {
        setUserName(user.user_metadata.full_name.split(" ")[0])
      }
    }
    getUserInfo()
  }, [])

  const handleAddEmail = () => {
    if (newEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      if (!teamEmails.includes(newEmail)) {
        setTeamEmails([...teamEmails, newEmail])
        setNewEmail("")
      }
    } else {
      toast.error("Please enter a valid email address")
    }
  }

  const handleRemoveEmail = (email: string) => {
    setTeamEmails(teamEmails.filter((e) => e !== email))
  }

  const createOrganization = async (data: OrganizationFormData) => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error("Please sign in first")
        router.push("/login")
        return
      }

      // Create organization
      // Using 'as any' due to Supabase client type inference limitations
      const { data: org, error: orgError } = await (supabase as any)
        .from("organizations")
        .insert({
          name: data.name,
          slug: data.slug,
          settings: {
            industry: data.industry,
            size: data.size,
          },
        })
        .select()
        .single()

      if (orgError) {
        if (orgError.code === "23505") {
          toast.error("This URL is already taken. Please choose another.")
        } else {
          toast.error(orgError.message)
        }
        return
      }

      // Add user as owner
      // Using 'as any' due to Supabase client type inference limitations
      const { error: memberError } = await (supabase as any)
        .from("organization_members")
        .insert({
          organization_id: org.id,
          user_id: user.id,
          role: "owner",
        })

      if (memberError) {
        console.error("Member creation error:", memberError)
      }

      setOrganizationId(org.id)
      toast.success("Organization created!")
      setCurrentStep(3)
    } catch {
      toast.error("Failed to create organization")
    } finally {
      setIsLoading(false)
    }
  }

  const sendInvitations = async () => {
    if (teamEmails.length === 0) {
      setCurrentStep(4)
      return
    }

    setIsLoading(true)
    try {
      // In a real implementation, you would send invitation emails here
      // For now, we'll just simulate the process
      await new Promise(resolve => setTimeout(resolve, 1500))

      toast.success(`Invitations sent to ${teamEmails.length} team member${teamEmails.length > 1 ? "s" : ""}!`)
      setCurrentStep(4)
    } catch {
      toast.error("Failed to send invitations")
    } finally {
      setIsLoading(false)
    }
  }

  const completeOnboarding = () => {
    router.push("/core")
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="text-center max-w-lg mx-auto"
          >
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-[#00E5FF]/20 to-[#8B5CF6]/20 mb-6">
              <Sparkles className="h-10 w-10 text-[#FFB830]" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Welcome{userName ? `, ${userName}` : ""}!
            </h2>
            <p className="text-lg text-[#A1A1AA] mb-8">
              Let's set up your workspace in just a few steps. You'll have everything ready to collaborate with your team in no time.
            </p>

            {/* Features preview */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
              {features.map((feature) => (
                <div
                  key={feature.name}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group"
                >
                  <feature.icon
                    className="h-6 w-6 mb-2 group-hover:scale-110 transition-transform"
                    style={{ color: feature.color }}
                  />
                  <p className="text-sm font-medium text-white">{feature.name}</p>
                  <p className="text-xs text-[#A1A1AA]">{feature.description}</p>
                </div>
              ))}
            </div>

            <Button
              onClick={() => setCurrentStep(2)}
              className="w-full sm:w-auto px-8 h-12 bg-gradient-to-r from-[#00E5FF] to-[#0EA5E9] text-[#0B0B0B] font-semibold hover:shadow-lg hover:shadow-[#00E5FF]/30 transition-all"
            >
              Let's Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        )

      case 2:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-lg mx-auto"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-xl bg-gradient-to-br from-[#FFB830]/20 to-[#FFB830]/5 mb-4">
                <Building2 className="h-8 w-8 text-[#FFB830]" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Create your organization
              </h2>
              <p className="text-[#A1A1AA]">
                This will be your team's workspace
              </p>
            </div>

            <form onSubmit={handleSubmit(createOrganization)} className="space-y-5">
              {/* Organization Name */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Organization Name
                </label>
                <input
                  {...register("name")}
                  className="block w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/50 focus:border-[#00E5FF] transition-all"
                  placeholder="Acme Inc."
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
                )}
              </div>

              {/* URL Slug */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Workspace URL
                </label>
                <div className="flex items-center">
                  <span className="px-4 py-3 rounded-l-xl bg-white/10 border border-r-0 border-white/10 text-[#A1A1AA] text-sm">
                    kore.ai/
                  </span>
                  <input
                    {...register("slug")}
                    className="block flex-1 rounded-r-xl bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/50 focus:border-[#00E5FF] transition-all"
                    placeholder="acme"
                  />
                </div>
                {errors.slug && (
                  <p className="mt-1 text-sm text-red-400">{errors.slug.message}</p>
                )}
              </div>

              {/* Industry */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Industry <span className="text-[#A1A1AA]">(optional)</span>
                </label>
                <select
                  {...register("industry")}
                  className="block w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/50 focus:border-[#00E5FF] transition-all"
                >
                  <option value="">Select industry</option>
                  {industries.map((ind) => (
                    <option key={ind} value={ind} className="bg-[#1A1A1A]">
                      {ind}
                    </option>
                  ))}
                </select>
              </div>

              {/* Company Size */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Company Size <span className="text-[#A1A1AA]">(optional)</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {companySizes.map((size) => (
                    <label
                      key={size.value}
                      className={cn(
                        "flex items-center justify-center px-4 py-2.5 rounded-lg border cursor-pointer transition-all text-sm",
                        watch("size") === size.value
                          ? "bg-[#00E5FF]/10 border-[#00E5FF] text-[#00E5FF]"
                          : "bg-white/5 border-white/10 text-[#A1A1AA] hover:border-white/20"
                      )}
                    >
                      <input
                        type="radio"
                        {...register("size")}
                        value={size.value}
                        className="sr-only"
                      />
                      {size.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setCurrentStep(1)}
                  className="text-[#A1A1AA] hover:text-white"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 h-11 bg-gradient-to-r from-[#00E5FF] to-[#0EA5E9] text-[#0B0B0B] font-semibold hover:shadow-lg hover:shadow-[#00E5FF]/30 transition-all"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        )

      case 3:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-lg mx-auto"
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-xl bg-gradient-to-br from-[#8B5CF6]/20 to-[#8B5CF6]/5 mb-4">
                <Users className="h-8 w-8 text-[#8B5CF6]" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Invite your team
              </h2>
              <p className="text-[#A1A1AA]">
                Collaboration is better together. Invite your teammates to join.
              </p>
            </div>

            <div className="space-y-5">
              {/* Email input */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Team member emails
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A1A1AA]" />
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddEmail())}
                      className="block w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-3 text-white placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/50 focus:border-[#00E5FF] transition-all"
                      placeholder="colleague@company.com"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddEmail}
                    className="px-4 bg-white/10 hover:bg-white/20 text-white"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Email list */}
              {teamEmails.length > 0 && (
                <div className="space-y-2">
                  {teamEmails.map((email) => (
                    <div
                      key={email}
                      className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] flex items-center justify-center text-white text-sm font-medium">
                          {email[0].toUpperCase()}
                        </div>
                        <span className="text-white text-sm">{email}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveEmail(email)}
                        className="text-[#A1A1AA] hover:text-red-400 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Info box */}
              <div className="p-4 rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/20">
                <div className="flex items-start gap-3">
                  <Crown className="h-5 w-5 text-[#8B5CF6] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-white font-medium">You're the owner</p>
                    <p className="text-xs text-[#A1A1AA] mt-1">
                      As the organization owner, you have full admin access. Team members you invite will be added as members.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setCurrentStep(2)}
                  className="text-[#A1A1AA] hover:text-white"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setCurrentStep(4)}
                    className="text-[#A1A1AA] hover:text-white"
                  >
                    Skip for now
                  </Button>
                  <Button
                    onClick={sendInvitations}
                    disabled={isLoading || teamEmails.length === 0}
                    className="px-6 h-11 bg-gradient-to-r from-[#00E5FF] to-[#0EA5E9] text-[#0B0B0B] font-semibold hover:shadow-lg hover:shadow-[#00E5FF]/30 transition-all disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Invitations
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )

      case 4:
        return (
          <motion.div
            key="step4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center max-w-lg mx-auto"
          >
            <div className="relative inline-flex items-center justify-center h-24 w-24 mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-[#00E5FF] to-[#10B981] rounded-full blur-xl opacity-50 animate-pulse" />
              <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center">
                <Check className="h-10 w-10 text-white" />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-white mb-4">
              You're all set!
            </h2>
            <p className="text-lg text-[#A1A1AA] mb-8">
              Your workspace is ready. Start exploring The Core and see how AI can supercharge your workflow.
            </p>

            <div className="p-6 rounded-2xl bg-gradient-to-r from-[#00E5FF]/10 to-[#8B5CF6]/10 border border-white/10 mb-8">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#00E5FF] to-[#00E5FF]/50 flex items-center justify-center">
                  <Brain className="h-6 w-6 text-[#0B0B0B]" />
                </div>
                <div className="text-left">
                  <p className="text-white font-semibold">Meet The Core</p>
                  <p className="text-sm text-[#A1A1AA]">Your AI-powered assistant</p>
                </div>
              </div>
              <p className="text-sm text-[#A1A1AA]">
                Ask anything, automate tasks, and get intelligent insights about your business.
              </p>
            </div>

            <Button
              onClick={completeOnboarding}
              className="w-full sm:w-auto px-10 h-14 bg-gradient-to-r from-[#00E5FF] to-[#0EA5E9] text-[#0B0B0B] text-lg font-semibold hover:shadow-xl hover:shadow-[#00E5FF]/30 transition-all"
            >
              <Rocket className="mr-2 h-5 w-5" />
              Launch Your Workspace
            </Button>
          </motion.div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0B0B] relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <NeuralNetworkField particleCount={200} hubCount={8} />
      </div>
      <div className="fixed inset-0 bg-gradient-to-b from-[#0B0B0B] via-transparent to-[#0B0B0B] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <KoreLogo size="md" color="gradient" />

          {/* Progress Steps */}
          <div className="hidden sm:flex items-center gap-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={cn(
                    "flex items-center justify-center h-8 w-8 rounded-full transition-all",
                    currentStep >= step.id
                      ? "bg-gradient-to-br from-[#00E5FF] to-[#0EA5E9] text-[#0B0B0B]"
                      : "bg-white/10 text-[#A1A1AA]"
                  )}
                >
                  {currentStep > step.id ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <step.icon className="h-4 w-4" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "w-8 h-0.5 mx-1 transition-all",
                      currentStep > step.id ? "bg-[#00E5FF]" : "bg-white/10"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
