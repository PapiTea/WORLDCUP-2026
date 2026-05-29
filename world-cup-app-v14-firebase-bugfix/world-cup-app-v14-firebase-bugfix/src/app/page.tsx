"use client"

import Image from "next/image"
import { BottomNav } from "@/components/BottomNav"
import { MATCHES } from "@/lib/mock-data"
import { CalendarDays, MapPin, Trophy } from "lucide-react"

function TeamFlag({ team }: { team: any }) {
  if (team?.flagImage) {
    return (
      <Image
        src={team.flagImage}
        alt={`${team.name} flag`}
        width={72}
        height={48}
        className="h-12 w-16 rounded-xl object-cover shadow-md"
      />
    )
  }

  return <span className="text-4xl">{team?.flag || "🏳️"}</span>
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
          {MATCHES.map((match) => (
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

              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-center">
                <div className="flex min-w-0 flex-col items-center gap-3">
                  <TeamFlag team={match.homeTeam} />
                  <div className="min-w-0">
                    <div className="truncate text-xl font-black">
                      {match.homeTeam.name}
                    </div>
                    <div className="text-xs font-black uppercase text-muted-foreground">
                      {match.homeTeam.code}
                    </div>
                  </div>
                </div>

                <div className="rounded-full bg-muted px-3 py-1 text-xs font-black text-muted-foreground">
                  vs
                </div>

                <div className="flex min-w-0 flex-col items-center gap-3">
                  <TeamFlag team={match.awayTeam} />
                  <div className="min-w-0">
                    <div className="truncate text-xl font-black">
                      {match.awayTeam.name}
                    </div>
                    <div className="text-xs font-black uppercase text-muted-foreground">
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

                <div className="flex items-center gap-2">
                  <MapPin size={16} />
                  <span>
                    {match.venue}, {match.location}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <BottomNav />
    </main>
  )
}
