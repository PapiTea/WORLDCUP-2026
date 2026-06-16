"use client"

import { useEffect, useRef, useState } from "react"
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
import { scoreMatchPick } from "@/lib/scoring"
import {
  saveMatchPrediction,
  subscribeUserSingleMatchPrediction,
  type Score,
} from "@/lib/firebase-service"

interface MatchCardProps {
  match: Match
  liveResult?: Score | null
  onSave?: (prediction: {
    home: number
    away: number
    confidence: boolean
  }) => void
}

const CONFIDENCE_LIMIT = 3
const CONFIDENCE_KEY = "wc-confidence-picks"
const CONFIDENCE_EVENT = "wc-confidence-updated"

type ScoreState = {
  homeScore: string
  awayScore: string
  saved: boolean
}

function readConfidenceIds(): string[] {
  if (typeof window === "undefined") return []

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(CONFIDENCE_KEY) || "[]"
    )

    return Array.isArray(parsed)
      ? Array.from(new Set(parsed.map(String))).slice(0, CONFIDENCE_LIMIT)
      : []
  } catch {
    return []
  }
}

function writeConfidenceIds(ids: string[]) {
  if (typeof window === "undefined") return

  const clean = Array.from(new Set(ids.filter(Boolean))).slice(
    0,
    CONFIDENCE_LIMIT
  )

  window.localStorage.setItem(CONFIDENCE_KEY, JSON.stringify(clean))
  window.dispatchEvent(new CustomEvent(CONFIDENCE_EVENT, { detail: clean }))
}

export function MatchCard({ match, liveResult = null, onSave }: MatchCardProps) {
  const { user } = useAuth()

  const [homeScore, setHomeScore] = useState("")
  const [awayScore, setAwayScore] = useState("")
  const [saved, setSaved] = useState(false)
  const [formattedDate, setFormattedDate] = useState<string | null>(null)
  const [confidenceIds, setConfidenceIds] = useState<string[]>([])
  const [limitMessage, setLimitMessage] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const [showBreakdown, setShowBreakdown] = useState(false)


  const scoreRef = useRef<ScoreState>({
    homeScore: "",
    awayScore: "",
    saved: false,
  })

  const setScoreState = (next: Partial<ScoreState>) => {
    scoreRef.current = { ...scoreRef.current, ...next }

    if (typeof next.homeScore !== "undefined") setHomeScore(next.homeScore)
    if (typeof next.awayScore !== "undefined") setAwayScore(next.awayScore)
    if (typeof next.saved !== "undefined") setSaved(next.saved)
  }

  const refreshConfidence = () => {
    setConfidenceIds(readConfidenceIds())
  }

  const kickoffTime = new Date(match.kickoff)

const currentActual =
  typeof window !== "undefined"
    ? window.localStorage.getItem(`wc-result-${match.id}`)
    : null

const hasResult = Boolean(currentActual || liveResult)
const isLive = liveResult?.status === "LIVE"

const isLocked =
  now >= kickoffTime ||
  hasResult ||
  match.status === "FINISHED" ||
  match.status === "LIVE"

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date())
    }, 30000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
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
  }, [match.kickoff])

  useEffect(() => {
    const savedPick = window.localStorage.getItem(`wc-match-${match.id}`)

if (savedPick) {
  try {
    const pick = JSON.parse(savedPick)

    setScoreState({
      homeScore: pick.home === undefined ? "" : String(pick.home),
      awayScore: pick.away === undefined ? "" : String(pick.away),
      saved: true,
    })


  } catch {}
} else {
      setScoreState({
        homeScore: "",
        awayScore: "",
        saved: false,
      })
    }

    refreshConfidence()

    const onConfidenceUpdate = () => refreshConfidence()

    window.addEventListener(CONFIDENCE_EVENT, onConfidenceUpdate)
    window.addEventListener("storage", onConfidenceUpdate)
    window.addEventListener("focus", onConfidenceUpdate)

    return () => {
      window.removeEventListener(CONFIDENCE_EVENT, onConfidenceUpdate)
      window.removeEventListener("storage", onConfidenceUpdate)
      window.removeEventListener("focus", onConfidenceUpdate)
    }
  }, [match.id, user])

