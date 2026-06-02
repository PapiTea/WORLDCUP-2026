"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  LayoutGrid,
  Trophy,
  Users,
  Award,
  ShieldCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/ThemeToggle"
import { useAuth } from "@/components/AuthGate"

const publicNavItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Picks", href: "/predictions", icon: Trophy },
  { name: "Groups", href: "/groups", icon: LayoutGrid },
  { name: "Social", href: "/pools", icon: Users },
  { name: "Leaderboard", href: "/leaderboard", icon: Award },
]

const adminNavItem = {
  name: "Admin",
  href: "/admin",
  icon: ShieldCheck,
}

type NavItem = (typeof publicNavItems)[number] | typeof adminNavItem

export function BottomNav() {
  const pathname = usePathname()
  const { isAdmin } = useAuth()

  const navItems: NavItem[] = isAdmin
    ? [...publicNavItems, adminNavItem]
    : publicNavItems

  return (
    <>
      <div className="fixed right-4 top-4 z-50 md:hidden">
        <ThemeToggle />
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-background/85 backdrop-blur-xl pb-safe md:hidden">
        <div className="flex h-16 items-center justify-around px-2">
          {navItems.slice(0, 5).map((item) => (
            <NavLink
              key={item.name}
              item={item}
              active={pathname === item.href}
            />
          ))}
        </div>
      </nav>

      <aside className="fixed bottom-0 left-0 top-0 z-50 hidden w-[88px] flex-col border-r border-white/5 bg-background/85 px-2 py-5 backdrop-blur-xl md:flex">
       <Link
  href="/"
  className="mb-6 flex flex-col items-center gap-1 rounded-2xl p-2 text-center text-primary"
>
  <img
    src="/flags/world-cup-logo-light.png"
    alt="World Cup 2026"
    className="h-16 w-16 object-contain dark:hidden"
  />

  <img
    src="/flags/world-cup-logo-dark.png"
    alt="World Cup 2026"
    className="hidden h-16 w-16 object-contain dark:block"
  />
</Link>

        <div className="flex flex-1 flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-2xl px-1 py-3 text-center transition-all",
                  isActive
                    ? "bg-primary/15 text-primary shadow-sm shadow-primary/10"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                <Icon size={20} strokeWidth={isActive ? 2.6 : 2} />
                <span className="text-[9px] font-bold uppercase tracking-tight">
                  {item.name}
                </span>
              </Link>
            )
          })}
        </div>

        <div className="mt-4 flex justify-center">
          <ThemeToggle />
        </div>
      </aside>
    </>
  )
}

function NavLink({
  item,
  active,
}: {
  item: NavItem
  active: boolean
}) {
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-all duration-200",
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <div
        className={cn(
          "rounded-xl p-1.5 transition-all duration-300",
          active && "bg-primary/10"
        )}
      >
        <Icon size={20} strokeWidth={active ? 2.5 : 2} />
      </div>

      <span className="text-[10px] font-medium uppercase tracking-tight">
        {item.name}
      </span>
    </Link>
  )
}
