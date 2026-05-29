"use client"

import { useMemo, useState } from "react"
import { MATCHES } from "@/lib/mock-data"
import { BottomNav } from "@/components/BottomNav"
import { TeamFlag } from "@/components/TeamFlag"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { HostBadge } from "@/components/HostBadge"
import { CalendarDays, Clock, Search, Trophy } from "lucide-react"

function prettyDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    timeZone: "Europe/London",
    weekday: "short",
    day: "numeric",
    month: "short",
  })
}

export default function HomePage() {
  const [query, setQuery] = useState("")
  const [groupFilter, setGroupFilter] = useState("All")

  const groups = ["All", ...Array.from(new Set(MATCHES.map((m) => m.group)))]
  const filteredMatches = useMemo(() => {
    const q = query.trim().toLowerCase()
    return MATCHES.filter((match) => {
      const groupOk = groupFilter === "All" || match.group === groupFilter
      const text = `${match.homeTeam.name} ${match.awayTeam.name} ${match.location} ${match.venue} Group ${match.group}`.toLowerCase()
      return groupOk && (!q || text.includes(q))
    })
  }, [query, groupFilter])

  const byDate = filteredMatches.reduce<Record<string, typeof MATCHES>>((acc, match) => {
    const key = prettyDate(match.kickoff)
    acc[key] ||= []
    acc[key].push(match)
    return acc
  }, {})

  return (
    <main className="min-h-screen px-4 pb-28 pt-6 md:pl-28 md:pr-8 md:pb-10">
      <section className="mx-auto max-w-7xl space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-card/75 p-6 shadow-2xl backdrop-blur md:p-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-primary">
            <Trophy size={14} /> World Cup App
          </div>
          <h1 className="font-headline text-4xl font-black tracking-tight md:text-6xl">Fixtures</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
            All group-stage fixtures are shown in UK time, with the host city, stadium and country marker. Fixtures only on this home page. Use Picks to predict scores and Groups to choose qualifiers.
          </p>
        </div>

        <div className="sticky top-0 z-20 -mx-4 border-y border-white/5 bg-background/90 px-4 py-3 backdrop-blur md:top-0 md:mx-0 md:rounded-3xl md:border md:bg-card/70">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} className="h-12 rounded-2xl bg-card/70 pl-11" placeholder="Search team, stadium or city..." />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
              {groups.map((group) => (
                <Button key={group} size="sm" variant={groupFilter === group ? "default" : "outline"} className="shrink-0 rounded-2xl font-black" onClick={() => setGroupFilter(group)}>
                  {group === "All" ? "All" : `Group ${group}`}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {Object.entries(byDate).map(([date, matches]) => (
            <section key={date} className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <CalendarDays size={18} />
                <h2 className="font-headline text-xl font-black md:text-2xl">{date}</h2>
              </div>
              <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                {matches.map((match) => (
                  <Card key={match.id} className="rounded-3xl border border-white/10 bg-card/75 p-4 shadow-xl backdrop-blur transition hover:-translate-y-0.5 hover:shadow-2xl">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <Badge variant="outline" className="rounded-full border-primary/30 bg-primary/10 px-3 py-1 text-xs font-black text-primary">Group {match.group}</Badge>
                      <div className="flex items-center gap-1.5 text-sm font-black text-foreground"><Clock size={15} /> {match.ukKickoff}</div>
                    </div>
                    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-3">
                      <FixtureTeam team={match.homeTeam} />
                      <div className="mt-5 rounded-full bg-muted/60 px-3 py-1 text-xs font-black text-muted-foreground">vs</div>
                      <FixtureTeam team={match.awayTeam} />
                    </div>
                    <HostBadge location={match.location} venue={match.venue} className="mt-4" />
                  </Card>
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

function FixtureTeam({ team }: { team: typeof MATCHES[number]["homeTeam"] }) {
  return (
    <div className="min-w-0 text-center">
      <TeamFlag team={team} className="mx-auto h-14 w-20 rounded-2xl object-cover sm:h-16 sm:w-24" />
      <div className="mx-auto mt-2 line-clamp-2 min-h-[2.1rem] max-w-full px-1 text-center text-[11px] font-black leading-tight sm:text-xs" title={team.name}>{team.name}</div>
      <div className="mt-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{team.code}</div>
    </div>
  )
}
