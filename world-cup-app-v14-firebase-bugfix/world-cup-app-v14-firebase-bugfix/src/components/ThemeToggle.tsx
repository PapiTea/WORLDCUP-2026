"use client"

import { Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const saved = window.localStorage.getItem('wc-theme') as 'light' | 'dark' | null
    if (saved) setTheme(saved)
  }, [])

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    window.localStorage.setItem('wc-theme', theme)
  }, [theme])

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-2 font-bold uppercase text-[10px] tracking-widest border border-border"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? (<> <Sun size={14} className="text-yellow-400" /> Day </>) : (<> <Moon size={14} className="text-slate-500" /> Night </>)}
    </Button>
  )
}
