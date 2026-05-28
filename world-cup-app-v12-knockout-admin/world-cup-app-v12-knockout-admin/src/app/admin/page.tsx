"use client"

import { useEffect, useMemo, useState } from "react"
import { BottomNav } from "@/components/BottomNav"
import { TeamFlag } from "@/components/TeamFlag"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { GROUPS, KNOCKOUT_FIXTURES, KNOCKOUT_ROUNDS, KNOCKOUT_SLOTS, MATCHES, TEAMS, getTeamById } from "@/lib/mock-data"
import { CheckCircle2, RotateCcw, ShieldCheck, Trophy } from "lucide-react"

type ScoreMap = Record<string, { home: number | ""; away: number | "" }>
type QualifierMap = Record<string, string[]>
type SlotMap = Record<string, string>

const notifyKnockoutChange = () => window.dispatchEvent(new CustomEvent("wc-knockout-updated"))

export default function AdminPage() {
  const [scores, setScores] = useState<ScoreMap>({})
  const [koScores, setKoScores] = useState<ScoreMap>({})
  const [qualifiers, setQualifiers] = useState<QualifierMap>({})
  const [slots, setSlots] = useState<SlotMap>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const nextScores: ScoreMap = {}
    for (const match of MATCHES) {
      const stored = window.localStorage.getItem(`wc-result-${match.id}`)
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          nextScores[match.id] = { home: parsed.home ?? "", away: parsed.away ?? "" }
        } catch {}
      }
    }
    const nextKoScores: ScoreMap = {}
    for (const fixture of KNOCKOUT_FIXTURES) {
      const stored = window.localStorage.getItem(`wc-ko-result-${fixture.id}`)
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          nextKoScores[fixture.id] = { home: parsed.home ?? "", away: parsed.away ?? "" }
        } catch {}
      }
    }
    const nextQualifiers: QualifierMap = {}
    for (const group of GROUPS) {
      const stored = window.localStorage.getItem(`wc-qualified-${group.id}`)
      if (stored) {
        try { nextQualifiers[group.id] = JSON.parse(stored) } catch {}
      }
    }
    const nextSlots: SlotMap = {}
    for (const slot of KNOCKOUT_SLOTS) {
      const stored = window.localStorage.getItem(`wc-ko-slot-${slot.id}`)
      if (stored) nextSlots[slot.id] = stored
    }
    setScores(nextScores)
    setKoScores(nextKoScores)
    setQualifiers(nextQualifiers)
    setSlots(nextSlots)
  }, [])

  const qualifiedTeamIds = useMemo(() => Array.from(new Set(Object.values(qualifiers).flat())), [qualifiers])
  const qualifiedTeams = qualifiedTeamIds.map(id => getTeamById(id)).filter(Boolean) as typeof GROUPS[number]["teams"]

  const updateScore = (matchId: string, side: "home" | "away", value: string) => {
    setScores(prev => ({ ...prev, [matchId]: { ...(prev[matchId] || { home: "", away: "" }), [side]: value === "" ? "" : Number(value) } }))
    setSaved(false)
  }

  const updateKoScore = (matchId: string, side: "home" | "away", value: string) => {
    setKoScores(prev => ({ ...prev, [matchId]: { ...(prev[matchId] || { home: "", away: "" }), [side]: value === "" ? "" : Number(value) } }))
    setSaved(false)
  }

  const saveScore = (matchId: string) => {
    const score = scores[matchId]
    if (!score || score.home === "" || score.away === "") return
    window.localStorage.setItem(`wc-result-${matchId}`, JSON.stringify(score))
    setSaved(true)
  }

  const saveKoScore = (matchId: string) => {
    const score = koScores[matchId]
    if (!score || score.home === "" || score.away === "") return
    window.localStorage.setItem(`wc-ko-result-${matchId}`, JSON.stringify(score))
    setSaved(true)
    notifyKnockoutChange()
  }

  const clearScore = (matchId: string) => {
    window.localStorage.removeItem(`wc-result-${matchId}`)
    setScores(prev => ({ ...prev, [matchId]: { home: "", away: "" } }))
    setSaved(false)
  }

  const clearKoScore = (matchId: string) => {
    window.localStorage.removeItem(`wc-ko-result-${matchId}`)
    setKoScores(prev => ({ ...prev, [matchId]: { home: "", away: "" } }))
    setSaved(false)
    notifyKnockoutChange()
  }

  const toggleQualifier = (groupId: string, teamId: string) => {
    setQualifiers(prev => {
      const current = prev[groupId] || []
      const next = current.includes(teamId)
        ? current.filter(id => id !== teamId)
        : current.length >= 3
          ? [current[1], current[2], teamId]
          : [...current, teamId]
      window.localStorage.setItem(`wc-qualified-${groupId}`, JSON.stringify(next))
      return { ...prev, [groupId]: next }
    })
    setSaved(true)
  }

  const setSlot = (slotId: string, teamId: string) => {
    if (!teamId) {
      window.localStorage.removeItem(`wc-ko-slot-${slotId}`)
      setSlots(prev => {
        const copy = { ...prev }
        delete copy[slotId]
        return copy
      })
    } else {
      window.localStorage.setItem(`wc-ko-slot-${slotId}`, teamId)
      setSlots(prev => ({ ...prev, [slotId]: teamId }))
    }
    setSaved(true)
    notifyKnockoutChange()
  }

  const clearSlotForTeam = (teamId: string) => {
    for (const [slotId, selectedTeamId] of Object.entries(slots)) {
      if (selectedTeamId === teamId) window.localStorage.removeItem(`wc-ko-slot-${slotId}`)
    }
    setSlots(prev => Object.fromEntries(Object.entries(prev).filter(([, selectedTeamId]) => selectedTeamId !== teamId)))
    notifyKnockoutChange()
  }

  const resetAdminData = () => {
    if (!window.confirm("Clear all admin results, qualifiers and knockout setup from this device?")) return
    for (const match of MATCHES) window.localStorage.removeItem(`wc-result-${match.id}`)
    for (const fixture of KNOCKOUT_FIXTURES) window.localStorage.removeItem(`wc-ko-result-${fixture.id}`)
    for (const group of GROUPS) window.localStorage.removeItem(`wc-qualified-${group.id}`)
    for (const slot of KNOCKOUT_SLOTS) window.localStorage.removeItem(`wc-ko-slot-${slot.id}`)
    setScores({})
    setKoScores({})
    setQualifiers({})
    setSlots({})
    setSaved(false)
    notifyKnockoutChange()
  }

  return (
    <main className="min-h-screen px-4 pb-28 pt-6 md:pl-28 md:pr-8 md:pb-10">
      <section className="mx-auto max-w-7xl space-y-8">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-card/70 p-6 shadow-2xl backdrop-blur md:p-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-primary">
            <ShieldCheck size={14} /> Admin only
          </div>
          <h1 className="font-headline text-4xl font-black tracking-tight md:text-5xl">Manual Results & Knockout Setup</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
            This page is purely for you to populate final scores and the knockout bracket because the app is not using a live sports API. Whatever you save here becomes the local source of truth for results, knockout fixtures and point calculations on this device. Later, Firebase will make these admin updates sync for every player.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {saved && <span className="inline-flex items-center gap-1 text-sm font-bold text-primary"><CheckCircle2 size={16} /> Saved on this device</span>}
            <Button variant="outline" className="rounded-2xl" onClick={resetAdminData}><RotateCcw size={15} className="mr-2" /> Reset admin data</Button>
          </div>
        </div>

        <section className="space-y-4">
          <div>
            <h2 className="font-headline text-2xl font-black">1. Group-stage final scores</h2>
            <p className="text-sm text-muted-foreground">Enter scores here after each match finishes. These feed the fixture pages and local leaderboard scoring.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {MATCHES.map(match => {
              const score = scores[match.id] || { home: "", away: "" }
              const stored = typeof window !== "undefined" ? window.localStorage.getItem(`wc-result-${match.id}`) : null
              return (
                <Card key={match.id} className="rounded-3xl border border-white/10 bg-card/70 p-4 shadow-xl backdrop-blur">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <Badge variant="outline" className="rounded-full border-primary/30 bg-primary/10 px-3 py-1 text-xs font-black text-primary">Group {match.group}</Badge>
                    {stored && <span className="text-xs font-black text-primary">Result saved</span>}
                  </div>
                  <ScoreEditor homeTeam={match.homeTeam} awayTeam={match.awayTeam} score={score} onChange={(side, value) => updateScore(match.id, side, value)} />
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button className="rounded-2xl font-black" onClick={() => saveScore(match.id)} disabled={score.home === "" || score.away === ""}>Save result</Button>
                    <Button variant="outline" className="rounded-2xl font-black" onClick={() => clearScore(match.id)}>Clear</Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="font-headline text-2xl font-black">2. Qualified teams + bracket placement</h2>
            <p className="text-sm text-muted-foreground">Select official qualifiers from each group. You can select up to 3 per group so the best third-place teams can be handled. Once selected, place each qualified team into a knockout slot.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {GROUPS.map(group => {
              const picked = qualifiers[group.id] || []
              return (
                <Card key={group.id} className="rounded-3xl border border-white/10 bg-card/70 p-4 shadow-xl backdrop-blur">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-headline text-lg font-black">{group.name}</h3>
                    <span className="text-xs font-bold text-muted-foreground">{picked.length}/3 selected</span>
                  </div>
                  <div className="space-y-2">
                    {group.teams.map(team => {
                      const active = picked.includes(team.id)
                      const currentSlot = Object.entries(slots).find(([, selectedTeamId]) => selectedTeamId === team.id)?.[0] || ""
                      return (
                        <div key={team.id} className={`rounded-2xl border p-3 transition ${active ? 'border-primary bg-primary/10' : 'border-border bg-background/40'}`}>
                          <button onClick={() => { toggleQualifier(group.id, team.id); if (active) clearSlotForTeam(team.id) }} className="flex w-full items-center gap-3 text-left">
                            <TeamFlag team={team} className="h-7 w-10 rounded-lg" />
                            <span className="font-black">{team.name}</span>
                            {active && <Trophy size={16} className="ml-auto text-primary" />}
                          </button>
                          {active && (
                            <label className="mt-3 block text-xs font-bold text-muted-foreground">
                              Knockout slot
                              <select value={currentSlot} onChange={(e) => {
                                if (currentSlot) setSlot(currentSlot, "")
                                if (e.target.value) setSlot(e.target.value, team.id)
                              }} className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm font-bold text-foreground">
                                <option value="">Not placed yet</option>
                                {KNOCKOUT_SLOTS.map(slot => {
                                  const selectedBy = slots[slot.id]
                                  const disabled = Boolean(selectedBy && selectedBy !== team.id)
                                  const selectedTeam = getTeamById(selectedBy)
                                  return <option key={slot.id} value={slot.id} disabled={disabled}>{slot.label}{selectedTeam && selectedTeam.id !== team.id ? ` — used by ${selectedTeam.name}` : ""}</option>
                                })}
                              </select>
                            </label>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )
            })}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="font-headline text-2xl font-black">3. Knockout bracket overview</h2>
            <p className="text-sm text-muted-foreground">This is a quick admin view of which teams are in each knockout slot. Empty slots stay as TBC for players.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {KNOCKOUT_ROUNDS.map(round => (
              <Card key={round.id} className="rounded-3xl border border-white/10 bg-card/70 p-4 shadow-xl backdrop-blur">
                <h3 className="font-headline text-lg font-black">{round.name}</h3>
                <div className="mt-3 grid gap-2">
                  {KNOCKOUT_SLOTS.filter(slot => slot.round === round.id).map(slot => {
                    const team = getTeamById(slots[slot.id])
                    return (
                      <div key={slot.id} className="flex items-center gap-2 rounded-2xl bg-background/45 p-2 ring-1 ring-border">
                        <span className="w-20 shrink-0 text-[10px] font-black uppercase text-muted-foreground">{slot.label}</span>
                        {team ? <><TeamFlag team={team} className="h-6 w-9 rounded-md" /><span className="truncate text-sm font-black">{team.name}</span></> : <span className="text-sm font-bold text-muted-foreground">TBC</span>}
                      </div>
                    )
                  })}
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="font-headline text-2xl font-black">4. Knockout final scores</h2>
            <p className="text-sm text-muted-foreground">When knockout matches are played, enter the final score here. These results are used for knockout prediction scoring locally.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {KNOCKOUT_FIXTURES.map(fixture => {
              const score = koScores[fixture.id] || { home: "", away: "" }
              const homeTeam = getTeamById(slots[fixture.homeSlot])
              const awayTeam = getTeamById(slots[fixture.awaySlot])
              const stored = typeof window !== "undefined" ? window.localStorage.getItem(`wc-ko-result-${fixture.id}`) : null
              return (
                <Card key={fixture.id} className="rounded-3xl border border-white/10 bg-card/70 p-4 shadow-xl backdrop-blur">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <Badge variant="outline" className="rounded-full border-primary/30 bg-primary/10 px-3 py-1 text-xs font-black text-primary">{fixture.roundName} · M{fixture.matchNumber}</Badge>
                    {stored && <span className="text-xs font-black text-primary">Result saved</span>}
                  </div>
                  <ScoreEditor homeTeam={homeTeam} awayTeam={awayTeam} homePlaceholder={fixture.homeSlot} awayPlaceholder={fixture.awaySlot} score={score} onChange={(side, value) => updateKoScore(fixture.id, side, value)} />
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button className="rounded-2xl font-black" onClick={() => saveKoScore(fixture.id)} disabled={score.home === "" || score.away === "" || !homeTeam || !awayTeam}>Save result</Button>
                    <Button variant="outline" className="rounded-2xl font-black" onClick={() => clearKoScore(fixture.id)}>Clear</Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </section>
      </section>
      <BottomNav />
    </main>
  )
}

function ScoreEditor({ homeTeam, awayTeam, homePlaceholder = "TBC", awayPlaceholder = "TBC", score, onChange }: { homeTeam: any; awayTeam: any; homePlaceholder?: string; awayPlaceholder?: string; score: { home: number | ""; away: number | "" }; onChange: (side: "home" | "away", value: string) => void }) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
      <TeamMini team={homeTeam} placeholder={homePlaceholder} />
      <div className="flex items-center gap-2 rounded-2xl bg-background/55 p-2 ring-1 ring-border">
        <Input type="number" inputMode="numeric" value={score.home} onChange={(e) => onChange("home", e.target.value)} placeholder="-" className="h-11 w-14 rounded-xl p-0 text-center text-lg font-black" />
        <span className="font-black text-muted-foreground">:</span>
        <Input type="number" inputMode="numeric" value={score.away} onChange={(e) => onChange("away", e.target.value)} placeholder="-" className="h-11 w-14 rounded-xl p-0 text-center text-lg font-black" />
      </div>
      <TeamMini team={awayTeam} placeholder={awayPlaceholder} right />
    </div>
  )
}

function TeamMini({ team, placeholder, right = false }: { team: any; placeholder?: string; right?: boolean }) {
  if (!team) {
    return <div className={`min-w-0 text-sm font-black text-muted-foreground ${right ? 'text-right' : ''}`}>{placeholder || "TBC"}</div>
  }
  return (
    <div className={`flex min-w-0 items-center gap-2 ${right ? 'flex-row-reverse text-right' : ''}`}>
      <TeamFlag team={team} className="h-8 w-12 rounded-lg" />
      <div className="min-w-0">
        <div className="truncate text-sm font-black" title={team.name}>{team.name}</div>
        <div className="text-[10px] font-bold uppercase text-muted-foreground">{team.code}</div>
      </div>
    </div>
  )
}
