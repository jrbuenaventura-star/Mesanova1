import Link from "next/link"
import { cn } from "@/lib/utils"

export interface AdminSectionTab {
  value: string
  label: string
}

interface AdminSectionTabsProps {
  basePath: string
  activeTab: string
  tabs: AdminSectionTab[]
}

export function AdminSectionTabs({ basePath, activeTab, tabs }: AdminSectionTabsProps) {
  return (
    <div className="inline-flex h-auto flex-wrap items-center gap-1 rounded-lg bg-muted p-1">
      {tabs.map((tab) => {
        const isActive = tab.value === activeTab
        return (
          <Link
            key={tab.value}
            href={`${basePath}?tab=${tab.value}`}
            className={cn(
              "inline-flex min-h-[40px] items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background/70 hover:text-foreground",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
