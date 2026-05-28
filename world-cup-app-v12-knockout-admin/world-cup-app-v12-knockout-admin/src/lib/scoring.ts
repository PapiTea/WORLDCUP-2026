import { GROUPS, KNOCKOUT_FIXTURES, MATCHES } from './mock-data'

export type SavedPick = { home: number; away: number; confidence?: boolean }
export type SavedResult = { home: number; away: number }

type StorageLike = Pick<Storage, 'getItem'>

function readJson<T>(storage: StorageLike, key: string, fallback: T): T {
  try {
    const raw = storage.getItem(key)
    return raw ? JSON.parse(raw) as T : fallback
  } catch {
    return fallback
  }
}

function outcome(home: number, away: number) {
  if (home > away) return 'H'
  if (away > home) return 'A'
  return 'D'
}

export function scoreMatchPick(pick: SavedPick | null, result: SavedResult | null) {
  if (!pick || !result) return { base: 0, confidenceBonus: 0, total: 0, reason: 'Awaiting result' }

  const pickOutcome = outcome(pick.home, pick.away)
  const actualOutcome = outcome(result.home, result.away)
  const exact = pick.home === result.home && pick.away === result.away
  const correctResult = pickOutcome === actualOutcome
  const correctGoalDifference = (pick.home - pick.away) === (result.home - result.away)

  let base = 0
  let reason = 'No points'
  if (exact) {
    base = 5
    reason = 'Exact score'
  } else if (correctResult) {
    base = 3 + (correctGoalDifference ? 1 : 0)
    reason = correctGoalDifference ? 'Correct result + goal difference' : 'Correct result'
  }

  let total = base
  let confidenceBonus = 0
  if (pick.confidence) {
    if (correctResult) {
      confidenceBonus = base
      total = base * 2
      reason += ' · Confidence doubled'
    } else {
      confidenceBonus = -5
      total = -5
      reason = 'Wrong confidence pick'
    }
  }

  return { base, confidenceBonus, total, reason }
}

export function calculateLocalScore(storage: StorageLike) {
  let matchPoints = 0
  let groupPoints = 0
  const matchBreakdown = MATCHES.map((match) => {
    const pick = readJson<SavedPick | null>(storage, `wc-match-${match.id}`, null)
    const result = readJson<SavedResult | null>(storage, `wc-result-${match.id}`, null)
    const score = scoreMatchPick(pick, result)
    matchPoints += score.total
    return { match, pick, result, ...score }
  })

  const knockoutBreakdown = KNOCKOUT_FIXTURES.map((fixture) => {
    const pick = readJson<SavedPick | null>(storage, `wc-ko-pick-${fixture.id}`, null)
    const result = readJson<SavedResult | null>(storage, `wc-ko-result-${fixture.id}`, null)
    const score = scoreMatchPick(pick, result)
    matchPoints += score.total
    return { fixture, pick, result, ...score }
  })

  const groupBreakdown = GROUPS.map((group) => {
    const picks = readJson<string[]>(storage, `wc-group-picks-${group.id}`, [])
    const qualified = readJson<string[]>(storage, `wc-qualified-${group.id}`, [])
    const correctTeams = picks.filter((id) => qualified.includes(id)).length
    const correctPositions = picks.filter((id, index) => qualified[index] === id).length
    const points = correctTeams * 2 + correctPositions * 3
    groupPoints += points
    return { group, picks, qualified, correctTeams, correctPositions, points }
  })

  const total = matchPoints + groupPoints
  return { total, matchPoints, groupPoints, matchBreakdown, knockoutBreakdown, groupBreakdown }
}