useEffect(() => {
  if (!user) return

  const unsub = subscribeUserSingleMatchPrediction(
    user.uid,
    match.id,
    "group",
    (remote) => {
      if (!remote) return

      const nextHome = remote.home === undefined ? "" : String(remote.home)
      const nextAway = remote.away === undefined ? "" : String(remote.away)
      const current = scoreRef.current

      if (
        current.homeScore !== nextHome ||
        current.awayScore !== nextAway ||
        !current.saved
      ) {
        setScoreState({
          homeScore: nextHome,
          awayScore: nextAway,
          saved: true,
        })

        window.localStorage.setItem(
          `wc-match-${match.id}`,
          JSON.stringify({
            home: remote.home,
            away: remote.away,
            confidence: remote.confidence === true,
          })
        )
      }

const ids = readConfidenceIds()

if (remote.confidence === true) {
  if (!ids.includes(match.id)) {
    writeConfidenceIds([...ids, match.id])
  }
} else {
  writeConfidenceIds(ids.filter((id) => id !== match.id))
}
    })

    return () => unsub()
  }, [user, match.id])
const actualResult =
  liveResult &&
  typeof liveResult.home === "number" &&
  typeof liveResult.away === "number"
    ? {
        home: liveResult.home,
        away: liveResult.away,
      }
    : null

const userPick =
  homeScore !== "" && awayScore !== ""
    ? {
        home: Number(homeScore),
        away: Number(awayScore),
        confidence: confidenceIds.includes(match.id),
      }
    : null

const matchScore = scoreMatchPick(userPick, actualResult)
  const isConfidencePick = confidenceIds.includes(match.id)
  const confidenceUsed = confidenceIds.length
  const confidenceLimitReached =
    confidenceUsed >= CONFIDENCE_LIMIT && !isConfidencePick

  const persistCurrentScore = async (confidenceOverride?: boolean) => {
    if (isLocked) return

    const { homeScore: h, awayScore: a } = scoreRef.current

    if (h === "" || a === "") return

    const pick = {
      home: Number(h),
      away: Number(a),
      confidence:
        confidenceOverride ?? readConfidenceIds().includes(match.id),
    }

    window.localStorage.setItem(`wc-match-${match.id}`, JSON.stringify(pick))

    if (user) {
      await saveMatchPrediction(user.uid, match.id, "group", pick)
    }

    setScoreState({ saved: true })
    onSave?.(pick)
  }

  const handleConfidenceToggle = async () => {
    if (isLocked) return

    setLimitMessage(false)

    if (isConfidencePick) {
      const next = confidenceIds.filter((id) => id !== match.id)

      setConfidenceIds(next)
      writeConfidenceIds(next)
      await persistCurrentScore(false)

      return
    }

    if (confidenceIds.length >= CONFIDENCE_LIMIT) {
      setLimitMessage(true)
      return
    }

    const next = [...confidenceIds, match.id]

    setConfidenceIds(next)
    writeConfidenceIds(next)
    await persistCurrentScore(true)
  }

  const handleSave = async () => {
    if (isLocked) return
    await persistCurrentScore()
  }

  const onHomeChange = (value: string) => {
    if (isLocked) return
    setScoreState({ homeScore: value, saved: false })
  }

  const onAwayChange = (value: string) => {
    if (isLocked) return
    setScoreState({ awayScore: value, saved: false })
  }
