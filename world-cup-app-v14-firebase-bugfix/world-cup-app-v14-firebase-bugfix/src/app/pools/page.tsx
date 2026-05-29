"use client"

import { useEffect, useMemo, useState } from "react"
import { BottomNav } from "@/components/BottomNav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Users,
  Plus,
  Share2,
  Crown,
  Copy,
  Link as LinkIcon,
  Trash2,
  ShieldCheck,
  UserMinus,
  UserCircle,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { FOOTBALL_AVATARS, type UserProfile } from "@/lib/profile"
import { useAuth } from "@/components/AuthGate"
import { doc, serverTimestamp, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import {
  createLeague,
  deleteLeague,
  joinLeague,
  leaveLeague,
  subscribeLeagues,
  subscribeMyLeagueMemberships,
  subscribeAllLeagueMembers,
  subscribeUsers,
  type League,
  type LeagueMember,
  type UserDoc,
} from "@/lib/firebase-service"

export default function PoolsPage() {
  const { user, profile, refreshProfile } = useAuth()

  const [memberships, setMemberships] = useState<string[]>([])
  const [leagueMap, setLeagueMap] = useState<Record<string, League>>({})
  const [allMembers, setAllMembers] = useState<LeagueMember[]>([])
  const [allUsers, setAllUsers] = useState<Record<string, UserDoc>>({})

  const [poolName, setPoolName] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [copied, setCopied] = useState("")

  const [actualName, setActualName] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [avatar, setAvatar] = useState("⚽")

  useEffect(() => {
    if (!profile) return

    setActualName(profile.actualName)
    setDisplayName(profile.displayName)
    setAvatar(profile.avatar)
  }, [profile])

  useEffect(() => {
    if (!user) return

    const unsubMembers = subscribeMyLeagueMemberships(user.uid, (items) =>
      setMemberships(items.map((member) => member.leagueId))
    )

    const unsubLeagues = subscribeLeagues(setLeagueMap)

    return () => {
      unsubMembers()
      unsubLeagues()
    }
  }, [user])

  useEffect(() => {
    if (!profile?.isAdmin) return

    const unsubMembers = subscribeAllLeagueMembers(setAllMembers)
    const unsubUsers = subscribeUsers(setAllUsers)

    return () => {
      unsubMembers()
      unsubUsers()
    }
  }, [profile?.isAdmin])

  useEffect(() => {
    if (!user) return

    const params = new URLSearchParams(window.location.search)
    const league = params.get("league")

    if (league) {
      joinLeague(league, user.uid)
    }
  }, [user])

  const pools = useMemo(
    () => memberships.map((code) => leagueMap[code]).filter(Boolean),
    [memberships, leagueMap]
  )

  const saveProfile = async () => {
    if (!user) return

    const cleanActual = actualName.trim()
    const cleanDisplay = displayName.trim()

    if (!cleanActual || !cleanDisplay) return

    const next: UserProfile = {
      actualName: cleanActual,
      displayName: cleanDisplay,
      avatar,
    }

    await setDoc(
      doc(db, "users", user.uid),
      {
        ...next,
        email: user.email,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    )

    await refreshProfile()
  }

  const createPool = async (name: string) => {
    if (!user) return

    const cleanName = name.trim() || "My League"

    await createLeague(cleanName, user.uid)
    setPoolName("")
  }

  const joinPool = async () => {
    if (!user) return

    const code = joinCode.trim()

    if (!code) return

    await joinLeague(code, user.uid)
    setJoinCode("")
  }

  const removePool = async (pool: League) => {
    if (!user) return

    const isCreator = pool.ownerId === user.uid
    const action = isCreator ? "delete this league for everyone" : "leave this league"
    const ok = window.confirm(`Are you sure you want to ${action}?`)

    if (!ok) return

    if (isCreator) {
      await deleteLeague(pool.code)
    } else {
      await leaveLeague(pool.code, user.uid)
    }
  }

  const kickMember = async (leagueId: string, userId: string) => {
    const member = allUsers[userId]
    const name = member?.actualName || member?.displayName || "this user"

    const ok = window.confirm(`Remove ${name} from this league?`)

    if (!ok) return

    await leaveLeague(leagueId, userId)
  }

  const copyLink = async (pool: League) => {
    const url = `${window.location.origin}/pools?league=${pool.code}`

    await navigator.clipboard.writeText(url)

    setCopied(pool.code)
    setTimeout(() => setCopied(""), 1600)
  }

  return (
    <div className="min-h-screen pb-24 pt-6 px-4 md:pb-8 md:pl-28 md:pr-8 max-w-lg mx-auto md:max-w-4xl">
      <header className="mb-8">
        <h1 className="text-3xl font-headline font-bold mb-2 text-gradient">
          Leagues
        </h1>
        <p className="text-muted-foreground text-sm">
          Create separate live mini-leagues for colleagues, friends or family.
          Invite links now work across devices.
        </p>
      </header>

      <Card className="glass-card mb-6 p-4 space-y-4">
        <div className="flex items-center gap-2 font-headline font-bold">
          <UserCircle size={18} className="text-primary" /> Player profile
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Input
            value={actualName}
            onChange={(event) => setActualName(event.target.value)}
            placeholder="Actual name for leaderboard"
          />
          <Input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Nickname / display name"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {FOOTBALL_AVATARS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setAvatar(item)}
              className={`flex h-10 w-10 items-center justify-center rounded-2xl border text-xl transition ${
                avatar === item
                  ? "border-primary bg-primary/20 shadow-[0_0_0_1px_hsl(var(--primary)/0.35)]"
                  : "border-border bg-background/45 hover:border-primary/40"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {profile
              ? `Saved as ${profile.actualName} (@${profile.displayName})`
              : "Set this before sharing your league link."}
          </p>

          <Button
            className="rounded-2xl font-black"
            onClick={saveProfile}
            disabled={!actualName.trim() || !displayName.trim()}
          >
            Save profile
          </Button>
        </div>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 mb-8">
        <Card className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2 font-headline font-bold">
            <Plus size={18} className="text-primary" /> Create a league
          </div>

          <Input
            value={poolName}
            onChange={(event) => setPoolName(event.target.value)}
            placeholder="e.g. Friends League or Office League"
          />

          <Button
            variant="outline"
            className="w-full h-11 border-primary/40 bg-primary/10 text-foreground hover:bg-primary/20"
            onClick={() => createPool(poolName)}
          >
            Create share link
          </Button>
        </Card>

        <Card className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2 font-headline font-bold">
            <Users size={18} className="text-primary" /> Join a league
          </div>

          <Input
            value={joinCode}
            onChange={(event) => setJoinCode(event.target.value)}
            placeholder="Paste league code or invite link"
          />

          <Button
            variant="outline"
            className="w-full h-11 border-border bg-card hover:bg-muted"
            onClick={joinPool}
          >
            Join league
          </Button>
        </Card>
      </section>

      <h2 className="text-lg font-headline font-bold mb-4">Your Leagues</h2>

      <div className="space-y-4">
        {pools.length === 0 ? (
          <Card className="glass-card p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Users className="text-primary" />
            </div>
            <h3 className="font-headline font-bold text-xl mb-2">
              No leagues yet
            </h3>
            <p className="text-sm text-muted-foreground">
              Create one for colleagues and one for friends, then share each link
              separately.
            </p>
          </Card>
        ) : (
          pools.map((pool) => {
            const isCreator = pool.ownerId === user?.uid

            return (
              <Card key={pool.id} className="glass-card p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Users size={24} className="text-primary" />
                    </div>

                    <div>
                      <h3 className="font-headline font-bold text-lg leading-tight flex items-center gap-2">
                        {pool.name}
                        {isCreator && <Crown size={14} className="text-secondary" />}
                      </h3>

                      <p className="text-xs text-muted-foreground font-medium">
                        Code: {pool.code}
                      </p>

                      <p className="mt-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {isCreator ? (
                          <>
                            <ShieldCheck size={10} /> League owner
                          </>
                        ) : (
                          "Joined league"
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground hover:text-primary"
                      title="Copy invite link"
                      onClick={() => copyLink(pool)}
                    >
                      {copied === pool.code ? <Copy size={18} /> : <Share2 size={18} />}
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      title={isCreator ? "Delete league" : "Leave league"}
                      onClick={() => removePool(pool)}
                    >
                      {isCreator ? <Trash2 size={18} /> : <UserMinus size={18} />}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-muted/40 rounded-xl p-3 text-xs text-muted-foreground">
                  <LinkIcon size={14} />
                  <span className="truncate">
                    {typeof window !== "undefined"
                      ? `${window.location.origin}/pools?league=${pool.code}`
                      : pool.code}
                  </span>
                </div>
              </Card>
            )
          })
        )}
      </div>

      {profile?.isAdmin && (
        <Card className="glass-card mt-8 p-4">
          <h2 className="mb-2 font-headline text-xl font-bold">
            League Manager
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Admin-only area to remove users from leagues if they joined by accident.
          </p>

          <div className="space-y-4">
          {Object.values(leagueMap)
  .filter((league) => league?.code && league?.name)
  .map((league) => {
             const members = allMembers.filter(
  (member) => member?.leagueId === league.code && member?.userId
)

              return (
                <div
                  key={league.code}
                  className="rounded-2xl border border-border bg-card/60 p-4"
                >
                  <div className="mb-3">
                    <h3 className="font-bold">{league.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      Code: {league.code}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {members.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No members yet.
                      </p>
                    ) : (
                      members.map((member) => {
                        const memberProfile = allUsers[member.userId]
                        const name =
                          memberProfile?.actualName ||
                          memberProfile?.displayName ||
                          `User ${String(member.userId || "unknown").slice(0, 4)}`

                        const isOwner = league.ownerId === member.userId

                        return (
                          <div
                            key={member.id}
                            className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 p-3"
                          >
                            <div>
                              <p className="text-sm font-bold">
                                {memberProfile?.avatar || "⚽"} {name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {memberProfile?.email || member.userId}
                                {isOwner ? " · League owner" : ""}
                              </p>
                            </div>

                            {!isOwner && (
                             <Button
  size="sm"
  variant="outline"
  className="rounded-xl font-bold"
  onClick={() => {
    if (member.userId) {
      kickMember(league.code, member.userId)
    }
  }}
>
  Remove
</Button>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <BottomNav />
    </div>
  )
}
