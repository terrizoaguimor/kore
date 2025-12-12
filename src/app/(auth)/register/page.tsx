"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Loader2, Check, ArrowRight, Building2, User } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { motion } from "motion/react"

import { Button } from "@/components/ui/button"
import { KoreLogo } from "@/components/brand/kore-logo"
import { NeuralNetworkField } from "@/components/effects/neural-network-field"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const registerSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine((val) => val === true, "You must accept the terms"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type RegisterFormData = z.infer<typeof registerSchema>

const passwordRequirements = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Contains uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Contains lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "Contains number", test: (p: string) => /[0-9]/.test(p) },
]

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      acceptTerms: false,
    },
  })

  const password = watch("password", "")

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)

    try {
      const supabase = createClient()

      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
        },
      })

      if (authError) {
        toast.error(authError.message)
        return
      }

      if (authData.user) {
        // Create user profile - insert into public.users
        // Using 'as any' due to Supabase client type inference limitations
        const { error: profileError } = await (supabase as any)
          .from("users")
          .insert({
            id: authData.user.id,
            email: data.email,
            full_name: data.fullName,
          })

        if (profileError) {
          console.error("Profile creation error:", profileError)
        }

        toast.success("Account created! Let's set up your workspace.")
        router.push("/onboarding")
      }
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-[#0f1a4a]">
      {/* Left side - Register form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16 xl:px-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mx-auto w-full max-w-md"
        >
          {/* Logo */}
          <div>
            <KoreLogo size="lg" color="gradient" />
            <h2 className="mt-8 text-2xl font-bold tracking-tight text-white">
              Create your account
            </h2>
            <p className="mt-2 text-sm text-[#A1A1AA]">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-[#0046E2] hover:text-[#0046E2]/80 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>

          {/* Form */}
          <div className="mt-10">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-white">
                  Full Name
                </label>
                <div className="mt-2 relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A1A1AA]" />
                  <input
                    id="fullName"
                    type="text"
                    autoComplete="name"
                    disabled={isLoading}
                    {...register("fullName")}
                    className="block w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-3 text-sm text-white placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#0046E2]/50 focus:border-[#0046E2] transition-all disabled:opacity-50"
                    placeholder="John Doe"
                  />
                </div>
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-400">{errors.fullName.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white">
                  Work Email
                </label>
                <div className="mt-2 relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A1A1AA]" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    disabled={isLoading}
                    {...register("email")}
                    className="block w-full rounded-xl bg-white/5 border border-white/10 pl-10 pr-4 py-3 text-sm text-white placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#0046E2]/50 focus:border-[#0046E2] transition-all disabled:opacity-50"
                    placeholder="you@company.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white">
                  Password
                </label>
                <div className="relative mt-2">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    disabled={isLoading}
                    {...register("password")}
                    className="block w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#0046E2]/50 focus:border-[#0046E2] transition-all disabled:opacity-50 pr-12"
                    placeholder="Create a strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {/* Password requirements */}
                {password && (
                  <div className="mt-3 space-y-2">
                    {passwordRequirements.map((req, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs">
                        <div className={cn(
                          "h-4 w-4 rounded-full flex items-center justify-center transition-all",
                          req.test(password)
                            ? "bg-[#10B981] text-white"
                            : "bg-white/10 text-[#A1A1AA]"
                        )}>
                          <Check className="h-2.5 w-2.5" />
                        </div>
                        <span className={req.test(password) ? "text-[#10B981]" : "text-[#A1A1AA]"}>
                          {req.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {errors.password && (
                  <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-white">
                  Confirm Password
                </label>
                <div className="relative mt-2">
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    disabled={isLoading}
                    {...register("confirmPassword")}
                    className="block w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-[#A1A1AA] focus:outline-none focus:ring-2 focus:ring-[#0046E2]/50 focus:border-[#0046E2] transition-all disabled:opacity-50"
                    placeholder="Confirm your password"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-400">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Terms */}
              <div className="flex items-start gap-3">
                <input
                  id="acceptTerms"
                  type="checkbox"
                  {...register("acceptTerms")}
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 text-[#0046E2] focus:ring-[#0046E2]/50"
                />
                <label htmlFor="acceptTerms" className="text-sm text-[#A1A1AA]">
                  I agree to the{" "}
                  <Link href="/terms" className="text-[#0046E2] hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-[#0046E2] hover:underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>
              {errors.acceptTerms && (
                <p className="text-sm text-red-400">{errors.acceptTerms.message}</p>
              )}

              {/* Submit button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-[#0046E2] to-[#1A5AE8] text-[#0f1a4a] font-semibold hover:shadow-lg hover:shadow-[#0046E2]/30 transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </motion.div>
      </div>

      {/* Right side - Visual panel */}
      <div className="relative hidden lg:block lg:w-1/2 overflow-hidden">
        <NeuralNetworkField particleCount={400} hubCount={12} />

        <div className="absolute inset-0 bg-gradient-to-br from-[#0046E2]/5 to-[#1b2d7c]/5" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-[#0046E2]/20 to-[#0046E2]/5 mb-6">
              <Building2 className="h-10 w-10 text-[#0046E2]" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-4">
              Start your journey
            </h3>
            <p className="text-lg text-[#A1A1AA] max-w-md">
              Create your account and set up your organization in just a few minutes. No credit card required.
            </p>

            {/* Features list */}
            <div className="mt-8 space-y-3 text-left max-w-sm mx-auto">
              {[
                "AI-powered workspace",
                "Unlimited team members",
                "5GB free storage",
                "All core features included",
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-[#10B981]/20 flex items-center justify-center">
                    <Check className="h-3.5 w-3.5 text-[#10B981]" />
                  </div>
                  <span className="text-white">{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
