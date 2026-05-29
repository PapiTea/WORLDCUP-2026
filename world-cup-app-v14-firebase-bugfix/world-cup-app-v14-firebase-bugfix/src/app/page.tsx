"use client"

import { useEffect, useMemo, useState } from "react"
import { BottomNav } from "@/components/BottomNav"
import { GROUPS, MATCHES } from "@/lib/mock-data"
import { CalendarDays, Lock, MapPin, Trophy } from "lucide-react"
import { useAuth } from "@/components/AuthGate"
import {
  saveTournamentWinner,
  subscribeTournamentWinner,
} from "@/lib/firebase-service"

const TOURNAMENT_LOCK_TIME = new Date("2026-06-11T19:00:00Z")

function TeamFlag({ team }: { team: any }) {
  if (team?.flagImage) {
    return (
      <img
        src={team.flagImage}
        alt={`${team.name} flag`}
        className="h-14 w-20 rounded-xl object-cover shadow-md"
      />
    )
  }

  return <span className="text-4xl">{team?.flag || "🏳️"}</span>
}

function formatDate(kickoff: string) {
  const date = new Date(kickoff)

  if (Number.isNaN(date.getTime())) return "Date TBC"

  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/London",
  }).format(date)
}

function getCountdown(now: Date) {
  const diff = TOURNAMENT_LOCK_TIME.getTime() - now.getTime()

  if (diff <= 0) {
    return "Tournament started"
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((diff / (1000 * 60)) % 60)

  return `${days}d ${hours}h ${minutes}m`
}

export default function HomePage() {
  const { user } = useAuth()
  const [now, setNow] = useState(() => new Date())
  const [winnerPick, setWinnerPick] = useState("")

  const tournamentLocked = now >= TOURNAMENT_LOCK_TIME

  const allTeams = useMemo(() => {
    const map = new Map<string, any>()

    GROUPS.forEach((group) => {
      group.teams.forEach((team) => {
        map.set(team.id, team)
      })
    })

    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    )
  }, [])

  const selectedTeam = allTeams.find((team) => team.id === winnerPick)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date())
    }, 30000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!user) return

    const unsub = subscribeTournamentWinner(user.uid, (teamId) => {
      setWinnerPick(teamId)
    })

    return () => unsub()
  }, [user])

  const handleWinnerChange = async (teamId: string) => {
    if (!user || tournamentLocked) return

    setWinnerPick(teamId)
    await saveTournamentWinner(user.uid, teamId)
  }

  const matchesByDate = MATCHES.reduce<Record<string, typeof MATCHES>>(
    (groups, match) => {
      const dateLabel = formatDate(match.kickoff)

      if (!groups[dateLabel]) {
        groups[dateLabel] = []
      }

      groups[dateLabel].push(match)

      return groups
    },
    {}
  )

  return (
    <main className="min-h-screen px-4 pb-28 pt-6 md:pl-28 md:pr-8 md:pb-10">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-card/70 p-6 shadow-2xl backdrop-blur md:p-8">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-primary">
              <Trophy size={14} /> World Cup App
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-primary">
              {tournamentLocked ? "Tournament started" : getCountdown(now)}
            </div>
          </div>

          <h1 className="font-headline text-4xl font-black tracking-tight md:text-5xl">
            Fixtures
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
            World Cup 2026 fixtures by date, showing UK kick-off times, venues
            and host countries.
          </p>
        </div>

        <div className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-card/70 p-5 shadow-2xl backdrop-blur md:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-primary">
                <Trophy size={14} /> Tournament Winner
              </div>

              <h2 className="font-headline text-2xl font-black">
                Pick your World Cup winner
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Choose the team you think will win the tournament. This pick is
                worth <span className="font-black text-primary">50 points</span>{" "}
                and locks when the World Cup starts on Thu 11 Jun 2026 at 20:00
                UK.
              </p>
            </div>

            <div
              className={`rounded-2xl px-4 py-3 text-sm font-bold ${
                tournamentLocked
                  ? "bg-destructive/10 text-destructive"
                  : "bg-primary/10 text-primary"
              }`}
            >
              <div className="flex items-center gap-2">
                {tournamentLocked && <Lock size={16} />}
                {tournamentLocked
                  ? "Winner pick locked"
                  : "Locks Thu 11 Jun 2026, 20:00 UK"}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <select
              value={winnerPick}
              disabled={tournamentLocked}
              onChange={(event) => handleWinnerChange(event.target.value)}
              className="h-12 rounded-2xl border border-border bg-background/70 px-4 text-sm font-bold outline-none disabled:cursor-not-allowed disabled:opacity-70"
            >
              <option value="">Select tournament winner...</option>
              {allTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>

      <div className="flex items-center gap-3 rounded-2xl bg-muted/50 px-4 py-3 text-sm font-bold text-muted-foreground">
        {selectedTeam ? (
      <>
     <TeamFlag
  team={selectedTeam}
  className="h-8 w-12 rounded-lg object-cover"
/>
      <span>{selectedTeam.name} selected</span>
    </>
  ) : (
    <span>No winner selected yet</span>
  )}
</div>
          </div>

          {tournamentLocked && (
            <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
              The tournament has started, so winner picks can no longer be
              changed.
            </div>
          )}
        </div>

        <div className="space-y-10">
          {Object.entries(matchesByDate).map(([dateLabel, matches]) => (
            <section key={dateLabel} className="space-y-4">
              <div className="sticky top-3 z-20 rounded-2xl border border-white/10 bg-background/90 px-4 py-3 shadow-xl backdrop-blur">
                <h2 className="font-headline text-xl font-black md:text-2xl">
                  {dateLabel}
                </h2>
              </div>

              <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
                {matches.map((match) => (
                  <article
                    key={match.id}
                    className="rounded-[2rem] border border-white/10 bg-card/75 p-5 shadow-xl backdrop-blur"
                  >
                    <div className="mb-5 flex items-center justify-between gap-3">
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-primary">
                        Group {match.group}
                      </span>

                      <span className="text-xl">{match.hostEmoji}</span>
                    </div>

                    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-4 text-center">
                      <div className="flex min-w-0 flex-col items-center gap-3">
                        <TeamFlag team={match.homeTeam} />
                        <div className="min-w-0 max-w-full">
                          <div className="break-words text-lg font-black leading-tight md:text-xl">
                            {match.homeTeam.name}
                          </div>
                          <div className="mt-1 text-xs font-black uppercase text-muted-foreground">
                            {match.homeTeam.code}
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 rounded-full bg-muted px-3 py-1 text-xs font-black text-muted-foreground">
                        vs
                      </div>

                      <div className="flex min-w-0 flex-col items-center gap-3">
                        <TeamFlag team={match.awayTeam} />
                        <div className="min-w-0 max-w-full">
                          <div className="break-words text-lg font-black leading-tight md:text-xl">
                            {match.awayTeam.name}
                          </div>
                          <div className="mt-1 text-xs font-black uppercase text-muted-foreground">
                            {match.awayTeam.code}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 space-y-2 rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CalendarDays size={16} />
                        <span className="font-bold text-foreground">
                          {match.ukKickoff} UK time
                        </span>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin size={16} className="mt-0.5 shrink-0" />
                        <span>
                          {match.venue}, {match.location}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <BottomNav />
    </main>
  )
}
