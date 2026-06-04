"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Clock, Trophy, X, Zap } from "lucide-react"
import { MATCHES } from "@/lib/mock-data"
import { useAuth } from "@/components/AuthGate"
import {
  subscribeTournamentWinner,
  subscribeUserMatchPredictions,
} from "@/lib/firebase-service"

const TOURNAMENT_LOCK_TIME = new Date("2026-06-11T19:00:00Z")
const MATCH_DAY_WARNING_WINDOW = 24 * 60 * 60 * 1000
const MATCH_FINAL_WARNING_WINDOW = 2 * 60 * 60 * 1000
const WINNER_WARNING_WINDOW = 24 * 60 * 60 * 1000

function formatTimeLeft(ms: number) {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

function getDismissedAlertIds() {
  if (typeof window === "undefined") return []

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem("wc-dismissed-deadline-alerts") || "[]"
    )

    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

function dismissAlert(id: string) {
  const current = getDismissedAlertIds()
  const next = Array.from(new Set([...current, id]))

  window.localStorage.setItem(
    "wc-dismissed-deadline-alerts",
    JSON.stringify(next)
  )
}

export function DeadlineAlerts() {
  const { user } = useAuth()

  const [now, setNow] = useState(() => new Date())
  const [winnerPick, setWinnerPick] = useState("")
  const [savedMatchIds, setSavedMatchIds] = useState<string[]>([])
  const [dismissedIds, setDismissedIds] = useState<string[]>([])

  useEffect(() => {
    setDismissedIds(getDismissedAlertIds())

    const timer = window.setInterval(() => {
      setNow(new Date())
    }, 30000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!user) return

    const unsubWinner = subscribeTournamentWinner(user.uid, (teamId) => {
      setWinnerPick(teamId || "")
    })

    const unsubPredictions = subscribeUserMatchPredictions(user.uid, (items) => {
      const ids = Object.values(items)
        .filter((item) => item.type === "group" && item.matchId)
        .map((item) => item.matchId)

      setSavedMatchIds(ids)
    })

    return () => {
      unsubWinner()
      unsubPredictions()
    }
  }, [user])

  const alert = useMemo(() => {
    if (!user) return null

    const dismissed = new Set(dismissedIds)

    const winnerDiff = TOURNAMENT_LOCK_TIME.getTime() - now.getTime()

    if (
      !winnerPick &&
      winnerDiff > 0 &&
      winnerDiff <= WINNER_WARNING_WINDOW &&
      !dismissed.has("winner-pick")
    ) {
      return {
        id: "winner-pick",
        type: "winner",
        eyebrow: "Winner pick deadline",
        title: "Your World Cup winner pick locks soon",
        description: `Pick your tournament winner before it locks in ${formatTimeLeft(
          winnerDiff
        )}.`,
        href: "/",
        action: "Pick winner",
      }
    }

const nextMatch = MATCHES
  .map((match) => {
    const kickoff = new Date(match.kickoff)
    const diff = kickoff.getTime() - now.getTime()

    const alertStage =
      diff <= MATCH_FINAL_WARNING_WINDOW
        ? "final"
        : diff <= MATCH_DAY_WARNING_WINDOW
          ? "day"
          : ""

    return { match, diff, alertStage }
  })
  .filter(({ match, diff, alertStage }) => {
    const alreadySaved = savedMatchIds.includes(match.id)
    const alertId = alertStage ? `match-${match.id}-${alertStage}` : ""
    const alreadyDismissed = alertId ? dismissed.has(alertId) : true

    return (
      diff > 0 &&
      alertStage &&
      !alreadySaved &&
      !alreadyDismissed
    )
  })
  .sort((a, b) => a.diff - b.diff)[0]

if (nextMatch) {
  const { match, diff, alertStage } = nextMatch

  const urgent = alertStage === "final"

  return {
    id: `match-${match.id}-${alertStage}`,
    type: "match",
    eyebrow: urgent ? "Final warning" : "Prediction reminder",
    title: `${match.homeTeam.name} v ${match.awayTeam.name}`,
    description: urgent
      ? `Kick-off is in ${formatTimeLeft(diff)}. Lock your score now.`
      : `This match kicks off in ${formatTimeLeft(diff)}. Add your score prediction before it locks.`,
    href: "/predictions",
    action: "Go to picks",
  }
}
    return null
  }, [user, now, winnerPick, savedMatchIds, dismissedIds])

  if (!alert) return null

  const handleDismiss = () => {
    dismissAlert(alert.id)
    setDismissedIds(getDismissedAlertIds())
  }

  return (
    <div className="fixed inset-x-3 bottom-20 z-[90] mx-auto max-w-xl md:bottom-6 md:left-auto md:right-6 md:mx-0">
      <div className="relative overflow-hidden rounded-[1.75rem] border border-primary/25 bg-background/95 p-4 shadow-2xl backdrop-blur-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.25),transparent_35%),linear-gradient(135deg,transparent,transparent_45%,hsl(var(--primary)/0.08)_45%,hsl(var(--primary)/0.08)_55%,transparent_55%)]" />

        <div className="relative flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_0_24px_hsl(var(--primary)/0.35)] animate-pulse">
            {alert.type === "winner" ? (
              <Trophy size={24} />
            ) : (
              <Zap size={24} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                <Clock size={11} />
                {alert.eyebrow}
              </span>
            </div>

            <h3 className="font-headline text-base font-black leading-tight">
              {alert.title}
            </h3>

            <p className="mt-1 text-sm font-medium leading-5 text-muted-foreground">
              {alert.description}
            </p>

            <div className="mt-4 flex gap-2">
              <Link
                href={alert.href}
                className="rounded-2xl bg-primary px-4 py-2 text-xs font-black uppercase text-primary-foreground shadow-lg shadow-primary/20"
              >
                {alert.action}
              </Link>

              <button
                type="button"
                onClick={handleDismiss}
                className="rounded-2xl border border-border bg-background/70 px-4 py-2 text-xs font-black uppercase text-muted-foreground"
              >
                Dismiss
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-full bg-muted/70 p-2 text-muted-foreground hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
