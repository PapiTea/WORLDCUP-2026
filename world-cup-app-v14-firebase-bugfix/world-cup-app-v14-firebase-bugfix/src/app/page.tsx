"use client"

import { BottomNav } from "@/components/BottomNav"
import { MATCHES } from "@/lib/mock-data"
import { CalendarDays, MapPin, Trophy } from "lucide-react"

function text(value: any): string {
  if (!value) return ""
  if (typeof value === "string" || typeof value === "number") return String(value)
  if (typeof value === "object") {
    return (
      value.name ||
      value.team ||
      value.label ||
      value.country ||
      value.code ||
      value.id ||
      ""
    )
  }
  return ""
}

function get(match: any, keys: string[]) {
  for (const key of keys) {
    const value = text(match?.[key])
    if (value) return value
  }
  return ""
}

function teamName(team: any, fallback: string) {
  if (!team) return fallback
  if (typeof team === "string") return team
  return team.name || team.team || team.country || team.label || team.code || fallback
}

function hostMarker(match: any) {
  const raw =
    match.countryEmoji ||
    match.hostEmoji ||
    match.emoji ||
    match.hostCountry ||
    match.country ||
    ""

  const value = text(raw).toLowerCase()

  if (value.includes("mexico") || value === "mx") return "🇲🇽"
  if (value.includes("canada") || value === "ca") return "🇨🇦"
  if (value.includes("usa") || value.includes("united states") || value === "us") return "🇺🇸"

  return text(raw)
}

export default function HomePage() {
  return (
    <main className="min-h-screen px-4 pb-28 pt-6 md:pl-28 md:pr-8 md:pb-10">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-card/70 p-6 shadow-2xl backdrop-blur md:p-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-primary">
            <Trophy size={14} /> World Cup App
          </div>

          <h1 className="font-headline text-4xl font-black tracking-tight md:text-5xl">
            Fixtures
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
            View the World Cup 2026 fixtures, UK kick-off times, venues and host countries.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
          {MATCHES.map((match: any) => {
            const home = teamName(match.homeTeam || match.home || match.homeTeamCode, "TBC")
            const away = teamName(match.awayTeam || match.away || match.awayTeamCode, "TBC")
            const group = get(match, ["group"]) || "TBC"
            const time = get(match, ["ukTime", "time", "kickoffUk", "kickoffTime"]) || "TBC"
            const venue = get(match, ["venue", "stadium"]) || "Venue TBC"
            const city = get(match, ["city", "location"])
            const host = hostMarker(match)

            return (
              <article
                key={String(match.id)}
                className="rounded-[2rem] border border-white/10 bg-card/75 p-5 shadow-xl backdrop-blur"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-primary">
                    Group {group}
                  </span>

                  <span className="text-xl">{host}</span>
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-center">
                  <div className="min-w-0">
                    <div className="truncate text-2xl font-black">{home}</div>
                  </div>

                  <div className="rounded-full bg-muted px-3 py-1 text-xs font-black text-muted-foreground">
                    vs
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-2xl font-black">{away}</div>
                  </div>
                </div>

                <div className="mt-5 space-y-2 rounded-2xl bg-muted/50 p-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={16} />
                    <span className="font-bold text-foreground">
                      {time} UK time
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin size={16} />
                    <span>
                      {venue}
                      {city ? `, ${city}` : ""}
                    </span>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <BottomNav />
    </main>
  )
}
