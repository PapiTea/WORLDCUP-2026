"use client"

import { useEffect, useMemo, useState } from "react"
import { BottomNav } from "@/components/BottomNav"
import { TeamFlag } from "@/components/TeamFlag"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  GROUPS,
  KNOCKOUT_FIXTURES,
  KNOCKOUT_ROUNDS,
  KNOCKOUT_SLOTS,
  MATCHES,
  getTeamById,
} from "@/lib/mock-data"
import { useAuth } from "@/components/AuthGate"
import {
  clearGlobalMessage,
  clearKnockoutSlot,
  deleteMatchResult,
  saveGlobalMessage,
  saveKnockoutSlot,
  saveMatchResult,
  saveQualifier,
  subscribeKnockoutSetup,
  subscribeResults,
} from "@/lib/firebase-service"
import { CheckCircle2, RotateCcw, ShieldCheck, Trophy, Lock } from "lucide-react"

type ScoreMap = Record<string, { home: number | ""; away: number | "" }>
type QualifierMap = Record<string, string[]>
type SlotMap = Record<string, string>

const notifyKnockoutChange = () =>
  window.dispatchEvent(new CustomEvent("wc-knockout-updated"))

export default function AdminPage() {
  const { isAdmin } = useAuth()

  const [scores, setScores] = useState<ScoreMap>({})
  const [koScores, setKoScores] = useState<ScoreMap>({})
  const [koDecidedBy, setKoDecidedBy] = useState<Record<string, "normal" | "extraTime" | "penalties">>({})
const [koWinnerSide, setKoWinnerSide] = useState<Record<string, "home" | "away" | "">>({})
  const [qualifiers, setQualifiers] = useState<QualifierMap>({})
  const [slots, setSlots] = useState<SlotMap>({})
  const [saved, setSaved] = useState(false)
  const [adminMessage, setAdminMessage] = useState("")
const [openAdminSection, setOpenAdminSection] = useState<"groups" | "qualifiers" | "overview" | "knockout">("knockout")
  useEffect(() => {
    if (!isAdmin) return

const unsubResults = subscribeResults((items) => {
  const groupScores: ScoreMap = {}
  const knockoutScores: ScoreMap = {}
  const knockoutDecidedBy: Record<string, "normal" | "extraTime" | "penalties"> = {}
  const knockoutWinnerSide: Record<string, "home" | "away" | ""> = {}

  Object.entries(items).forEach(([id, score]) => {
    if (id.startsWith("ko_")) {
      const cleanId = id.replace("ko_", "")

      knockoutScores[cleanId] = {
        home: score.home,
        away: score.away,
      }

      knockoutDecidedBy[cleanId] = score.decidedBy || "normal"
      knockoutWinnerSide[cleanId] = score.winnerSide || ""
    } else {
      groupScores[id] = {
        home: score.home,
        away: score.away,
      }
    }
  })

  setScores(groupScores)
  setKoScores(knockoutScores)
  setKoDecidedBy(knockoutDecidedBy)
  setKoWinnerSide(knockoutWinnerSide)
})
    const unsubSetup = subscribeKnockoutSetup(({ qualifiers, slots }) => {
      setQualifiers(qualifiers)
      setSlots(slots)
    })

    return () => {
      unsubResults()
      unsubSetup()
    }
  }, [isAdmin])

  const qualifiedTeamIds = useMemo(
    () => Array.from(new Set(Object.values(qualifiers).flat())),
    [qualifiers]
  )

  const updateScore = (matchId: string, side: "home" | "away", value: string) => {
    setScores((prev) => ({
      ...prev,
      [matchId]: {
        ...(prev[matchId] || { home: "", away: "" }),
        [side]: value === "" ? "" : Number(value),
      },
    }))

    setSaved(false)
  }

  const updateKoScore = (
    matchId: string,
    side: "home" | "away",
    value: string
  ) => {
    setKoScores((prev) => ({
      ...prev,
      [matchId]: {
        ...(prev[matchId] || { home: "", away: "" }),
        [side]: value === "" ? "" : Number(value),
      },
    }))

    setSaved(false)
  }

  const saveScore = async (matchId: string) => {
    const score = scores[matchId]

    if (!score || score.home === "" || score.away === "") return

    window.localStorage.setItem(`wc-result-${matchId}`, JSON.stringify(score))
    await saveMatchResult(matchId, {
      home: Number(score.home),
      away: Number(score.away),
    })

    setSaved(true)
  }

const saveKoScore = async (matchId: string) => {
  const score = koScores[matchId]
  const decidedBy = koDecidedBy[matchId] || "normal"
  const winnerSide = koWinnerSide[matchId] || ""

  if (!score || score.home === "" || score.away === "") return

  if (decidedBy === "penalties" && Number(score.home) !== Number(score.away)) {
    window.alert("If decided on penalties, the score after extra time should be a draw, e.g. 1-1.")
    return
  }

  if (decidedBy === "penalties" && !winnerSide) {
    window.alert("Please select who won on penalties.")
    return
  }

const fixture = KNOCKOUT_FIXTURES.find((item) => item.id === matchId)
const homeTeam = fixture ? getTeamById(slots[fixture.homeSlot]) : null
const awayTeam = fixture ? getTeamById(slots[fixture.awaySlot]) : null

const result: any = {
  home: Number(score.home),
  away: Number(score.away),
  decidedBy,
}

if (decidedBy === "penalties") {
  result.winnerSide = winnerSide
  result.winnerTeamId = winnerSide === "home" ? homeTeam?.id : awayTeam?.id
}

  try {
    window.localStorage.setItem(`wc-ko-result-${matchId}`, JSON.stringify(result))

    await saveMatchResult(`ko_${matchId}`, result)

    setSaved(true)
    notifyKnockoutChange()
  } catch (error) {
    console.error("Knockout result save failed:", error)
    window.alert("Knockout result failed to save online. Check console.")
  }
}
  const clearScore = async (matchId: string) => {
    window.localStorage.removeItem(`wc-result-${matchId}`)
    await deleteMatchResult(matchId)

    setScores((prev) => ({
      ...prev,
      [matchId]: { home: "", away: "" },
    }))

    setSaved(false)
  }

  const clearKoScore = async (matchId: string) => {
    window.localStorage.removeItem(`wc-ko-result-${matchId}`)
    await deleteMatchResult(`ko_${matchId}`)

    setKoScores((prev) => ({
      ...prev,
      [matchId]: { home: "", away: "" },
    }))

    setSaved(false)
    notifyKnockoutChange()
  }

  const toggleQualifier = async (groupId: string, teamId: string) => {
    const current = qualifiers[groupId] || []

    const next = current.includes(teamId)
      ? current.filter((id) => id !== teamId)
      : current.length >= 3
        ? [current[1], current[2], teamId]
        : [...current, teamId]

    window.localStorage.setItem(`wc-qualified-${groupId}`, JSON.stringify(next))

    setQualifiers((prev) => ({
      ...prev,
      [groupId]: next,
    }))

    await saveQualifier(groupId, next)
    setSaved(true)
  }

  const setSlot = async (slotId: string, teamId: string) => {
    if (!teamId) {
      window.localStorage.removeItem(`wc-ko-slot-${slotId}`)
      await clearKnockoutSlot(slotId)

      setSlots((prev) => {
        const copy = { ...prev }
        delete copy[slotId]
        return copy
      })
    } else {
      window.localStorage.setItem(`wc-ko-slot-${slotId}`, teamId)
      await saveKnockoutSlot(slotId, teamId)

      setSlots((prev) => ({
        ...prev,
        [slotId]: teamId,
      }))
    }

    setSaved(true)
    notifyKnockoutChange()
  }

const clearSlotForTeam = async (teamId: string) => {
  const slotsToClear = Object.entries(slots)
    .filter(([, selectedTeamId]) => selectedTeamId === teamId)
    .map(([slotId]) => slotId)

  for (const slotId of slotsToClear) {
    window.localStorage.removeItem(`wc-ko-slot-${slotId}`)
    await clearKnockoutSlot(slotId)
  }

  setSlots((prev) =>
    Object.fromEntries(
      Object.entries(prev).filter(([, selectedTeamId]) => selectedTeamId !== teamId)
    )
  )

  notifyKnockoutChange()
}

  const resetAdminData = () => {
    if (
      !window.confirm(
        "Clear all admin results, qualifiers and knockout setup from this device?"
      )
    ) {
      return
    }

    for (const match of MATCHES) {
      window.localStorage.removeItem(`wc-result-${match.id}`)
    }

    for (const fixture of KNOCKOUT_FIXTURES) {
      window.localStorage.removeItem(`wc-ko-result-${fixture.id}`)
    }

    for (const group of GROUPS) {
      window.localStorage.removeItem(`wc-qualified-${group.id}`)
    }

    for (const slot of KNOCKOUT_SLOTS) {
      window.localStorage.removeItem(`wc-ko-slot-${slot.id}`)
    }

    setScores({})
    setKoScores({})
    setQualifiers({})
    setSlots({})
    setSaved(false)

    notifyKnockoutChange()
  }
const syncLiveScores = async () => {
  try {
    const response = await fetch("/api/sync-scores", {
      method: "GET",
    })

    const data = await response.json()

    if (!response.ok) {
      console.error(data)
      window.alert("Live score sync failed. Check console/API settings.")
      return
    }

    const synced = data.synced || []

    if (!synced.length) {
      window.alert("No matching scores found from the API.")
      return
    }

    for (const item of synced) {
      if (
        !item ||
        !item.matchId ||
        typeof item.home !== "number" ||
        typeof item.away !== "number"
      ) {
        continue
      }

      window.localStorage.setItem(
        `wc-result-${item.matchId}`,
        JSON.stringify({
          home: item.home,
          away: item.away,
          status: item.status,
          elapsed: item.elapsed ?? null,
          apiFixtureId: item.apiFixtureId,
        })
      )

      await saveMatchResult(item.matchId, {
        home: item.home,
        away: item.away,
        status: item.status,
        elapsed: item.elapsed ?? null,
        apiFixtureId: item.apiFixtureId,
      })
    }


setSaved(true)
window.alert(`Synced ${synced.length} match updates.`)
  } catch (error) {
    console.error("Live score sync failed:", error)
    window.alert("Live score sync failed. Check console.")
  }
}
const publishAdminMessage = async () => {
  const cleanMessage = adminMessage.trim()
  if (!cleanMessage) return

  try {
    await saveGlobalMessage(cleanMessage)
    setSaved(true)
    window.alert("Message published!")
  } catch (error) {
    console.error("Message publish failed:", error)
    window.alert("Message failed to publish. Check Firebase rules.")
  }
}

const clearAdminMessage = async () => {
  try {
    await clearGlobalMessage()
    setAdminMessage("")
    setSaved(true)
    window.alert("Message cleared!")
  } catch (error) {
    console.error("Message clear failed:", error)
    window.alert("Message failed to clear. Check Firebase rules.")
  }
}

  if (!isAdmin) {
    return (
      <main className="min-h-screen px-4 pb-28 pt-6 md:pl-28 md:pr-8 md:pb-10">
        <section className="mx-auto max-w-2xl">
          <Card className="glass-card p-8 text-center">
            <Lock className="mx-auto mb-4 text-primary" />
            <h1 className="font-headline text-2xl font-black">Admin only</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Only trahbar23@gmail.com can update scores, qualifiers and knockout setup.
            </p>
          </Card>
        </section>

        <BottomNav />
      </main>
    )
  }

  return (
    <main className="min-h-screen px-4 pb-28 pt-6 md:pl-28 md:pr-8 md:pb-10">
      <section className="mx-auto max-w-7xl space-y-8">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-card/70 p-6 shadow-2xl backdrop-blur md:p-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-primary">
            <ShieldCheck size={14} /> Admin only
          </div>

          <h1 className="font-headline text-4xl font-black tracking-tight md:text-5xl">
            Manual Results & Knockout Setup
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
            This page is purely for you to populate final scores and the knockout
            bracket because the app is not using a live sports API. Whatever you
            save here becomes the source of truth for final scores, knockout
            fixtures and point calculations for everyone.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {saved && (
              <span className="inline-flex items-center gap-1 text-sm font-bold text-primary">
                <CheckCircle2 size={16} /> Saved online
              </span>
            )}
<Button
  className="rounded-2xl font-black"
  onClick={syncLiveScores}
>
  Sync Live Scores
</Button>
            <Button
              variant="outline"
              className="rounded-2xl"
              onClick={resetAdminData}
            >
              <RotateCcw size={15} className="mr-2" />
              Reset admin data
            </Button>
          </div>

          <div className="mt-6 rounded-3xl border border-white/10 bg-background/40 p-4">
            <h3 className="mb-3 font-black">Global Message</h3>

            <textarea
              value={adminMessage}
              onChange={(event) => setAdminMessage(event.target.value)}
              placeholder="Write a message for all users..."
              className="min-h-[120px] w-full rounded-2xl border border-border bg-background p-3 text-sm"
            />

            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                onClick={publishAdminMessage}
                className="rounded-2xl font-black"
                disabled={!adminMessage.trim()}
              >
                Publish Message
              </Button>

              <Button
                variant="outline"
                onClick={clearAdminMessage}
                className="rounded-2xl font-black"
              >
                Clear Message
              </Button>
            </div>
          </div>
        </div>

        <section className="space-y-4">
          <div>
           <button
  type="button"
  onClick={() => setOpenAdminSection(openAdminSection === "groups" ? "knockout" : "groups")}
  className="text-left font-headline text-2xl font-black"
>
  1. Group-stage final scores {openAdminSection === "groups" ? "▲" : "▼"}
</button>
            <p className="text-sm text-muted-foreground">
              Enter scores here after each match finishes. These feed the fixture
              pages and live leaderboard scoring.
            </p>
          </div>
{openAdminSection === "groups" && (
          <div className="grid gap-4 lg:grid-cols-2">
            {MATCHES.map((match) => {
              const score = scores[match.id] || { home: "", away: "" }
              const stored =
                typeof window !== "undefined"
                  ? window.localStorage.getItem(`wc-result-${match.id}`)
                  : null

              return (
                <Card
                  key={match.id}
                  className="rounded-3xl border border-white/10 bg-card/70 p-4 shadow-xl backdrop-blur"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <Badge
                      variant="outline"
                      className="rounded-full border-primary/30 bg-primary/10 px-3 py-1 text-xs font-black text-primary"
                    >
                      Group {match.group}
                    </Badge>

                    {stored && (
                      <span className="text-xs font-black text-primary">
                        Result saved
                      </span>
                    )}
                  </div>

                  <ScoreEditor
                    homeTeam={match.homeTeam}
                    awayTeam={match.awayTeam}
                    score={score}
                    onChange={(side, value) => updateScore(match.id, side, value)}
                  />

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button
                      className="rounded-2xl font-black"
                      onClick={() => saveScore(match.id)}
                      disabled={score.home === "" || score.away === ""}
                    >
                      Save result
                    </Button>

                    <Button
                      variant="outline"
                      className="rounded-2xl font-black"
                      onClick={() => clearScore(match.id)}
                    >
                      Clear
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
  )}
        </section>

        <section className="space-y-4">
          <div>
<button
  type="button"
  onClick={() =>
    setOpenAdminSection(
      openAdminSection === "qualifiers" ? "knockout" : "qualifiers"
    )
  }
  className="text-left font-headline text-2xl font-black"
>
  2. Qualified teams + bracket placement{" "}
  {openAdminSection === "qualifiers" ? "▲" : "▼"}
</button>
            <p className="text-sm text-muted-foreground">
              Select official qualifiers from each group. You can select up to 3
              per group so the best third-place teams can be handled. Once
              selected, place each qualified team into a knockout slot.
            </p>
          </div>
{openAdminSection === "qualifiers" && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {GROUPS.map((group) => {
              const picked = qualifiers[group.id] || []

              return (
                <Card
                  key={group.id}
                  className="rounded-3xl border border-white/10 bg-card/70 p-4 shadow-xl backdrop-blur"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-headline text-lg font-black">
                      {group.name}
                    </h3>
                    <span className="text-xs font-bold text-muted-foreground">
                      {picked.length}/3 selected
                    </span>
                  </div>

                  <div className="space-y-2">
                    {group.teams.map((team) => {
                      const active = picked.includes(team.id)
                      const currentSlot =
                        Object.entries(slots).find(
                          ([, selectedTeamId]) => selectedTeamId === team.id
                        )?.[0] || ""

                      return (
                        <div
                          key={team.id}
                          className={`rounded-2xl border p-3 transition ${
                            active
                              ? "border-primary bg-primary/10"
                              : "border-border bg-background/40"
                          }`}
                        >
                          <button
                            onClick={() => {
                              toggleQualifier(group.id, team.id)
                           if (active) clearSlotForTeam(team.id)
                            }}
                            className="flex w-full items-center gap-3 text-left"
                          >
                            <TeamFlag team={team} className="h-7 w-10 rounded-lg" />
                            <span className="font-black">{team.name}</span>
                            {active && <Trophy size={16} className="ml-auto text-primary" />}
                          </button>

                          {active && (
                            <label className="mt-3 block text-xs font-bold text-muted-foreground">
                              Knockout slot
                              <select
                                value={currentSlot}
                                onChange={(event) => {
                                  if (currentSlot) setSlot(currentSlot, "")
                                  if (event.target.value) {
                                    setSlot(event.target.value, team.id)
                                  }
                                }}
                                className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm font-bold text-foreground"
                              >
                                <option value="">Not placed yet</option>
                                <option disabled>────────── Select the correct round below ──────────</option>

{KNOCKOUT_ROUNDS.map((round) => (
  <optgroup key={round.id} label={round.name}>
    {KNOCKOUT_SLOTS
      .filter((slot) => slot.round === round.id)
      .map((slot) => {
        const selectedBy = slots[slot.id]
        const selectedTeam = getTeamById(selectedBy)
        const disabled = Boolean(selectedBy && selectedBy !== team.id)

        return (
          <option key={slot.id} value={slot.id} disabled={disabled}>
            {slot.label}
            {selectedTeam && selectedTeam.id !== team.id
              ? ` — used by ${selectedTeam.name}`
              : ""}
          </option>
        )
      })}
  </optgroup>
))}
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
  )}
        </section>

        <section className="space-y-4">
          <div>
<button
  type="button"
  onClick={() =>
    setOpenAdminSection(
      openAdminSection === "overview" ? "knockout" : "overview"
    )
  }
  className="text-left font-headline text-2xl font-black"
>
  3. Knockout bracket overview{" "}
  {openAdminSection === "overview" ? "▲" : "▼"}
</button>
            <p className="text-sm text-muted-foreground">
              This is a quick admin view of which teams are in each knockout slot.
              Empty slots stay as TBC for players.
            </p>
          </div>
{openAdminSection === "overview" && (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {KNOCKOUT_ROUNDS.map((round) => (
              <Card
                key={round.id}
                className="rounded-3xl border border-white/10 bg-card/70 p-4 shadow-xl backdrop-blur"
              >
                <h3 className="font-headline text-lg font-black">
                  {round.name}
                </h3>

                <div className="mt-3 grid gap-2">
                  {KNOCKOUT_SLOTS.filter((slot) => slot.round === round.id).map(
                    (slot) => {
                      const team = getTeamById(slots[slot.id])

                      return (
                        <div
                          key={slot.id}
                          className="flex items-center gap-2 rounded-2xl bg-background/45 p-2 ring-1 ring-border"
                        >
                          <span className="w-20 shrink-0 text-[10px] font-black uppercase text-muted-foreground">
                            {slot.label}
                          </span>

                          {team ? (
                            <>
                              <TeamFlag
                                team={team}
                                className="h-6 w-9 rounded-md"
                              />
                              <span className="truncate text-sm font-black">
                                {team.name}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm font-bold text-muted-foreground">
                              TBC
                            </span>
                          )}
                        </div>
                      )
                    }
                  )}
                </div>
              </Card>
            ))}
          </div>
  )}
        </section>
       <section className="space-y-4">
  <div>
    <h2 className="font-headline text-2xl font-black">
      3B. Emergency knockout slot repair
    </h2>
    <p className="text-sm text-muted-foreground">
      Use this if a team was accidentally moved from an old round. This lets you directly restore any R32, R16, QF, SF or Final slot without touching scores.
    </p>
  </div>

  <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
    {KNOCKOUT_ROUNDS.map((round) => (
      <Card
        key={round.id}
        className="rounded-3xl border border-white/10 bg-card/70 p-4 shadow-xl backdrop-blur"
      >
        <h3 className="mb-3 font-headline text-lg font-black">
          {round.name}
        </h3>

        <div className="space-y-3">
          {KNOCKOUT_SLOTS.filter((slot) => slot.round === round.id).map((slot) => {
            const currentTeam = getTeamById(slots[slot.id])

            return (
              <label key={slot.id} className="block text-xs font-bold text-muted-foreground">
                {slot.label}
                <select
                  value={slots[slot.id] || ""}
                  onChange={(event) => setSlot(slot.id, event.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm font-bold text-foreground"
                >
                  <option value="">Empty / TBC</option>
                  {Object.values(GROUPS)
                    .flatMap((group) => group.teams)
                    .map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name} {currentTeam?.id === team.id ? "✓" : ""}
                      </option>
                    ))}
                </select>
              </label>
            )
          })}
        </div>
      </Card>
    ))}
  </div>
</section>
        <section className="space-y-4">
          <div>
            <h2 className="font-headline text-2xl font-black">
              4. Knockout final scores
            </h2>
            <p className="text-sm text-muted-foreground">
              When knockout matches are played, enter the final score here. These
              results are used for knockout prediction scoring locally.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {KNOCKOUT_FIXTURES.map((fixture) => {
              const score = koScores[fixture.id] || { home: "", away: "" }
              const homeTeam = getTeamById(slots[fixture.homeSlot])
              const awayTeam = getTeamById(slots[fixture.awaySlot])
              const stored =
                typeof window !== "undefined"
                  ? window.localStorage.getItem(`wc-ko-result-${fixture.id}`)
                  : null

              return (
                <Card
                  key={fixture.id}
                  className="rounded-3xl border border-white/10 bg-card/70 p-4 shadow-xl backdrop-blur"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <Badge
                      variant="outline"
                      className="rounded-full border-primary/30 bg-primary/10 px-3 py-1 text-xs font-black text-primary"
                    >
                      {fixture.roundName} · M{fixture.matchNumber}
                    </Badge>

                    {stored && (
                      <span className="text-xs font-black text-primary">
                        Result saved
                      </span>
                    )}
                  </div>

                  <ScoreEditor
                    homeTeam={homeTeam}
                    awayTeam={awayTeam}
                    homePlaceholder={fixture.homeSlot}
                    awayPlaceholder={fixture.awaySlot}
                    score={score}
                    onChange={(side, value) => updateKoScore(fixture.id, side, value)}
                  />
<div className="mt-4 grid gap-2 sm:grid-cols-2">
  <label className="text-xs font-bold text-muted-foreground">
    Result type
    <select
      value={koDecidedBy[fixture.id] || "normal"}
      onChange={(event) =>
        setKoDecidedBy((prev) => ({
          ...prev,
          [fixture.id]: event.target.value as "normal" | "extraTime" | "penalties",
        }))
      }
      className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm font-bold text-foreground"
    >
      <option value="normal">Normal time</option>
      <option value="extraTime">After extra time</option>
      <option value="penalties">Penalties</option>
    </select>
  </label>

  {(koDecidedBy[fixture.id] || "normal") === "penalties" && (
    <label className="text-xs font-bold text-muted-foreground">
      Penalty winner
      <select
        value={koWinnerSide[fixture.id] || ""}
        onChange={(event) =>
          setKoWinnerSide((prev) => ({
            ...prev,
            [fixture.id]: event.target.value as "home" | "away" | "",
          }))
        }
        className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm font-bold text-foreground"
      >
        <option value="">Select winner</option>
        <option value="home">{homeTeam?.name || fixture.homeSlot}</option>
        <option value="away">{awayTeam?.name || fixture.awaySlot}</option>
      </select>
    </label>
  )}
</div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button
                      className="rounded-2xl font-black"
                      onClick={() => saveKoScore(fixture.id)}
                      disabled={
                        score.home === "" ||
                        score.away === "" ||
                        !homeTeam ||
                        !awayTeam
                      }
                    >
                      Save result
                    </Button>

                    <Button
                      variant="outline"
                      className="rounded-2xl font-black"
                      onClick={() => clearKoScore(fixture.id)}
                    >
                      Clear
                    </Button>
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

function ScoreEditor({
  homeTeam,
  awayTeam,
  homePlaceholder = "TBC",
  awayPlaceholder = "TBC",
  score,
  onChange,
}: {
  homeTeam: any
  awayTeam: any
  homePlaceholder?: string
  awayPlaceholder?: string
  score: { home: number | ""; away: number | "" }
  onChange: (side: "home" | "away", value: string) => void
}) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
      <TeamMini team={homeTeam} placeholder={homePlaceholder} />

      <div className="flex items-center gap-2 rounded-2xl bg-background/55 p-2 ring-1 ring-border">
        <Input
          type="number"
          inputMode="numeric"
          value={score.home}
          onChange={(event) => onChange("home", event.target.value)}
          placeholder="-"
          className="h-11 w-14 rounded-xl p-0 text-center text-lg font-black"
        />

        <span className="font-black text-muted-foreground">:</span>

        <Input
          type="number"
          inputMode="numeric"
          value={score.away}
          onChange={(event) => onChange("away", event.target.value)}
          placeholder="-"
          className="h-11 w-14 rounded-xl p-0 text-center text-lg font-black"
        />
      </div>

      <TeamMini team={awayTeam} placeholder={awayPlaceholder} right />
    </div>
  )
}

function TeamMini({
  team,
  placeholder,
  right = false,
}: {
  team: any
  placeholder?: string
  right?: boolean
}) {
  if (!team) {
    return (
      <div
        className={`min-w-0 text-sm font-black text-muted-foreground ${
          right ? "text-right" : ""
        }`}
      >
        {placeholder || "TBC"}
      </div>
    )
  }

  return (
    <div
      className={`flex min-w-0 items-center gap-2 ${
        right ? "flex-row-reverse text-right" : ""
      }`}
    >
      <TeamFlag team={team} className="h-8 w-12 rounded-lg" />

      <div className="min-w-0">
        <div className="truncate text-sm font-black" title={team.name}>
          {team.name}
        </div>
        <div className="text-[10px] font-bold uppercase text-muted-foreground">
          {team.code}
        </div>
      </div>
    </div>
  )
}
