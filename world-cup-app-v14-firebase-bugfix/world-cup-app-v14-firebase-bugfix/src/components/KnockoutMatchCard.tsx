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
import { scoreMatchPick } from "@/lib/scoring"
import {
  saveMatchPrediction,
  type MatchPrediction,
  type Score as ResultScore,
} from "@/lib/firebase-service"
import { CheckCircle2, Lock, Timer } from "lucide-react"

type Score = { home: number | ""; away: number | "" }

function readSlot(slotId: string): Team | null {
  if (typeof window === "undefined") return null
  return getTeamById(window.localStorage.getItem(`wc-ko-slot-${slotId}`))
}

export function KnockoutMatchCard({
  fixture,
  slots,
  liveResult,
  savedPrediction,
}: {
  fixture: KnockoutFixture
  slots: Record<string, string>
  liveResult?: ResultScore | null
  savedPrediction?: MatchPrediction | null
}) {
  const { user } = useAuth()

  const [homeTeam, setHomeTeam] = useState<Team | null>(null)
  const [awayTeam, setAwayTeam] = useState<Team | null>(null)
  const [score, setScore] = useState<Score>({ home: "", away: "" })
  const [saved, setSaved] = useState(false)
  const [confidencePicked, setConfidencePicked] = useState(false)
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [now, setNow] = useState(() => new Date())

  const actualResult =
    liveResult &&
    typeof liveResult.home === "number" &&
    typeof liveResult.away === "number"
      ? {
          home: liveResult.home,
          away: liveResult.away,
          decidedBy: liveResult.decidedBy,
          winnerSide: liveResult.winnerSide,
          winnerTeamId: liveResult.winnerTeamId,
        }
      : null

  const hasResult = Boolean(actualResult)
  const kickoffTime = new Date(fixture.kickoff)
  const isLocked = now >= kickoffTime || hasResult
  const ready = Boolean(homeTeam && awayTeam)

  const userPick =
    score.home !== "" && score.away !== ""
      ? {
          home: Number(score.home),
          away: Number(score.away),
          confidence: confidencePicked,
        }
      : null

  const matchScore = scoreMatchPick(userPick, actualResult)

  useEffect(() => {
    setHomeTeam(getTeamById(slots[fixture.homeSlot]) || readSlot(fixture.homeSlot))
    setAwayTeam(getTeamById(slots[fixture.awaySlot]) || readSlot(fixture.awaySlot))
  }, [slots, fixture.homeSlot, fixture.awaySlot])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date())
    }, 30000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const rawPick = window.localStorage.getItem(`wc-ko-pick-${fixture.id}`)

    if (rawPick) {
      try {
        const parsed = JSON.parse(rawPick)
        setScore({ home: parsed.home ?? "", away: parsed.away ?? "" })
        setConfidencePicked(parsed.confidence === true)
        setSaved(true)
      } catch {}
    }
  }, [fixture.id])

  useEffect(() => {
    if (!savedPrediction) return

    setScore({
      home: savedPrediction.home ?? "",
      away: savedPrediction.away ?? "",
    })

    setConfidencePicked(savedPrediction.confidence === true)
    setSaved(true)

    window.localStorage.setItem(
      `wc-ko-pick-${fixture.id}`,
      JSON.stringify({
        home: savedPrediction.home,
        away: savedPrediction.away,
        confidence: savedPrediction.confidence === true,
      })
    )
  }, [savedPrediction, fixture.id])

  const save = async () => {
    if (isLocked) return
    if (!ready || score.home === "" || score.away === "") return

    const pick = {
      home: Number(score.home),
      away: Number(score.away),
      confidence: confidencePicked,
    }

    window.localStorage.setItem(`wc-ko-pick-${fixture.id}`, JSON.stringify(pick))

    if (user) {
      await saveMatchPrediction(user.uid, fixture.id, "knockout", pick)
    }

    setSaved(true)
  }

  if (hasResult && ready && actualResult && homeTeam && awayTeam) {
    return (
      <Card className="rounded-[1.5rem] border border-white/10 bg-card/75 p-4 shadow-lg">
        <div className="mb-3 flex items-center justify-between gap-2">
          <Badge
            variant="outline"
            className="rounded-full border-primary/30 bg-primary/10 px-3 py-1 text-xs font-black text-primary"
          >
            {fixture.roundName}
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
            <TeamFlag team={homeTeam} className="h-8 w-10 rounded-lg object-cover" />
            <div>
              <div className="text-sm font-black">{homeTeam.name}</div>
              <div className="text-[10px] font-black uppercase text-muted-foreground">
                {homeTeam.code}
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-black">
              {actualResult.home} - {actualResult.away}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <div className="text-right">
              <div className="text-sm font-black">{awayTeam.name}</div>
              <div className="text-[10px] font-black uppercase text-muted-foreground">
                {awayTeam.code}
              </div>
            </div>
            <TeamFlag team={awayTeam} className="h-8 w-10 rounded-lg object-cover" />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs font-bold text-muted-foreground">
          <span>
            🎯 Your pick: {score.home || "-"} - {score.away || "-"}
          </span>

          {confidencePicked && <span className="text-primary">⚡ Confidence used</span>}
        </div>

        {showBreakdown && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-background p-5 shadow-2xl">
              <div className="mb-4">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">
                  Score breakdown
                </p>

                <h3 className="mt-1 font-headline text-2xl font-black">
                  {homeTeam.name} v {awayTeam.name}
                </h3>
              </div>

              <div className="space-y-3 text-sm">
                <BreakdownRow label="Your pick" value={`${score.home || "-"} - ${score.away || "-"}`} />
                <BreakdownRow label="Actual result" value={`${actualResult.home} - ${actualResult.away}`} />
                <BreakdownRow label="Base points" value={String(matchScore.base)} />
                <BreakdownRow
                  label="Confidence"
                  value={
                    confidencePicked
                      ? `${matchScore.confidenceBonus > 0 ? "+" : ""}${matchScore.confidenceBonus}`
                      : "Not used"
                  }
                />

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
    <Card className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-card/75 p-4 shadow-xl backdrop-blur sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="rounded-full border-primary/30 bg-primary/10 px-3 py-1 text-xs font-black text-primary"
          >
            {fixture.roundName}
          </Badge>

          <span className="text-xs font-black text-muted-foreground">
            M{fixture.matchNumber}
          </span>

          {saved && (
            <span className="flex items-center gap-1 text-xs font-bold text-primary">
              <CheckCircle2 size={13} /> Saved
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-muted-foreground">
          <Timer size={14} /> {fixture.dateLabel} · {fixture.ukKickoff}
        </div>
      </div>

      <HostBadge
        location={fixture.location}
        venue={fixture.venue}
        compact
        className="mb-4 justify-center py-2 text-[10px] sm:text-[11px]"
      />

      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2 sm:gap-3">
        <KoTeam team={homeTeam} placeholder={fixture.homeSlot} />

        <div className="mt-5 flex shrink-0 items-center justify-center gap-1.5 rounded-2xl bg-background/55 p-1.5 ring-1 ring-border sm:mt-6 sm:gap-2 sm:p-2">
          <Input
            type="number"
            inputMode="numeric"
            placeholder="-"
            value={score.home}
            onChange={(event) =>
              setScore((prev) => ({
                ...prev,
                home: event.target.value === "" ? "" : Number(event.target.value),
              }))
            }
            disabled={!ready || isLocked}
            className="h-10 w-10 rounded-xl border-border bg-card p-0 text-center text-base font-black sm:h-11 sm:w-12 sm:text-lg"
          />

          <span className="font-black text-muted-foreground">:</span>

          <Input
            type="number"
            inputMode="numeric"
            placeholder="-"
            value={score.away}
            onChange={(event) =>
              setScore((prev) => ({
                ...prev,
                away: event.target.value === "" ? "" : Number(event.target.value),
              }))
            }
            disabled={!ready || isLocked}
            className="h-10 w-10 rounded-xl border-border bg-card p-0 text-center text-base font-black sm:h-11 sm:w-12 sm:text-lg"
          />
        </div>

        <KoTeam team={awayTeam} placeholder={fixture.awaySlot} />
      </div>

      {!ready ? (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-background/35 px-3 py-3 text-center text-xs font-bold text-muted-foreground">
          <Lock size={14} /> Waiting for admin to assign teams to this tie.
        </div>
      ) : (
        <div className="mt-4 space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              size="sm"
              variant={confidencePicked ? "default" : "outline"}
              className="h-11 rounded-2xl font-black"
              onClick={() => setConfidencePicked((current) => !current)}
              disabled={isLocked}
            >
              ⚡ {confidencePicked ? "Confidence picked" : "Confidence x2"}
            </Button>

            <Button
              size="sm"
              className="h-11 rounded-2xl font-black"
              onClick={save}
              disabled={score.home === "" || score.away === "" || isLocked}
            >
              Save score
            </Button>
          </div>

          <div className="flex items-center justify-center rounded-2xl bg-muted/50 px-2 py-2 text-center text-[11px] font-bold text-muted-foreground">
            {hasResult
              ? "Final result added"
              : isLocked
                ? "Predictions locked — kick-off has passed."
                : "Admin result pending"}
          </div>
        </div>
      )}
    </Card>
  )
}

function BreakdownRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between rounded-2xl bg-muted/50 px-4 py-3">
      <span className="font-bold text-muted-foreground">{label}</span>
      <span className="font-black">{value}</span>
    </div>
  )
}

function KoTeam({ team, placeholder }: { team: Team | null; placeholder: string }) {
  if (!team) {
    return (
      <div className="min-w-0 text-center">
        <div className="mx-auto flex w-full min-w-0 flex-col items-center rounded-3xl bg-background/20 px-1.5 py-2 ring-1 ring-white/5 sm:px-2">
          <div className="flex h-12 w-16 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 text-[10px] font-black text-muted-foreground sm:h-14 sm:w-20">
            TBC
          </div>

          <div className="mt-2 min-h-[2rem] text-[10px] font-black leading-tight text-muted-foreground sm:text-xs">
            {placeholder}
          </div>
        </div>
      </div>
    )
  }

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
