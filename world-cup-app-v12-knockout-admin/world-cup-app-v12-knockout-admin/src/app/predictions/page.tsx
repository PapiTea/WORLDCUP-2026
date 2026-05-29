"use client"

import { useMemo, useState } from "react"
import { BottomNav } from "@/components/BottomNav"
import { MatchCard } from "@/components/MatchCard"
import { KnockoutMatchCard } from "@/components/KnockoutMatchCard"
import { KNOCKOUT_FIXTURES, KNOCKOUT_ROUNDS, MATCHES } from "@/lib/mock-data"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function PredictionsPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredMatches = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    if (!query) return MATCHES

    return MATCHES.filter((match) => {
      const searchableText = Object.values(match)
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return searchableText.includes(query)
    })
  }, [searchQuery])

  return (
    <main className="min-h-screen px-4 pb-28 pt-6 md:pl-28 md:pr-8 md:pb-10">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-card/70 p-6 shadow-2xl backdrop-blur md:p-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-primary">
            <Sparkles size={14} /> Score predictions
          </div>

          <h1 className="font-headline text-4xl font-black tracking-tight md:text-5xl">
            Match Predictions
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
            Predict scores for the group stage now. The knockout tab is ready for later: once you assign qualified teams in Admin, players will see those knockout ties here and can predict them.
          </p>
        </div>

        <Tabs defaultValue="group" className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <TabsList className="h-12 rounded-2xl bg-muted/70 p-1">
              <TabsTrigger
                value="group"
                className="rounded-xl px-5 font-black data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Group Stage
              </TabsTrigger>

              <TabsTrigger
                value="knockouts"
                className="rounded-xl px-5 font-black data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Knockouts
              </TabsTrigger>
            </TabsList>

            <div className="relative w-full md:w-80">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={16}
              />
              <Input
                className="h-12 rounded-2xl bg-card/70 pl-11"
                placeholder="Search teams, groups, venues..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
          </div>

          <TabsContent value="group" className="space-y-4">
            {filteredMatches.length === 0 ? (
              <div className="rounded-[2rem] border border-white/10 bg-card/70 p-6 text-center text-sm text-muted-foreground shadow-xl">
                No matches found. Try searching for a team, group, venue or country.
              </div>
            ) : (
              <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
                {filteredMatches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="knockouts" className="space-y-8">
            <div className="rounded-[2rem] border border-white/10 bg-card/70 p-5 shadow-xl backdrop-blur md:p-6">
              <h2 className="font-headline text-2xl font-black">
                Knockout predictions
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                These cards unlock naturally as you assign teams to bracket slots from the Admin page. Empty ties show as TBC, so players know the stage is prepared but not ready yet.
              </p>
            </div>

            {KNOCKOUT_ROUNDS.map((round) => {
              const fixtures = KNOCKOUT_FIXTURES.filter(
                (fixture) => fixture.round === round.id
              )

              return (
                <section key={round.id} className="space-y-4">
                  <div>
                    <h3 className="font-headline text-xl font-black md:text-2xl">
                      {round.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {round.helper}
                    </p>
                  </div>

                  <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
                    {fixtures.map((fixture) => (
                      <KnockoutMatchCard key={fixture.id} fixture={fixture} />
                    ))}
                  </div>
                </section>
              )
            })}
          </TabsContent>
        </Tabs>
      </section>

      <BottomNav />
    </main>
  )
}
