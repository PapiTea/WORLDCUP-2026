import { collection, deleteDoc, doc, getDocs, onSnapshot, query, serverTimestamp, setDoc, where, type Unsubscribe } from 'firebase/firestore'
import { db } from './firebase'
import type { UserProfile } from './profile'

export type Score = {
  home: number
  away: number
  status?: "SCHEDULED" | "LIVE" | "FINISHED"
  elapsed?: number | null
  apiFixtureId?: number
  updatedAt?: unknown
}
export type MatchPrediction = Score & { confidence?: boolean; userId: string; matchId: string; type: 'group' | 'knockout'; updatedAt?: unknown }
export type GroupPrediction = { userId: string; groupId: string; picks: string[]; updatedAt?: unknown }
export type League = { id: string; code: string; name: string; ownerId: string; createdAt?: unknown }
export type LeagueMember = { id: string; leagueId: string; userId: string; joinedAt?: unknown }
export type UserDoc = UserProfile & { email?: string }
export function subscribeUserSingleMatchPrediction(
  userId: string,
  matchId: string,
  type: 'group' | 'knockout',
  cb: (prediction: MatchPrediction | null) => void
): Unsubscribe {
  const id = `${userId}_${type}_${matchId}`

  return onSnapshot(doc(db, 'predictions', id), (snap) => {
    if (!snap.exists()) {
      cb(null)
      return
    }

    cb(snap.data() as MatchPrediction)
  })
}

export function subscribeDocMap<T>(collectionName: string, cb: (items: Record<string, T>) => void): Unsubscribe {
  return onSnapshot(collection(db, collectionName), (snap) => {
    const out: Record<string, T> = {}
    snap.forEach((d) => { out[d.id] = d.data() as T })
    cb(out)
  })
}

export function saveMatchPrediction(userId: string, matchId: string, type: 'group' | 'knockout', pick: Score & { confidence?: boolean }) {
  const id = `${userId}_${type}_${matchId}`
  return setDoc(doc(db, 'predictions', id), { userId, matchId, type, ...pick, updatedAt: serverTimestamp() }, { merge: true })
}
export function saveTournamentWinner(userId: string, teamId: string) {
  return setDoc(
    doc(db, "predictions", `${userId}_tournament_winner`),
    {
      userId,
      type: "tournamentWinner",
      teamId,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}

export function subscribeTournamentWinner(
  userId: string,
  cb: (teamId: string) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, "predictions", `${userId}_tournament_winner`),
    (snap) => {
      if (!snap.exists()) return
      const data = snap.data() as any
      cb(data.teamId || "")
    }
  )
}
export function subscribeUserMatchPredictions(userId: string, cb: (items: Record<string, MatchPrediction>) => void): Unsubscribe {
  return onSnapshot(query(collection(db, 'predictions'), where('userId', '==', userId)), (snap) => {
    const out: Record<string, MatchPrediction> = {}
    snap.forEach((d) => { const data = d.data() as MatchPrediction; out[`${data.type}_${data.matchId}`] = data })
    cb(out)
  })
}

export function saveGroupPrediction(userId: string, groupId: string, picks: string[]) {
  return setDoc(doc(db, 'predictions', `${userId}_qualifiers_${groupId}`), { userId, groupId, type: 'qualifiers', picks, updatedAt: serverTimestamp() }, { merge: true })
}

export function subscribeUserGroupPredictions(userId: string, cb: (items: Record<string, string[]>) => void): Unsubscribe {
  return onSnapshot(query(collection(db, 'predictions'), where('userId', '==', userId), where('type', '==', 'qualifiers')), (snap) => {
    const out: Record<string, string[]> = {}
    snap.forEach((d) => { const data = d.data() as GroupPrediction & { type: string }; if (data.groupId) out[data.groupId] = data.picks || [] })
    cb(out)
  })
}

