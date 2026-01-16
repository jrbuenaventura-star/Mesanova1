import Link from "next/link"
import { MesanovaLogo } from "@/components/mesanova-logo"
import { createClient } from "@/lib/supabase/server"
import { SiteNav } from "@/components/site-nav"

export async function SiteHeader() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userProfile = null
  if (user) {
    const { data } = await supabase.from("user_profiles").select("full_name, role").eq("id", user.id).single()
    userProfile = data
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-7xl mx-auto flex h-16 items-center px-6 md:px-8">
        <Link href="/" className="flex items-center mr-8">
          <MesanovaLogo className="h-10 w-auto" />
        </Link>

        <SiteNav user={user} userProfile={userProfile} />
      </div>
    </header>
  )
}
