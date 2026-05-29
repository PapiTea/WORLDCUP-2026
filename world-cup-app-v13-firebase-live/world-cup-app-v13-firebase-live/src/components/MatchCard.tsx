"use client"

import { useEffect, useState } from "react"
import { Match } from "@/lib/mock-data"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Timer, Zap, CheckCircle2, AlertCircle, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { TeamFlag } from "@/components/TeamFlag"
import { HostBadge } from "@/components/HostBadge"
import { useAuth } from "@/components/AuthGate"
import { saveMatchPrediction } from "@/lib/firebase-service"

interface MatchCardProps {
  match: Match
  onSave?: (prediction: { home: number; away: number; confidence: boolean }) => void
}

const CONFIDENCE_LIMIT = 3
const CONFIDENCE_KEY = "wc-confidence-picks"
const CONFIDENCE_EVENT = "wc-confidence-updated"

function readConfidenceIds(): string[] {
  if (typeof window === "undefined") return []

  const ids = new Set<string>()
  const raw = window.localStorage.getItem(CONFIDENCE_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) parsed.forEach((id) => id && ids.add(String(id)))
    } catch {}
  }

  // Keep older saved predictions in sync, so old confidence picks still count.
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i)
    if (!key || !key.startsWith("wc-match-")) continue
    try {
      const pick = JSON.parse(window.localStorage.getItem(key) || "{}")
      if (pick?.confidence) ids.add(key.replace("wc-match-", ""))
    } catch {}
  }

  const clean = Array.from(ids).slice(0, CONFIDENCE_LIMIT)
  window.localStorage.setItem(CONFIDENCE_KEY, JSON.stringify(clean))
  return clean
}

function writeConfidenceIds(ids: string[]) {
  if (typeof window === "undefined") return
  const clean = Array.from(new Set(ids.filter(Boolean))).slice(0, CONFIDENCE_LIMIT)
  window.localStorage.setItem(CONFIDENCE_KEY, JSON.stringify(clean))

  // Also update any already-saved match pick so scoring uses the latest confidence state.
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i)
    if (!key || !key.startsWith("wc-match-")) continue
    try {
      const matchId = key.replace("wc-match-", "")
      const pick = JSON.parse(window.localStorage.getItem(key) || "{}")
      if (typeof pick.home !== "undefined" && typeof pick.away !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify({ ...pick, confidence: clean.includes(matchId) }))
      }
    } catch {}
  }

  window.dispatchEvent(new CustomEvent(CONFIDENCE_EVENT, { detail: clean }))
}

