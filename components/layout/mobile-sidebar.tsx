'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet'
import { Menu } from 'lucide-react'

export interface SidebarNavItem {
  href: string
  label: string
  icon: React.ElementType
  separator?: boolean
}

interface MobileSidebarProps {
  title: string
  subtitle?: string
  items: SidebarNavItem[]
  alertContent?: React.ReactNode
}

export function MobileSidebar({ title, subtitle, items, alertContent }: MobileSidebarProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center gap-3 border-b bg-background px-4 py-3">
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Abrir menú">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <h2 className="font-semibold text-sm truncate">{title}</h2>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Sheet drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle>{title}</SheetTitle>
            {subtitle && (
              <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
            )}
          </SheetHeader>

          {alertContent && (
            <div className="px-4 pt-3">
              {alertContent}
            </div>
          )}

          <nav className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
            {items.map((item, i) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <div key={item.href}>
                  {item.separator && i > 0 && <div className="my-3 border-t" />}
                  <SheetClose asChild>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                        isActive
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-accent text-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {item.label}
                    </Link>
                  </SheetClose>
                </div>
              )
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  )
}
