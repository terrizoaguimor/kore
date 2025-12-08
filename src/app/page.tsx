import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import LandingPage from "@/components/marketing/landing-page"

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If user is authenticated, redirect to dashboard
  if (user) {
    redirect("/core")
  }

  // For non-authenticated users, show the landing page
  return <LandingPage />
}