if (hasResult) {
  return (
   <Card className="rounded-[1.5rem] border border-white/10 bg-card/75 p-4 shadow-lg">
 <div className="mb-3 flex items-center justify-between gap-2">
  <Badge
    variant="outline"
    className="rounded-full border-primary/30 bg-primary/10 px-3 py-1 text-xs font-black text-primary"
  >
    Group {match.group}
  </Badge>

  <div className="flex items-center gap-2">
    <span className="text-xs font-black uppercase text-primary">
      Full Time
    </span>

    <button
      type="button"
      onClick={() => setShowBreakdown(true)}
      className="rounded-full bg-primary px-3 py-1 text-xs font-black text-primary-foreground shadow-lg shadow-primary/20"
    >
      {matchScore.total > 0 ? "+" : ""}
      {matchScore.total} pts
    </button>
  </div>
</div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex items-center gap-2">
          <TeamFlag
            team={match.homeTeam}
            className="h-8 w-10 rounded-lg object-cover"
          />

          <div>
            <div className="text-sm font-black">
              {match.homeTeam.name}
            </div>

            <div className="text-[10px] font-black uppercase text-muted-foreground">
              {match.homeTeam.code}
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="text-2xl font-black">
            {liveResult?.home} - {liveResult?.away}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <div className="text-right">
            <div className="text-sm font-black">
              {match.awayTeam.name}
            </div>

            <div className="text-[10px] font-black uppercase text-muted-foreground">
              {match.awayTeam.code}
            </div>
          </div>

          <TeamFlag
            team={match.awayTeam}
            className="h-8 w-10 rounded-lg object-cover"
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs font-bold text-muted-foreground">
      <span>
  🎯 Your pick: {homeScore || "-"} - {awayScore || "-"}
</span>

        {isConfidencePick && (
          <span className="text-primary">
            ⚡ Confidence used
          </span>
        )}
      </div>
         {showBreakdown && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-background p-5 shadow-2xl">
            <div className="mb-4">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">
                Score breakdown
              </p>

              <h3 className="mt-1 font-headline text-2xl font-black">
                {match.homeTeam.name} v {match.awayTeam.name}
              </h3>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between rounded-2xl bg-muted/50 px-4 py-3">
                <span className="font-bold text-muted-foreground">
                  Your pick
                </span>
                <span className="font-black">
                  {homeScore || "-"} - {awayScore || "-"}
                </span>
              </div>

              <div className="flex justify-between rounded-2xl bg-muted/50 px-4 py-3">
                <span className="font-bold text-muted-foreground">
                  Actual result
                </span>
                <span className="font-black">
                  {actualResult?.home ?? "-"} - {actualResult?.away ?? "-"}
                </span>
              </div>

              <div className="flex justify-between rounded-2xl bg-muted/50 px-4 py-3">
                <span className="font-bold text-muted-foreground">
                  Base points
                </span>
                <span className="font-black">{matchScore.base}</span>
              </div>

              <div className="flex justify-between rounded-2xl bg-muted/50 px-4 py-3">
                <span className="font-bold text-muted-foreground">
                  Confidence
                </span>
                <span className="font-black">
                  {matchScore.confidenceBonus > 0 ? "+" : ""}
                  {matchScore.confidenceBonus}
                </span>
              </div>

              <div className="rounded-2xl border border-primary/30 bg-primary/10 px-4 py-4 text-center">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-primary">
                  Total
                </div>
                <div className="mt-1 text-4xl font-black text-primary">
                  {matchScore.total > 0 ? "+" : ""}
                  {matchScore.total}
                </div>
              </div>

              <div className="rounded-2xl bg-muted/40 px-4 py-3 text-xs font-bold text-muted-foreground">
                {matchScore.reason}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowBreakdown(false)}
              className="mt-5 h-11 w-full rounded-2xl bg-primary text-sm font-black text-primary-foreground"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </Card>
  )
}
  return (
    <Card className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-card/75 p-4 shadow-xl backdrop-blur transition hover:-translate-y-0.5 hover:shadow-2xl sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="rounded-full border-primary/30 bg-primary/10 px-3 py-1 text-xs font-black text-primary"
          >
            Group {match.group}
          </Badge>

          {saved && (
            <span className="flex items-center gap-1 text-xs font-bold text-primary">
              <CheckCircle2 size={13} /> Saved
            </span>
          )}

  {isLive ? (
  <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-1 text-[10px] font-black uppercase text-green-600 shadow-[0_0_14px_rgba(34,197,94,0.45)]">
    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
    Live {liveResult?.elapsed ? `${liveResult.elapsed}'` : ""}
  </span>
) : hasResult ? (
  <span className="text-[10px] font-black uppercase text-muted-foreground">
    Result added
  </span>
) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-muted-foreground">
          <Timer size={14} /> {formattedDate || "..."}
        </div>
      </div>

      <HostBadge
        location={match.location}
        venue={match.venue}
        compact
        className="mb-4 justify-center py-2 text-[10px] sm:text-[11px]"
      />

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2 sm:gap-3">
        <TeamBlock team={match.homeTeam} />

<div className="mt-5 flex shrink-0 flex-col items-center sm:mt-6">
  <div className="flex items-center justify-center gap-1.5 rounded-2xl bg-background/55 p-1.5 ring-1 ring-border sm:gap-2 sm:p-2">
    <Input
      type="number"
      inputMode="numeric"
      placeholder="-"
      value={homeScore}
      onChange={(event) => onHomeChange(event.target.value)}
      disabled={isLocked}
      className="h-10 w-10 rounded-xl border-border bg-card p-0 text-center text-base font-black sm:h-11 sm:w-12 sm:text-lg"
    />

    <span className="font-black text-muted-foreground">:</span>

    <Input
      type="number"
      inputMode="numeric"
      placeholder="-"
      value={awayScore}
      onChange={(event) => onAwayChange(event.target.value)}
      disabled={isLocked}
      className="h-10 w-10 rounded-xl border-border bg-card p-0 text-center text-base font-black sm:h-11 sm:w-12 sm:text-lg"
    />
  </div>

  {liveResult && (
    <div className="mt-2 text-center text-xs font-black text-muted-foreground">
      Actual score: {liveResult.home} - {liveResult.away}
    </div>
  )}
</div>

        <TeamBlock team={match.awayTeam} />
      </div>

      {isLocked ? (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-background/35 px-3 py-3 text-center text-xs font-bold text-muted-foreground">
          <Lock size={14} />
          {now >= kickoffTime
            ? "Predictions locked — kick-off has passed."
            : "Predictions locked for this match."}
        </div>
      ) : (
        <div className="mt-4 space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              size="sm"
              variant={isConfidencePick ? "default" : "outline"}
              className={cn(
                "h-11 rounded-2xl font-black",
                isConfidencePick && "shadow-lg shadow-primary/20"
              )}
              onClick={handleConfidenceToggle}
              disabled={confidenceLimitReached}
            >
              {confidenceLimitReached ? (
                <Lock size={15} className="mr-1" />
              ) : (
                <Zap
                  size={15}
                  className="mr-1"
                  fill={isConfidencePick ? "currentColor" : "none"}
                />
              )}
              {isConfidencePick
                ? "Confidence picked"
                : confidenceLimitReached
                  ? "Limit reached"
                  : "Confidence x2"}
            </Button>

            <Button
              size="sm"
              className="h-11 rounded-2xl font-black"
              onClick={handleSave}
              disabled={homeScore === "" || awayScore === ""}
            >
              Save score
            </Button>
          </div>

          <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-muted-foreground">
            <span className={confidenceUsed >= CONFIDENCE_LIMIT ? "text-primary" : ""}>
              {confidenceUsed}/{CONFIDENCE_LIMIT} confidence picks used
            </span>
            <span>Wrong confidence pick: -5 pts</span>
          </div>

          {limitMessage && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive">
              <AlertCircle size={14} /> You can only choose 3 confidence picks.
              Remove one first.
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
        <TeamFlag
          team={team}
          className="h-12 w-16 rounded-2xl object-cover sm:h-14 sm:w-20"
        />

        <div className="mt-2 w-full min-w-0">
          <div
            className="mx-auto line-clamp-2 min-h-[2rem] max-w-full px-1 text-center text-[10px] font-black leading-tight text-foreground sm:text-xs"
            title={team.name}
          >
            {team.name}
          </div>

          <div
            className="mt-1 truncate text-[9px] font-black uppercase tracking-wider text-muted-foreground sm:text-[10px]"
            title={team.code}
          >
            {team.code}
          </div>
        </div>
      </div>
    </div>
  )
}
