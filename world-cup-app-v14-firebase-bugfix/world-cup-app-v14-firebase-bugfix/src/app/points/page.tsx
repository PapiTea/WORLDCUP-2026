"use client"

import { useEffect, useMemo, useState } from "react"
import { BottomNav } from "@/components/BottomNav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/AuthGate"
import { MATCHES, KNOCKOUT_FIXTURES, getTeamById } from "@/lib/mock-data"
import {
  calculateScoreFromData,
  scoreMatchPick,
  type SavedPick,
  type SavedResult,
} from "@/lib/scoring"
import {
  getLeaderboardData,
saveMatchPrediction,
  type LeagueMember,
  type League,
  type MatchPrediction,
  type UserDoc,
} from "@/lib/firebase-service"
import { TeamFlag } from "@/components/TeamFlag"
type PointsData = {
  users: Record<string, UserDoc>
  predictions: MatchPrediction[]
  results: Record<string, SavedResult>
  qualifiers: Record<string, string[]>
  allMembers: LeagueMember[]
  myLeagueIds: string[]
  leagueMap: Record<string, League>
}

export default function PointsPage() {
  const { user, isAdmin } = useAuth()

  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PointsData | null>(null)
  const [openUserId, setOpenUserId] = useState<string | null>(null)

  const refreshPoints = async () => {
    if (!user) return

    setLoading(true)

    try {
      const fresh = await getLeaderboardData(user.uid)
      setData(fresh as PointsData)
    } finally {
      setLoading(false)
    }
  }

useEffect(() => {
  if (user && isAdmin) {
    refreshPoints()
  }
}, [user, isAdmin])
const exportCsv = () => {
  if (!data) return

  const rowsForExport: string[][] = [
    [
      "User",
      "Actual Name",
      "Type",
      "Match / Group",
      "Pick",
      "Result",
      "Confidence",
      "Points",
      "Reason",
    ],
  ]

  rows.forEach((row) => {
    MATCHES.forEach((match) => {
      const pick = row.userData.matchPredictions[match.id] || null
      const result = row.groupResults[match.id] || null
      const points = scoreMatchPick(pick, result)

      rowsForExport.push([
        row.profile?.displayName || "player",
        row.profile?.actualName || row.userId,
        "Group Match",
        `${match.homeTeam.name} v ${match.awayTeam.name}`,
        pick ? `="${pick.home}-${pick.away}"` : "",
       result ? `="${result.home}-${result.away}"` : "",
        pick?.confidence ? "Yes" : "No",
        String(points.total),
        points.reason,
      ])
    })

    KNOCKOUT_FIXTURES.forEach((fixture) => {
      const pick = row.userData.knockoutPredictions[fixture.id] || null
      const result = row.knockoutResults[fixture.id] || null
      const points = scoreMatchPick(pick, result)

      rowsForExport.push([
        row.profile?.displayName || "player",
        row.profile?.actualName || row.userId,
        "Knockout Match",
        `${fixture.roundName} - M${fixture.matchNumber}`,
        pick ? `="${pick.home}-${pick.away}"` : "",
        result ? `="${result.home}-${result.away}"` : "",
        pick?.confidence ? "Yes" : "No",
        String(points.total),
        points.reason,
      ])
    })

    Object.entries(row.userData.groupPredictions).forEach(([groupId, picks]) => {
      rowsForExport.push([
        row.profile?.displayName || "player",
        row.profile?.actualName || row.userId,
        "Group Qualifiers",
        `Group ${groupId}`,
        picks.join(" / "),
        "",
        "",
        "",
        "",
      ])
    })

    rowsForExport.push([
      row.profile?.displayName || "player",
      row.profile?.actualName || row.userId,
      "Tournament Winner",
      "Winner",
      row.winnerPick || "",
      "",
      "",
      String(row.score.winnerPoints || 0),
      "",
    ])
  })

  const csv = rowsForExport
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(",")
    )
    .join("\n")

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = "world-cup-predictions-export.csv"
  link.click()

  URL.revokeObjectURL(url)
}
  const rows = useMemo(() => {
    if (!data) return []

    const winnerPicksByUser: Record<string, string> = {}

    data.predictions.forEach((prediction: any) => {
      if (
        prediction.type === "tournamentWinner" &&
        prediction.userId &&
        prediction.teamId
      ) {
        winnerPicksByUser[prediction.userId] = prediction.teamId
      }
    })

    const byUser: Record<
      string,
      {
        matchPredictions: Record<string, SavedPick>
        knockoutPredictions: Record<string, SavedPick>
        groupPredictions: Record<string, string[]>
      }
    > = {}

    data.predictions.forEach((prediction: any) => {
      if (!prediction.userId) return

      byUser[prediction.userId] ||= {
        matchPredictions: {},
        knockoutPredictions: {},
        groupPredictions: {},
      }

      if (prediction.type === "group" && prediction.matchId) {
        byUser[prediction.userId].matchPredictions[prediction.matchId] = {
          home: prediction.home,
          away: prediction.away,
          confidence: prediction.confidence,
        }
      }

      if (prediction.type === "knockout" && prediction.matchId) {
        byUser[prediction.userId].knockoutPredictions[prediction.matchId] = {
          home: prediction.home,
          away: prediction.away,
          confidence: prediction.confidence,
        }
      }

      if (prediction.type === "qualifiers" && prediction.groupId) {
        byUser[prediction.userId].groupPredictions[prediction.groupId] =
          prediction.picks || []
      }
    })

    const knockoutResults: Record<string, SavedResult> = {}
    const groupResults: Record<string, SavedResult> = {}

    Object.entries(data.results).forEach(([id, score]) => {
      if (id.startsWith("ko_")) {
        knockoutResults[id.replace("ko_", "")] = score
      } else {
        groupResults[id] = score
      }
    })
 return Object.entries(data.users)
      .map(([userId, profile]) => {
        const userData = byUser[userId] || {
          matchPredictions: {},
          knockoutPredictions: {},
          groupPredictions: {},
        }

        const score = calculateScoreFromData({
          ...userData,
          results: groupResults,
          knockoutResults,
          qualifiers: data.qualifiers,
          tournamentWinnerPick: winnerPicksByUser[userId],
        })

        return {
          userId,
          profile,
          userData,
          score,
          winnerPick: winnerPicksByUser[userId],
          groupResults,
          knockoutResults,
        }
      })
      .filter((row) => row.profile?.actualName || row.profile?.displayName)
      .sort((a, b) => b.score.total - a.score.total)
  }, [data])

  if (!user) {
    return (
      <main className="min-h-screen px-4 py-8">
        <Card className="glass-card p-6">Please log in.</Card>
      </main>
    )
  }

