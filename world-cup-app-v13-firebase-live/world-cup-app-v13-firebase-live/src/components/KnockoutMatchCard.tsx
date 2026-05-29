"use client"

import { useEffect, useState } from "react"
import type { KnockoutFixture, Team } from "@/lib/mock-data"
import { getTeamById } from "@/lib/mock-data"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TeamFlag } from "@/components/TeamFlag"
import { HostBadge } from "@/components/HostBadge"
import { useAuth } from "@/components/AuthGate"
import { saveMatchPrediction, subscribeKnockoutSetup, subscribeResults } from "@/lib/firebase-service"
import { CheckCircle2, Lock, Timer } from "lucide-react"

type Score = { home: number | ""; away: number | "" }

function readSlot(slotId: string): Team | null {
  if (typeof window === "undefined") return null
  return getTeamById(window.localStorage.getItem(`wc-ko-slot-${slotId}`))
}

export function KnockoutMatchCard({ fixture }: { fixture: KnockoutFixture }) {
  const { user } = useAuth()
  const [homeTeam, setHomeTeam] = useState<Team | null>(null)
  const [awayTeam, setAwayTeam] = useState<Team | null>(null)
  const [score, setScore] = useState<Score>({ home: "", away: "" })
  const [saved, setSaved] = useState(false)
  const [hasResult, setHasResult] = useState(false)

  useEffect(() => {
    const refresh = () => {
      setHomeTeam(readSlot(fixture.homeSlot))
      setAwayTeam(readSlot(fixture.awaySlot))
      const rawPick = window.localStorage.getItem(`wc-ko-pick-${fixture.id}`)
      if (rawPick) {
        try {
          const parsed = JSON.parse(rawPick)
          setScore({ home: parsed.home ?? "", away: parsed.away ?? "" })
          setSaved(true)
        } catch {}
      }
      setHasResult(Boolean(window.localStorage.getItem(`wc-ko-result-${fixture.id}`)))
    }
    refresh()
    window.addEventListener("storage", refresh)
    window.addEventListener("focus", refresh)
    window.addEventListener("wc-knockout-updated", refresh)
    const unsubSetup = subscribeKnockoutSetup(({ slots }) => {
      setHomeTeam(getTeamById(slots[fixture.homeSlot]) || null)
      setAwayTeam(getTeamById(slots[fixture.awaySlot]) || null)
    })
    const unsubResults = subscribeResults((results) => setHasResult(Boolean(results[`ko_${fixture.id}`])))
    return () => {
      window.removeEventListener("storage", refresh)
      window.removeEventListener("focus", refresh)
      window.removeEventListener("wc-knockout-updated", refresh)
      unsubSetup()
      unsubResults()
    }
  }, [fixture.id, fixture.homeSlot, fixture.awaySlot])

  const ready = Boolean(homeTeam && awayTeam)

  const save = async () => {
    if (!ready || score.home === "" || score.away === "") return
    const pick = { home: Number(score.home), away: Number(score.away) }
    window.localStorage.setItem(`wc-ko-pick-${fixture.id}`, JSON.stringify(pick))
    if (user) await saveMatchPrediction(user.uid, fixture.id, "knockout", pick)
    setSaved(true)
  }

  return (
    <Card className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-card/75 p-4 shadow-xl backdrop-blur sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Badge variant="outline" className="rounded-full border-primary/30 bg-primary/10 px-3 py-1 text-xs font-black text-primary">
            {fixture.roundName}
          </Badge>
          <span className="text-xs font-black text-muted-foreground">M{fixture.matchNumber}</span>
          {saved && <span className="flex items-center gap-1 text-xs font-bold text-primary"><CheckCircle2 size={13} /> Saved</span>}
        </div>
        <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-muted-foreground">
          <Timer size={14} /> {fixture.dateLabel} · {fixture.ukKickoff}
        </div>
      </div>

      <HostBadge location={fixture.location} venue={fixture.venue} compact className="mb-4 justify-center py-2 text-[10px] sm:text-[11px]" />

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2 sm:gap-3">
        <KoTeam team={homeTeam} placeholder={fixture.homeSlot} />
        <div className="mt-5 flex shrink-0 items-center justify-center gap-1.5 rounded-2xl bg-background/55 p-1.5 ring-1 ring-border sm:mt-6 sm:gap-2 sm:p-2">
          <Input type="number" inputMode="numeric" placeholder="-" value={score.home} onChange={(e) => setScore(prev => ({ ...prev, home: e.target.value === "" ? "" : Number(e.target.value) }))} disabled={!ready} className="h-10 w-10 rounded-xl border-border bg-card p-0 text-center text-base font-black sm:h-11 sm:w-12 sm:text-lg" />
          <span className="font-black text-muted-foreground">:</span>
          <Input type="number" inputMode="numeric" placeholder="-" value={score.away} onChange={(e) => setScore(prev => ({ ...prev, away: e.target.value === "" ? "" : Number(e.target.value) }))} disabled={!ready} className="h-10 w-10 rounded-xl border-border bg-card p-0 text-center text-base font-black sm:h-11 sm:w-12 sm:text-lg" />
        </div>
        <KoTeam team={awayTeam} placeholder={fixture.awaySlot} />
      </div>

      {!ready ? (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-background/35 px-3 py-3 text-center text-xs font-bold text-muted-foreground">
          <Lock size={14} /> Waiting for admin to assign teams to this tie.
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button size="sm" className="h-11 rounded-2xl font-black" onClick={save} disabled={score.home === "" || score.away === ""}>Save score</Button>
          <div className="flex items-center justify-center rounded-2xl bg-muted/50 px-2 text-center text-[11px] font-bold text-muted-foreground">
            {hasResult ? "Final result added" : "Admin result pending"}
          </div>
        </div>
      )}
    </Card>
  )
}

function KoTeam({ team, placeholder }: { team: Team | null; placeholder: string }) {
  if (!team) {
    return (
      <div className="min-w-0 text-center">
        <div className="mx-auto flex w-full min-w-0 flex-col items-center rounded-3xl bg-background/20 px-1.5 py-2 ring-1 ring-white/5 sm:px-2">
          <div className="flex h-12 w-16 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 text-[10px] font-black text-muted-foreground sm:h-14 sm:w-20">TBC</div>
          <div className="mt-2 min-h-[2rem] text-[10px] font-black leading-tight text-muted-foreground sm:text-xs">{placeholder}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-w-0 text-center">
      <div className="mx-auto flex w-full min-w-0 flex-col items-center rounded-3xl bg-background/20 px-1.5 py-2 ring-1 ring-white/5 sm:px-2">
        <TeamFlag team={team} className="h-12 w-16 rounded-2xl object-cover sm:h-14 sm:w-20" />
        <div className="mt-2 w-full min-w-0">
          <div className="mx-auto line-clamp-2 min-h-[2rem] max-w-full px-1 text-center text-[10px] font-black leading-tight text-foreground sm:text-xs" title={team.name}>{team.name}</div>
          <div className="mt-1 truncate text-[9px] font-black uppercase tracking-wider text-muted-foreground sm:text-[10px]" title={team.code}>{team.code}</div>
        </div>
      </div>
    </div>
  )
}
