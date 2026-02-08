'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Menu } from 'lucide-react'

interface MobileSidebarProps {
  title: string
  subtitle?: string
  children: React.ReactNode
}

export function MobileSidebar({ title, subtitle, children }: MobileSidebarProps) {
  const [open, setOpen] = useState(false)

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
        <SheetContent side="left" className="w-72 p-0" onClick={() => setOpen(false)}>
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle>{title}</SheetTitle>
            {subtitle && (
              <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
            )}
          </SheetHeader>

          <nav className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
            {children}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  )
}
