"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { BottomNav } from "@/components/BottomNav"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Users, Star, Calculator } from "lucide-react"
import { getTeamById } from "@/lib/mock-data"
import { TeamFlag } from "@/components/TeamFlag"
import { useAuth } from "@/components/AuthGate"
import {
  calculateScoreFromData,
  type SavedPick,
  type SavedResult,
} from "@/lib/scoring"
import {
  getLeaderboardData,
  type League,
  type MatchPrediction,
  type UserDoc,
  type LeagueMember,
} from "@/lib/firebase-service"

export default function LeaderboardPage() {
  const { user, isAdmin } = useAuth()
const searchParams = useSearchParams()
const selectedLeagueId = searchParams.get("league")
  const [users, setUsers] = useState<Record<string, UserDoc>>({})
  const [predictions, setPredictions] = useState<MatchPrediction[]>([])
  const [results, setResults] = useState<Record<string, SavedResult>>({})
  const [qualifiers, setQualifiers] = useState<Record<string, string[]>>({})
  const [allMembers, setAllMembers] = useState<LeagueMember[]>([])
  const [myLeagueIds, setMyLeagueIds] = useState<string[]>([])
  const [leagueMap, setLeagueMap] = useState<Record<string, League>>({})
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false)

const refreshLeaderboard = async () => {
  if (!user) return

  setLoadingLeaderboard(true)

  try {
    const data = await getLeaderboardData(user.uid)

    setUsers(data.users)
    setPredictions(data.predictions)
    setResults(data.results)
    setQualifiers(data.qualifiers)
    setAllMembers(data.allMembers)
    setMyLeagueIds(data.myLeagueIds)
    setLeagueMap(data.leagueMap)
  } finally {
    setLoadingLeaderboard(false)
  }
}

useEffect(() => {
  refreshLeaderboard()
}, [user])

  const winnerPicksByUser = useMemo(() => {
    const out: Record<string, string> = {}

    predictions.forEach((prediction: any) => {
      if (
        prediction.type === "tournamentWinner" &&
        prediction.userId &&
        prediction.teamId
      ) {
        out[prediction.userId] = prediction.teamId
      }
    })

    return out
  }, [predictions])

  const scores = useMemo(() => {
    const byUser: Record<
      string,
      {
        matchPredictions: Record<string, SavedPick>
        knockoutPredictions: Record<string, SavedPick>
        groupPredictions: Record<string, string[]>
      }
    > = {}

    predictions.forEach((prediction: any) => {
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

    Object.entries(results).forEach(([id, score]) => {
      if (id.startsWith("ko_")) knockoutResults[id.replace("ko_", "")] = score
      else groupResults[id] = score
    })

    return Object.entries(byUser)
      .map(([userId, data]) => ({
        userId,
        score: calculateScoreFromData({
          ...data,
          results: groupResults,
          knockoutResults,
          qualifiers,
          tournamentWinnerPick: winnerPicksByUser[userId],
        }),
        profile: users[userId],
      }))
      .sort((a, b) => b.score.total - a.score.total)
  }, [predictions, results, qualifiers, users, winnerPicksByUser])

  const myScore = scores.find((score) => score.userId === user?.uid)?.score || {
    total: 0,
    matchPoints: 0,
    groupPoints: 0,
    winnerPoints: 0,
  }

  const overallRows = useMemo(() => {
    return Object.entries(users)
      .filter(([_, profile]) => profile?.actualName || profile?.displayName)
      .map(([userId, profile]) => {
        const scored = scores.find((score) => score.userId === userId)
const selectedRow = selectedUserId
  ? scores.find((score) => score.userId === selectedUserId) ||
    overallRows.find((row) => row.userId === selectedUserId)
  : null
        return (
          scored || {
            userId,
            score: { total: 0, matchPoints: 0, groupPoints: 0, winnerPoints: 0 },
            profile,
          }
        )
      })
      .sort((a, b) => b.score.total - a.score.total)
  }, [users, scores])

  return (
    <main className="min-h-screen pb-24 pt-6 px-4 md:pb-8 md:pl-28 md:pr-8 max-w-lg mx-auto md:max-w-5xl">
     <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  <div>
    <h1 className="text-3xl font-headline font-bold mb-2">Leaderboard</h1>
    <p className="text-muted-foreground text-sm">
      Leaderboards update when refreshed.
    </p>
  </div>

  <button
    type="button"
    onClick={refreshLeaderboard}
    disabled={loadingLeaderboard}
    className="rounded-2xl bg-primary px-4 py-3 text-sm font-black text-primary-foreground shadow-lg shadow-primary/20 disabled:opacity-60"
  >
    {loadingLeaderboard ? "Refreshing..." : "Refresh leaderboard"}
  </button>
</header>

      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <Stat label="Your total" value={myScore.total} icon={<Trophy size={18} />} />
        <Stat label="Match points" value={myScore.matchPoints} icon={<Calculator size={18} />} />
        <Stat label="Group points" value={myScore.groupPoints} icon={<Users size={18} />} />
        <Stat label="Winner points" value={myScore.winnerPoints || 0} icon={<Star size={18} />} />
      </div>

      <Tabs defaultValue="my-leagues" className="space-y-6">
       <TabsList className={`glass-card w-full grid p-1 h-12 ${isAdmin ? "grid-cols-2" : "grid-cols-1"}`}>
          <TabsTrigger
            value="my-leagues"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg font-bold"
          >
            My Leagues
          </TabsTrigger>
         {isAdmin && (
         <TabsTrigger
            value="overall"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg font-bold"
          >
            Overall
          </TabsTrigger>
      )}
        </TabsList>

        <TabsContent value="my-leagues" className="space-y-4">
          {myLeagueIds.length === 0 ? (
            <EmptyState
              title="No league leaderboard yet"
              text="Create or join a league first."
            />
          ) : (
           myLeagueIds
  .filter((leagueId) => !selectedLeagueId || leagueId === selectedLeagueId)
  .map((leagueId) => {
              const members = allMembers
                .filter((member) => member.leagueId === leagueId && member.userId)
                .map((member) => member.userId)

              const rows = members
                .map((memberId) => {
                  const scored = scores.find((score) => score.userId === memberId)

                  return (
                    scored || {
                      userId: memberId,
                      score: {
                        total: 0,
                        matchPoints: 0,
                        groupPoints: 0,
                        winnerPoints: 0,
                      },
                      profile: users[memberId],
                    }
                  )
                })
                .filter((row) => row.profile?.actualName || row.profile?.displayName)
                .sort((a, b) => b.score.total - a.score.total)

              const league = leagueMap[leagueId]

              return (
                <Card key={leagueId} className="glass-card p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Users className="text-primary" size={20} />
                    </div>

                    <div>
                      <h2 className="font-headline font-bold">
                        {league?.name || leagueId}
                      </h2>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        League code {leagueId}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {rows.length ? (
                      rows.map((row, index) => (
                        <PlayerRow
                          key={row.userId}
                          rank={index + 1}
                          userId={row.userId}
                          profile={row.profile}
                          score={row.score.total}
                          isYou={row.userId === user?.uid}
                          winnerTeam={getTeamById(winnerPicksByUser[row.userId])}
                          onClick={() => setSelectedUserId(row.userId)}
                        />
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No predictions yet.
                      </p>
                    )}
                  </div>
                </Card>
              )
            })
          )}
        </TabsContent>

       {isAdmin && (
        <TabsContent value="overall" className="space-y-3">
          {overallRows.length ? (
            overallRows.map((row, index) => (
              <PlayerRow
                key={row.userId}
                rank={index + 1}
                userId={row.userId}
                profile={row.profile}
                score={row.score.total}
                isYou={row.userId === user?.uid}
                winnerTeam={getTeamById(winnerPicksByUser[row.userId])}
                onClick={() => setSelectedUserId(row.userId)}
              />
            ))
          ) : (
            <EmptyState
              title="Leaderboard is blank"
              text="It will populate when users save predictions."
            />
          )}
        </TabsContent>
      )}
      </Tabs>
{selectedRow && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
    <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-[2rem] border border-white/10 bg-background p-5 shadow-2xl">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">
            Player details
          </p>

          <h2 className="mt-1 font-headline text-2xl font-black">
            @{selectedRow.profile?.displayName || "player"}
          </h2>

          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {selectedRow.profile?.actualName || selectedRow.userId}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSelectedUserId(null)}
          className="rounded-full bg-muted px-3 py-2 text-xs font-black"
        >
          Close
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <Stat label="Total" value={selectedRow.score.total} icon={<Trophy size={16} />} />
        <Stat label="Match" value={selectedRow.score.matchPoints} icon={<Calculator size={16} />} />
        <Stat label="Groups" value={selectedRow.score.groupPoints} icon={<Users size={16} />} />
        <Stat label="Winner" value={selectedRow.score.winnerPoints || 0} icon={<Star size={16} />} />
      </div>

      <div className="mt-5 rounded-2xl bg-muted/40 p-4 text-sm font-bold text-muted-foreground">
        Prediction details will go here next.
      </div>
    </div>
  </div>
)}
      <BottomNav />
    </main>
  )
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string
  value: number
  icon: React.ReactNode
}) {
  return (
    <Card className="glass-card p-4">
      <div className="flex items-center justify-between text-primary">
        {icon}
        <span className="text-2xl font-headline font-black">{value}</span>
      </div>
      <p className="mt-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
    </Card>
  )
}