export function MatchCard({ match, onSave }: MatchCardProps) {
  const { user } = useAuth()
  const [homeScore, setHomeScore] = useState<string>("")
  const [awayScore, setAwayScore] = useState<string>("")
  const [saved, setSaved] = useState(false)
  const [formattedDate, setFormattedDate] = useState<string | null>(null)
  const [confidenceIds, setConfidenceIds] = useState<string[]>([])
  const [limitMessage, setLimitMessage] = useState(false)

  const refreshConfidence = () => setConfidenceIds(readConfidenceIds())

  useEffect(() => {
    const savedPick = window.localStorage.getItem(`wc-match-${match.id}`)
    if (savedPick) {
      try {
        const pick = JSON.parse(savedPick)
        setHomeScore(String(pick.home ?? ""))
        setAwayScore(String(pick.away ?? ""))
        setSaved(true)
      } catch {}
    }

    refreshConfidence()
    const onConfidenceUpdate = () => refreshConfidence()
    window.addEventListener(CONFIDENCE_EVENT, onConfidenceUpdate)
    window.addEventListener("storage", onConfidenceUpdate)
    window.addEventListener("focus", onConfidenceUpdate)

    setFormattedDate(
      new Date(match.kickoff).toLocaleString("en-GB", {
        timeZone: "Europe/London",
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    )

    return () => {
      window.removeEventListener(CONFIDENCE_EVENT, onConfidenceUpdate)
      window.removeEventListener("storage", onConfidenceUpdate)
      window.removeEventListener("focus", onConfidenceUpdate)
    }
  }, [match.id, match.kickoff])

  const isConfidencePick = confidenceIds.includes(match.id)
  const confidenceUsed = confidenceIds.length
  const confidenceLimitReached = confidenceUsed >= CONFIDENCE_LIMIT && !isConfidencePick
  const isLocked = match.status === "FINISHED" || match.status === "LIVE"
  const currentActual = typeof window !== "undefined" ? window.localStorage.getItem(`wc-result-${match.id}`) : null
  const hasResult = Boolean(currentActual)

  const handleConfidenceToggle = () => {
    setLimitMessage(false)

    if (isConfidencePick) {
      const next = confidenceIds.filter((id) => id !== match.id)
      setConfidenceIds(next)
      writeConfidenceIds(next)
      return
    }

    if (confidenceIds.length >= CONFIDENCE_LIMIT) {
      setLimitMessage(true)
      return
    }

    const next = [...confidenceIds, match.id]
    setConfidenceIds(next)
    writeConfidenceIds(next)
  }

  const handleSave = async () => {
    if (homeScore === "" || awayScore === "") return
    const confidence = readConfidenceIds().includes(match.id)
    const pick = { home: Number(homeScore), away: Number(awayScore), confidence }
    window.localStorage.setItem(`wc-match-${match.id}`, JSON.stringify(pick))
    if (user) await saveMatchPrediction(user.uid, match.id, "group", pick)
    setSaved(true)
    onSave?.(pick)
  }

  return (
    <Card className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-card/75 p-4 shadow-xl backdrop-blur transition hover:-translate-y-0.5 hover:shadow-2xl sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Badge variant="outline" className="rounded-full border-primary/30 bg-primary/10 px-3 py-1 text-xs font-black text-primary">
            Group {match.group}
          </Badge>
          {saved && <span className="flex items-center gap-1 text-xs font-bold text-primary"><CheckCircle2 size={13} /> Saved</span>}
          {hasResult && <span className="text-[10px] font-black uppercase text-muted-foreground">Result added</span>}
        </div>
        <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-muted-foreground">
          <Timer size={14} /> {formattedDate || "..."}
        </div>
      </div>

      <HostBadge location={match.location} venue={match.venue} compact className="mb-4 justify-center py-2 text-[10px] sm:text-[11px]" />

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2 sm:gap-3">
        <TeamBlock team={match.homeTeam} />
        <div className="mt-5 flex shrink-0 items-center justify-center gap-1.5 rounded-2xl bg-background/55 p-1.5 ring-1 ring-border sm:mt-6 sm:gap-2 sm:p-2">
          <Input
            type="number"
            inputMode="numeric"
            placeholder="-"
            value={homeScore}
            onChange={(e) => setHomeScore(e.target.value)}
            disabled={isLocked}
            className="h-10 w-10 rounded-xl border-border bg-card p-0 text-center text-base font-black sm:h-11 sm:w-12 sm:text-lg"
          />
          <span className="font-black text-muted-foreground">:</span>
          <Input
            type="number"
            inputMode="numeric"
            placeholder="-"
            value={awayScore}
            onChange={(e) => setAwayScore(e.target.value)}
            disabled={isLocked}
            className="h-10 w-10 rounded-xl border-border bg-card p-0 text-center text-base font-black sm:h-11 sm:w-12 sm:text-lg"
          />
        </div>
        <TeamBlock team={match.awayTeam} />
      </div>

      {!isLocked && (
        <div className="mt-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={isConfidencePick ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-11 rounded-2xl font-black",
                isConfidencePick && "shadow-[0_0_18px_hsl(var(--primary)/0.25)]",
                confidenceLimitReached && "cursor-not-allowed opacity-45"
              )}
              title="Pick up to 3 confidence matches. Correct confidence picks double your points; wrong confidence picks cost -5."
              onClick={handleConfidenceToggle}
              disabled={confidenceLimitReached}
            >
              {confidenceLimitReached ? <Lock size={15} className="mr-1" /> : <Zap size={15} className="mr-1" fill={isConfidencePick ? "currentColor" : "none"} />}
              {isConfidencePick ? "Confidence picked" : "Confidence x2"}
            </Button>
            <Button size="sm" className="h-11 rounded-2xl font-black" onClick={handleSave} disabled={homeScore === "" || awayScore === ""}>
              Save score
            </Button>
          </div>
          <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-muted-foreground">
            <span className={confidenceUsed >= CONFIDENCE_LIMIT ? "text-primary" : ""}>{confidenceUsed}/{CONFIDENCE_LIMIT} confidence picks used</span>
            <span>Wrong confidence pick: -5 pts</span>
          </div>
          {limitMessage && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive">
              <AlertCircle size={14} /> You can only choose 3 confidence picks. Remove one first.
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

function TeamBlock({ team }: { team: Match["homeTeam"] }) {
  return (
    <div className="min-w-0 text-center">
      <div className="mx-auto flex w-full min-w-0 flex-col items-center rounded-3xl bg-background/20 px-1.5 py-2 ring-1 ring-white/5 sm:px-2">
        <TeamFlag team={team} className="h-12 w-16 rounded-2xl object-cover sm:h-14 sm:w-20" />
        <div className="mt-2 w-full min-w-0">
          <div
            className="mx-auto line-clamp-2 min-h-[2rem] max-w-full px-1 text-center text-[10px] font-black leading-tight text-foreground sm:text-xs"
            title={team.name}
          >
            {team.name}
          </div>
          <div className="mt-1 truncate text-[9px] font-black uppercase tracking-wider text-muted-foreground sm:text-[10px]" title={team.code}>
            {team.code}
          </div>
        </div>
      </div>
    </div>
  )
}
