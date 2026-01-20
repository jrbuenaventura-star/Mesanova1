import Link from "next/link"
import { MesanovaLogo } from "@/components/mesanova-logo"
import { SiteNav } from "@/components/site-nav"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-7xl mx-auto flex h-16 items-center px-4 sm:px-6 md:px-8">
        <Link href="/" className="flex items-center mr-2 md:mr-8 shrink-0">
          <MesanovaLogo className="h-10 w-auto" />
        </Link>

        <SiteNav />
      </div>
    </header>
  )
}