function PlayerRow({
  rank,
  profile,
  score,
  isYou,
  userId,
  winnerTeam,
  onClick,onClick?: () => void
}: {
  rank: number
  profile?: UserDoc
  score: number
  isYou: boolean
  userId: string
  winnerTeam?: any
}) {
  const username = profile?.displayName || "player"
  const realName = profile?.actualName || `Player ${userId.slice(0, 4)}`

  return (
    return (
  <button
    type="button"
    onClick={onClick}
    className="w-full text-left"
  >
    <Card className="bg-card/70 border-border p-4 flex items-center justify-between transition hover:bg-muted/40">
      <div className="flex items-center gap-4 min-w-0">
        <span className="text-sm font-bold font-headline w-6 text-center text-primary">
          {rank}
        </span>

        <Avatar className="w-10 h-10 border border-border">
          <AvatarFallback className="text-xl">
            {profile?.avatar || "⚽"}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0">
          <h4 className="font-bold text-sm leading-tight flex items-center gap-2">
            <span className="truncate">@{username}</span>

            {isYou && (
              <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter">
                You
              </span>
            )}

            {winnerTeam && (
              <span title={`Winner pick: ${winnerTeam.name}`}>
                <TeamFlag
                  team={winnerTeam}
                  className="h-6 w-6 rounded-full object-cover"
                />
              </span>
            )}
          </h4>

          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest flex items-center gap-1">
            <Star size={8} fill="currentColor" /> {realName}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-end pl-3">
        <span className="font-headline font-bold text-lg">{score}</span>
        <span className="text-[10px] text-muted-foreground font-bold uppercase">
          pts
        </span>
      </div>
    </Card>
  </button>
)
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <Card className="glass-card p-8 text-center">
      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <Trophy className="text-primary" />
      </div>
      <h3 className="font-headline font-bold text-xl mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{text}</p>
    </Card>
  )
}
