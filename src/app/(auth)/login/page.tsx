"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { motion } from "motion/react"
import { useTheme } from "next-themes"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { KoreLogo } from "@/components/brand/kore-logo"
import { NeuralNetworkField } from "@/components/effects/neural-network-field"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { LanguageSwitcher } from "@/components/ui/language-switcher"
import { createClient } from "@/lib/supabase/client"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/core"
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const t = useTranslations()

  const loginSchema = z.object({
    email: z.string().email(t("auth.errors.invalidEmail")),
    password: z.string().min(6, t("auth.errors.passwordTooShort")),
  })

  type LoginFormData = z.infer<typeof loginSchema>

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success(t("auth.login.welcomeBack"))
      router.push(redirect)
      router.refresh()
    } catch {
      toast.error(t("errors.generic"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthLogin = async (provider: "google" | "github") => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
      },
    })
  }

  // Theme-aware colors - KORE By Socios Brand
  const particleColor = isDark ? "#0046E2" : "#0046E2"

  return (
    <div className="flex min-h-screen bg-background">
      {/* Theme and Language toggles */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      {/* Left side - Login form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16 xl:px-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mx-auto w-full max-w-md"
        >
          {/* Logo */}
          <div>
            <KoreLogo size="lg" color="primary" />
            <h2 className="mt-8 text-2xl font-bold tracking-tight text-foreground">
              {t("auth.login.title")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("auth.login.subtitle")}{" "}
              <Link
                href="/register"
                className="font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                {t("auth.login.cta")}
              </Link>
            </p>
          </div>

          {/* Form */}
          <div className="mt-10">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-foreground"
                >
                  {t("auth.login.email")}
                </label>
                <div className="mt-2">
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    disabled={isLoading}
                    {...register("email")}
                    className="block w-full rounded-lg bg-card px-4 py-3 text-sm text-foreground border border-border placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50"
                    placeholder={t("auth.login.emailPlaceholder")}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-foreground"
                >
                  {t("auth.login.password")}
                </label>
                <div className="relative mt-2">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    disabled={isLoading}
                    {...register("password")}
                    className="block w-full rounded-lg bg-card px-4 py-3 text-sm text-foreground border border-border placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50 pr-12"
                    placeholder={t("auth.login.passwordPlaceholder")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                  {errors.password && (
                    <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>
              </div>

              {/* Remember me & Forgot password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-border bg-card text-primary focus:ring-primary/50"
                  />
                  <label
                    htmlFor="remember-me"
                    className="text-sm text-muted-foreground"
                  >
                    {t("auth.login.rememberMe")}
                  </label>
                </div>

                <Link
                  href="/forgot-password"
                  className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  {t("auth.login.forgotPassword")}
                </Link>
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-primary text-primary-foreground font-semibold hover:bg-primary/90 shadow-[0_0_30px_rgba(0,70,226,0.3)] hover:shadow-[0_0_40px_rgba(0,70,226,0.5)] transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {t("auth.login.signingIn")}
                  </>
                ) : (
                  t("auth.login.signIn")
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-background px-4 text-muted-foreground">
                    {t("auth.login.orContinueWith")}
                  </span>
                </div>
              </div>

              {/* OAuth buttons */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleOAuthLogin("google")}
                  className="flex w-full items-center justify-center gap-3 rounded-lg bg-card px-4 py-3 text-sm font-semibold text-foreground border border-border hover:bg-secondary hover:border-border transition-all"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                    <path
                      d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                      fill="#EA4335"
                    />
                    <path
                      d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                      fill="#4285F4"
                    />
                    <path
                      d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
                      fill="#34A853"
                    />
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOAuthLogin("github")}
                  className="flex w-full items-center justify-center gap-3 rounded-lg bg-card px-4 py-3 text-sm font-semibold text-foreground border border-border hover:bg-secondary hover:border-border transition-all"
                >
                  <svg
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path
                      d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                      clipRule="evenodd"
                      fillRule="evenodd"
                    />
                  </svg>
                  <span>GitHub</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right side - Visual panel with interactive particles */}
      <div className="relative hidden lg:block lg:w-1/2 bg-card overflow-hidden">
        {/* Interactive neural network field */}
        <NeuralNetworkField
          particleCount={500}
          hubCount={15}
        />

        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(${isDark ? 'rgba(0, 70, 226, 0.03)' : 'rgba(0, 70, 226, 0.05)'} 1px, transparent 1px),
              linear-gradient(90deg, ${isDark ? 'rgba(0, 70, 226, 0.03)' : 'rgba(0, 70, 226, 0.05)'} 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}
        />

        {/* Central glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="w-[400px] h-[400px] rounded-full blur-[120px]"
            style={{ backgroundColor: isDark ? 'rgba(0, 70, 226, 0.05)' : 'rgba(0, 70, 226, 0.08)' }}
          />
        </div>

        {/* Large logo in center */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            {/* Outer glow ring */}
            <div
              className="absolute inset-0 rounded-full blur-xl scale-150"
              style={{ backgroundColor: isDark ? 'rgba(0, 70, 226, 0.2)' : 'rgba(0, 70, 226, 0.25)' }}
            />

            {/* Logo isotipo large */}
            <svg
              width="200"
              height="200"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="relative z-10"
            >
              <circle
                cx="24" cy="24" r="22"
                fill={particleColor}
                fillOpacity="0.15"
                stroke={particleColor}
                strokeWidth="1"
              />
              <path
                d="M18 12L18 36"
                stroke={particleColor}
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M18 24L30 12"
                stroke={particleColor}
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M18 24L30 36"
                stroke={particleColor}
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="24" cy="24" r="3" fill={particleColor} />
            </svg>
          </motion.div>
        </div>

        {/* Tagline at bottom */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="absolute bottom-16 left-16 right-16 pointer-events-none z-10"
        >
          <h3 className="text-3xl font-bold text-foreground mb-1">
            {t("landing.tagline")}
          </h3>
          <p className="text-lg font-medium text-primary mb-3">
            {t("landing.subtitle")}
          </p>
          <p className="text-muted-foreground">
            {t("landing.description")}
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const t = useTranslations()

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-muted-foreground">{t("common.loading")}</span>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