if (!isAdmin) {
  return (
    <main className="min-h-screen px-4 py-8">
      <Card className="glass-card p-6">
        You do not have access to this page.
      </Card>
    </main>
  )
}

  return (
    <main className="min-h-screen px-4 pb-28 pt-6 md:pl-28 md:pr-8 md:pb-10">
      <section className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-headline text-3xl font-black">
              Points!
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Refresh using the button to view prediction points.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={refreshPoints}
            disabled={loading}
            className="h-11 rounded-2xl font-black"
          >
            {loading ? "Refreshing..." : "Refresh points"}
          </Button>
        <Button
    type="button"
    variant="outline"
    onClick={exportCsv}
    disabled={!data}
    className="h-11 rounded-2xl font-black"
  >
    Export CSV
  </Button>
            </div>
          </header>

        <div className="space-y-4">
          {rows.map((row, index) => {
            const isOpen = openUserId === row.userId

            return (
              <Card key={row.userId} className="glass-card p-4">
                <button
                  type="button"
                  onClick={() => setOpenUserId(isOpen ? null : row.userId)}
                  className="flex w-full items-center justify-between gap-4 text-left"
                >
                 <div>
  <div className="flex items-center gap-2">
    <Badge variant="outline">#{index + 1}</Badge>

    <h2 className="font-headline text-lg font-black">
      @{row.profile?.displayName || "player"}
    </h2>

    {row.winnerPick && getTeamById(row.winnerPick) && (
      <TeamFlag
        team={getTeamById(row.winnerPick)!}
        className="h-5 w-8 rounded object-cover"
      />
    )}
  </div>

  <p className="mt-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
    {row.profile?.actualName || row.userId}
  </p>
</div>
                  <div className="text-right">
                    <div className="font-headline text-2xl font-black text-primary">
                      {row.score.total}
                    </div>

                    <div className="text-[10px] font-black uppercase text-muted-foreground">
                      pts
                    </div>
                  </div>
                </button>

                <div className="mt-4 grid grid-cols-4 gap-2">
                  <MiniStat label="Match" value={row.score.matchPoints} />
                  <MiniStat label="Groups" value={row.score.groupPoints} />
                  <MiniStat label="Winner" value={row.score.winnerPoints || 0} />
                  <MiniStat label="Total" value={row.score.total} />
                </div>

                {isOpen && (
                  <div className="mt-5 space-y-5 border-t border-border pt-5">
                    <section>
                      <h3 className="mb-3 font-headline font-black">
                        Group match predictions
                      </h3>

                      <div className="space-y-2">
                        {MATCHES.map((match) => {
                          const pick =
                            row.userData.matchPredictions[match.id] || null
                          const result = row.groupResults[match.id] || null
                          const points = scoreMatchPick(pick, result)

                          return (
<PredictionLine
  key={match.id}
  userId={row.userId}
  matchId={match.id}
  type="group"
  title={`${match.homeTeam.name} v ${match.awayTeam.name}`}
  homeTeam={match.homeTeam}
  awayTeam={match.awayTeam}
  pick={pick}
  result={result}
  points={points.total}
  confidence={Boolean(pick?.confidence)}
  reason={points.reason}
  onSaved={refreshPoints}
/>
                          )
                        })}
                      </div>
                    </section>

                    <section>
                      <h3 className="mb-3 font-headline font-black">
                        Knockout predictions
                      </h3>

                      <div className="space-y-2">
                        {KNOCKOUT_FIXTURES.map((fixture) => {
                          const pick =
                            row.userData.knockoutPredictions[fixture.id] || null
                          const result = row.knockoutResults[fixture.id] || null
                          const points = scoreMatchPick(pick, result)

                          return (
                            <PredictionLine
  key={fixture.id}
  userId={row.userId}
  matchId={fixture.id}
  type="knockout"
  title={`${fixture.roundName} - M${fixture.matchNumber}`}
  pick={pick}
  result={result}
  points={points.total}
  confidence={Boolean(pick?.confidence)}
  reason={points.reason}
  onSaved={refreshPoints}
/>                          )
                        })}
                      </div>
                    </section>

                    <section>
                      <h3 className="mb-3 font-headline font-black">
                        Group qualifiers
                      </h3>

                      <div className="grid gap-2 sm:grid-cols-2">
                       {Object.keys(row.userData.groupPredictions).length === 0 && (
  <div className="rounded-2xl bg-muted/40 px-4 py-3 text-sm font-bold text-muted-foreground">
    No group picks saved.
  </div>
)}
                        {Object.entries(row.userData.groupPredictions).map(
                          ([groupId, picks]) => (
                            <div
                              key={groupId}
                              className="rounded-2xl bg-muted/40 px-4 py-3 text-sm"
                            >
                              <span className="font-black">Group {groupId}: </span>
<div className="mt-2 flex flex-wrap gap-2">
  {picks.map((teamId) => {
    const team = getTeamById(teamId)

    if (!team) return null

    return (
      <div
        key={teamId}
        className="flex items-center gap-2 rounded-xl bg-background/60 px-2 py-1"
      >
        <TeamFlag
          team={team}
          className="h-5 w-8 rounded object-cover"
        />

<span className="text-xs font-black uppercase">
  {team.code}
</span>
      </div>
    )
  })}
</div>
                            </div>
                          )
                        )}
                      </div>
                    </section>

                   <section>
  <h3 className="mb-3 font-headline font-black">
    Tournament winner
  </h3>

  <div className="rounded-2xl bg-muted/40 px-4 py-3">
    {row.winnerPick && getTeamById(row.winnerPick) ? (
      <div className="flex items-center gap-3">
        <TeamFlag
          team={getTeamById(row.winnerPick)!}
          className="h-8 w-12 rounded-lg object-cover"
        />

        <span className="font-black">
          {getTeamById(row.winnerPick)?.name}
        </span>
      </div>
    ) : (
      <span className="text-sm font-bold text-muted-foreground">
        No winner selected
      </span>
    )}
  </div>
</section>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      </section>

      <BottomNav />
    </main>
  )
}

function MiniStat({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div className="min-w-[72px] rounded-2xl bg-muted/40 px-2 py-3 text-center">
      <div className="text-lg font-black text-primary">
        {value}
      </div>

      <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
    </div>
  )
}
function PredictionLine({
  userId,
  matchId,
  type,
  title,
  homeTeam,
  awayTeam,
  pick,
  result,
  points,
  confidence,
  reason,
  onSaved,
}: {
  userId: string
  matchId: string
  type: "group" | "knockout"
  title: string
  homeTeam?: any
  awayTeam?: any
  pick: SavedPick | null
  result: SavedResult | null
  points: number
  confidence: boolean
  reason: string
  onSaved: () => void
}) {
  const [saving, setSaving] = useState(false)

  const toggleConfidence = async () => {
    if (!pick) return

    setSaving(true)

try {
  await saveMatchPrediction(userId, matchId, type, {
    home: pick.home,
    away: pick.away,
    confidence: !confidence,
  })

  await onSaved()
} catch (error) {
  console.error("CONFIDENCE ERROR:", error)
  alert("Confidence update failed. Check console.")
} finally {
  setSaving(false)
}
  }

  return (
    <div className="rounded-2xl bg-muted/35 p-3 text-sm">
      <div className="mb-2 flex items-center gap-2 font-black">
        {homeTeam && (
          <TeamFlag
            team={homeTeam}
            className="h-5 w-7 rounded object-cover"
          />
        )}

        <span>{title}</span>

        {awayTeam && (
          <TeamFlag
            team={awayTeam}
            className="h-5 w-7 rounded object-cover"
          />
        )}
      </div>

      <div className="grid grid-cols-3 items-center gap-2 text-center">
        <div className="rounded-xl bg-background/60 px-3 py-2">
          <div className="text-[10px] font-black uppercase text-muted-foreground">
            Pick
          </div>
          <div className="font-black">
            {pick ? `${pick.home} - ${pick.away}` : "-"}
          </div>
        </div>

        <div className="rounded-xl bg-background/60 px-3 py-2">
          <div className="text-[10px] font-black uppercase text-muted-foreground">
            Result
          </div>
          <div className="font-black">
            {result ? `${result.home} - ${result.away}` : "-"}
          </div>
        </div>

        <div className="rounded-xl bg-primary px-3 py-2 text-primary-foreground">
          <div className="text-[10px] font-black uppercase opacity-80">
            Points
          </div>
          <div className="font-black">
            {points > 0 ? "+" : ""}
            {points}
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 text-xs font-bold text-muted-foreground">
        <span>{reason}</span>

        <button
          type="button"
          onClick={toggleConfidence}
          disabled={!pick || saving}
          className={`rounded-full px-2 py-1 font-black ${
            confidence
              ? "bg-primary/10 text-primary"
              : "bg-background/60 text-muted-foreground"
          } disabled:opacity-40`}
        >
          {saving
            ? "Saving..."
            : confidence
              ? "⚡ Confidence ON"
              : "Confidence OFF"}
        </button>
      </div>
    </div>
  )
}