export function saveMatchResult(matchId: string, score: Score) {
  return setDoc(
    doc(db, "matchResults", matchId),
    {
      matchId,
      ...score,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}
export function deleteMatchResult(matchId: string) { return deleteDoc(doc(db, 'matchResults', matchId)) }
export function subscribeResults(
  cb: (items: Record<string, Score>) => void
): Unsubscribe {
  return onSnapshot(collection(db, "matchResults"), (snap) => {
    const out: Record<string, Score> = {}

    snap.forEach((d) => {
      const data = d.data() as Score

      if (typeof data.home === "number" && typeof data.away === "number") {
        out[d.id] = {
          home: data.home,
          away: data.away,
          status: data.status,
          elapsed: data.elapsed ?? null,
          apiFixtureId: data.apiFixtureId,
        }
      }
    })

    cb(out)
  })
}

export function saveQualifier(groupId: string, picks: string[]) {
  return setDoc(doc(db, 'knockoutSetup', `qualified_${groupId}`), { groupId, picks, updatedAt: serverTimestamp() }, { merge: true })
}
export function saveKnockoutSlot(slotId: string, teamId: string) {
  return setDoc(doc(db, 'knockoutSetup', `slot_${slotId}`), { slotId, teamId, updatedAt: serverTimestamp() }, { merge: true })
}
export function clearKnockoutSlot(slotId: string) { return deleteDoc(doc(db, 'knockoutSetup', `slot_${slotId}`)) }
export function subscribeKnockoutSetup(cb: (setup: { qualifiers: Record<string, string[]>; slots: Record<string, string> }) => void): Unsubscribe {
  return onSnapshot(collection(db, 'knockoutSetup'), (snap) => {
    const qualifiers: Record<string, string[]> = {}
    const slots: Record<string, string> = {}
    snap.forEach((d) => {
      const data = d.data() as any
      if (d.id.startsWith('qualified_') && data.groupId) qualifiers[data.groupId] = data.picks || []
      if (d.id.startsWith('slot_') && data.slotId && data.teamId) slots[data.slotId] = data.teamId
    })
    cb({ qualifiers, slots })
  })
}

export async function createLeague(name: string, ownerId: string) {
  const code = Math.random().toString(36).slice(2, 8).toUpperCase()
  const league: League = { id: code, code, name, ownerId, createdAt: serverTimestamp() }
  await setDoc(doc(db, 'leagues', code), league)
  await setDoc(doc(db, 'leagueMembers', `${code}_${ownerId}`), { id: `${code}_${ownerId}`, leagueId: code, userId: ownerId, joinedAt: serverTimestamp() })
  return league
}
function cleanLeagueCode(input: string) {
  const trimmed = input.trim()

  try {
    const url = new URL(trimmed)
    const leagueFromUrl = url.searchParams.get("league")
    if (leagueFromUrl) return leagueFromUrl.trim().toUpperCase()
  } catch {
    // Not a URL, continue as normal code
  }

  return trimmed.toUpperCase()
}

export async function joinLeague(code: string, userId: string) {
  const cleanCode = cleanLeagueCode(code)

  const leagueSnap = await getDocs(
    query(collection(db, "leagues"), where("code", "==", cleanCode))
  )

  if (leagueSnap.empty) {
    throw new Error("League not found. Check the code or invite link.")
  }

  await setDoc(
    doc(db, "leagueMembers", `${cleanCode}_${userId}`),
    {
      id: `${cleanCode}_${userId}`,
      leagueId: cleanCode,
      userId,
      joinedAt: serverTimestamp(),
    },
    { merge: true }
  )
}
export async function leaveLeague(code: string, userId: string) { return deleteDoc(doc(db, 'leagueMembers', `${code}_${userId}`)) }
export async function deleteLeague(code: string) {
  const members = await getDocs(query(collection(db, 'leagueMembers'), where('leagueId', '==', code)))
  await Promise.all(members.docs.map((m) => deleteDoc(m.ref)))
  return deleteDoc(doc(db, 'leagues', code))
}
export function subscribeMyLeagueMemberships(userId: string, cb: (members: LeagueMember[]) => void): Unsubscribe {
  return onSnapshot(query(collection(db, 'leagueMembers'), where('userId', '==', userId)), (snap) => cb(snap.docs.map(d => d.data() as LeagueMember)))
}
export function subscribeLeagues(cb: (leagues: Record<string, League>) => void): Unsubscribe { return subscribeDocMap<League>('leagues', cb) }
export function subscribeUsers(cb: (users: Record<string, UserDoc>) => void): Unsubscribe { return subscribeDocMap<UserDoc>('users', cb) }
export function subscribeAllPredictions(cb: (predictions: MatchPrediction[]) => void): Unsubscribe {
  return onSnapshot(collection(db, 'predictions'), (snap) => cb(snap.docs.map(d => d.data() as MatchPrediction)))
}
export function subscribeAllLeagueMembers(cb: (members: LeagueMember[]) => void): Unsubscribe {
  return onSnapshot(collection(db, 'leagueMembers'), (snap) => cb(snap.docs.map(d => d.data() as LeagueMember)))
}

export function saveGlobalMessage(message: string) {
  return setDoc(
    doc(db, "appSettings", "globalMessage"),
    {
      message,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}

export function clearGlobalMessage() {
  return deleteDoc(doc(db, "appSettings", "globalMessage"))
}

export function subscribeGlobalMessage(
  cb: (message: string) => void
): Unsubscribe {
  return onSnapshot(doc(db, "appSettings", "globalMessage"), (snap) => {
    if (!snap.exists()) {
      cb("")
      return
    }

    const data = snap.data() as any
    cb(data.message || "")
  })
}
export async function getLeaderboardData(userId: string) {
  const [
    usersSnap,
    predictionsSnap,
    resultsSnap,
    knockoutSetupSnap,
    allMembersSnap,
    myMembershipsSnap,
    leaguesSnap,
  ] = await Promise.all([
    getDocs(collection(db, "users")),
    getDocs(collection(db, "predictions")),
    getDocs(collection(db, "matchResults")),
    getDocs(collection(db, "knockoutSetup")),
    getDocs(collection(db, "leagueMembers")),
    getDocs(query(collection(db, "leagueMembers"), where("userId", "==", userId))),
    getDocs(collection(db, "leagues")),
  ])

  const users: Record<string, UserDoc> = {}
  usersSnap.forEach((d) => {
    users[d.id] = d.data() as UserDoc
  })

  const predictions: MatchPrediction[] = []
  predictionsSnap.forEach((d) => {
    predictions.push(d.data() as MatchPrediction)
  })

  const results: Record<string, Score> = {}
  resultsSnap.forEach((d) => {
    const data = d.data() as Score

    if (typeof data.home === "number" && typeof data.away === "number") {
      results[d.id] = data
    }
  })

  const qualifiers: Record<string, string[]> = {}
  knockoutSetupSnap.forEach((d) => {
    const data = d.data() as any

    if (d.id.startsWith("qualified_") && data.groupId) {
      qualifiers[data.groupId] = data.picks || []
    }
  if (d.id.startsWith("slot_") && data.slotId && data.teamId) {
    slots[data.slotId] = data.teamId
  }
})

  const allMembers: LeagueMember[] = []
  allMembersSnap.forEach((d) => {
    allMembers.push(d.data() as LeagueMember)
  })

  const myLeagueIds: string[] = []
  myMembershipsSnap.forEach((d) => {
    const data = d.data() as LeagueMember
    if (data.leagueId) myLeagueIds.push(data.leagueId)
  })

  const leagueMap: Record<string, League> = {}
  leaguesSnap.forEach((d) => {
    leagueMap[d.id] = d.data() as League
  })

  return {
    users,
    predictions,
    results,
    qualifiers,
    slots,
    allMembers,
    myLeagueIds,
    leagueMap,
    
  }
}
