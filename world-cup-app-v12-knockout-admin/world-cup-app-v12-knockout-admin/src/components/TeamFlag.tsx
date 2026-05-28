"use client"

import { useState } from "react"
import type { Team } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

export function TeamFlag({ team, className }: { team: Team; className?: string }) {
  const [failed, setFailed] = useState(false)

  if (team.flagImage && !failed) {
    return (
      <img
        src={team.flagImage}
        alt={`${team.name} flag`}
        className={cn("inline-block shrink-0 rounded-md object-cover shadow-sm ring-1 ring-white/10", className || "h-6 w-9")}
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center rounded-md bg-muted text-lg ring-1 ring-border", className || "h-6 w-9")} aria-label={`${team.name} flag`}>
      {team.flag}
    </span>
  )
}
