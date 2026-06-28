"use client"

import { useEffect, useMemo, useState } from "react"
import { BottomNav } from "@/components/BottomNav"
import { MatchCard } from "@/components/MatchCard"
import { KnockoutMatchCard } from "@/components/KnockoutMatchCard"
import { KNOCKOUT_FIXTURES, KNOCKOUT_ROUNDS, MATCHES } from "@/lib/mock-data"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/AuthGate"
import {
  subscribeKnockoutSetup,
  subscribeResults,
  subscribeUserMatchPredictions,
  type MatchPrediction,
  type Score,
} from "@/lib/firebase-service"

const TEAM_SEARCH_NAMES: Record<string, string> = {
  ENG: "England",
  SCO: "Scotland",
  WAL: "Wales",
  USA: "United States USA America",
  CAN: "Canada",
  MEX: "Mexico",
  BRA: "Brazil",
  ARG: "Argentina",
  FRA: "France",
  ESP: "Spain",
  GER: "Germany",
  ITA: "Italy",
  POR: "Portugal",
  NED: "Netherlands Holland",
  BEL: "Belgium",
  CRO: "Croatia",
  DEN: "Denmark",
  SUI: "Switzerland",
  AUT: "Austria",
  POL: "Poland",
  IRN: "Iran",
  JPN: "Japan",
  KOR: "South Korea Korea",
  AUS: "Australia",
  MAR: "Morocco",
  EGY: "Egypt",
  SEN: "Senegal",
  NGA: "Nigeria",
  GHA: "Ghana",
  CIV: "Ivory Coast Côte d'Ivoire",
  URU: "Uruguay",
  COL: "Colombia",
  CHI: "Chile",
  PAR: "Paraguay",
  ECU: "Ecuador",
  PER: "Peru",
  QAT: "Qatar",
  KSA: "Saudi Arabia",
  UAE: "United Arab Emirates",
  TUN: "Tunisia",
  ALG: "Algeria",
  NZL: "New Zealand",
  TUR: "Turkey Türkiye",
  CZE: "Czech Republic Czechia",
  BIH: "Bosnia Herzegovina Bosnia and Herzegovina",
  HAI: "Haiti",
}

export default function PredictionsPage() {
const [searchQuery, setSearchQuery] = useState("")
const { user } = useAuth()
const [results, setResults] = useState<Record<string, Score>>({})
const [knockoutSlots, setKnockoutSlots] = useState<Record<string, string>>({})
const [userPredictions, setUserPredictions] = useState<Record<string, MatchPrediction>>({})

useEffect(() => {
  const unsub = subscribeResults(setResults)
  return () => unsub()
}, [])

useEffect(() => {
  const unsub = subscribeKnockoutSetup(({ slots }) => {
    setKnockoutSlots(slots)
  })

  return () => unsub()
}, [])

useEffect(() => {
  if (!user) return

  const unsub = subscribeUserMatchPredictions(user.uid, setUserPredictions)
  return () => unsub()
}, [user])
  const filteredMatches = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    if (!query) return MATCHES

    return MATCHES.filter((match) => {
      const homeCode = String(
        match.homeTeamCode || match.homeTeam || match.home || ""
      ).toUpperCase()

      const awayCode = String(
        match.awayTeamCode || match.awayTeam || match.away || ""
      ).toUpperCase()

const searchableText = [
  ...Object.values(match),

  match.homeTeam?.name,
  match.homeTeam?.code,

  match.awayTeam?.name,
  match.awayTeam?.code,

  TEAM_SEARCH_NAMES[homeCode],
  TEAM_SEARCH_NAMES[awayCode],

  match.location,
  match.venue,

  String(match.group || ""),
  `group ${String(match.group || "").toLowerCase()}`,
]
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
  Submit your predictions before each match kicks off. Once kick-off time is reached, that fixture locks and no further changes can be made. Group stage matches are open now, with knockout predictions unlocking throughout the tournament as teams qualify. Earn points for accurate predictions and climb the leaderboard.

          </p>
        </div>

        <Tabs defaultValue="knockouts" className="space-y-6">
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
              <div className="grid items-start gap-5 lg:grid-cols-2 2xl:grid-cols-3">
                {filteredMatches.map((match) => (
                 <MatchCard
  key={match.id}
  match={match}
  liveResult={results[match.id] || null}
/>
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
                Once each fixture is populated, predit your scores! Empty ties show as TBC, meaning the stage is prepared but not ready yet.
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
                      <KnockoutMatchCard
  key={fixture.id}
  fixture={fixture}
  slots={knockoutSlots}
  liveResult={results[`ko_${fixture.id}`] || null}
  savedPrediction={userPredictions[`knockout_${fixture.id}`] || null}
/>
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
