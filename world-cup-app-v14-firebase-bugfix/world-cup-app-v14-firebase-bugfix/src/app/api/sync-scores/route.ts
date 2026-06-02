import { NextResponse } from "next/server"
import { MATCHES } from "@/lib/mock-data"

type ApiFootballFixture = {
  fixture: {
    id: number
    date: string
    status: {
      short: string
      long: string
      elapsed: number | null
    }
  }
  teams: {
    home: {
      name: string
    }
    away: {
      name: string
    }
  }
  goals: {
    home: number | null
    away: number | null
  }
}

function normalise(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/côte/g, "cote")
    .replace(/í/g, "i")
    .replace(/é/g, "e")
    .replace(/ã/g, "a")
    .replace(/ç/g, "c")
    .replace(/ü/g, "u")
    .replace(/turkiye/g, "turkey")
    .replace(/korea republic/g, "south korea")
    .replace(/ir iran/g, "iran")
    .replace(/cabo verde/g, "cape verde")
    .replace(/congo dr/g, "dr congo")
    .replace(/[^a-z0-9 ]/g, "")
    .trim()
}

function sameTeam(a: string, b: string) {
  return normalise(a) === normalise(b)
}

function findLocalMatch(apiFixture: ApiFootballFixture) {
  return MATCHES.find((match) => {
    const sameHome = sameTeam(match.homeTeam.name, apiFixture.teams.home.name)
    const sameAway = sameTeam(match.awayTeam.name, apiFixture.teams.away.name)

    const reversedHome = sameTeam(match.homeTeam.name, apiFixture.teams.away.name)
    const reversedAway = sameTeam(match.awayTeam.name, apiFixture.teams.home.name)

    return (sameHome && sameAway) || (reversedHome && reversedAway)
  })
}

function isLiveStatus(shortStatus: string) {
  return ["1H", "HT", "2H", "ET", "BT", "P", "LIVE"].includes(shortStatus)
}

function isFinishedStatus(shortStatus: string) {
  return ["FT", "AET", "PEN"].includes(shortStatus)
}

export async function GET() {
  const apiKey = process.env.API_FOOTBALL_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing API_FOOTBALL_KEY environment variable" },
      { status: 500 }
    )
  }

  /*
    IMPORTANT:
    You may need to adjust league/season once API-Football confirms the
    World Cup 2026 league ID in your account dashboard.

    Common API-Football pattern:
    /fixtures?league=<LEAGUE_ID>&season=2026

    If World Cup coverage is not available on your plan yet, this endpoint
    may return no fixtures until closer to tournament time.
  */
  const leagueId = process.env.API_FOOTBALL_WORLD_CUP_LEAGUE_ID || "1"
  const season = process.env.API_FOOTBALL_WORLD_CUP_SEASON || "2026"

  const url = `https://v3.football.api-sports.io/fixtures?league=${leagueId}&season=${season}`

  const response = await fetch(url, {
    headers: {
      "x-apisports-key": apiKey,
    },
    cache: "no-store",
  })

  if (!response.ok) {
    return NextResponse.json(
      {
        error: "API-Football request failed",
        status: response.status,
      },
      { status: 500 }
    )
  }

  const data = await response.json()
  const fixtures: ApiFootballFixture[] = data.response || []

  const synced = fixtures
    .map((fixture) => {
      const localMatch = findLocalMatch(fixture)

      if (!localMatch) return null

      const apiHomeName = fixture.teams.home.name
      const localHomeName = localMatch.homeTeam.name

      const apiHomeMatchesLocalHome = sameTeam(apiHomeName, localHomeName)

      const homeScore = apiHomeMatchesLocalHome
        ? fixture.goals.home
        : fixture.goals.away

      const awayScore = apiHomeMatchesLocalHome
        ? fixture.goals.away
        : fixture.goals.home

      const shortStatus = fixture.fixture.status.short
      const elapsed = fixture.fixture.status.elapsed

      return {
        matchId: localMatch.id,
        home: typeof homeScore === "number" ? homeScore : null,
        away: typeof awayScore === "number" ? awayScore : null,
        status: isLiveStatus(shortStatus)
          ? "LIVE"
          : isFinishedStatus(shortStatus)
            ? "FINISHED"
            : "SCHEDULED",
        apiStatus: shortStatus,
        elapsed,
        apiFixtureId: fixture.fixture.id,
      }
    })
    .filter(Boolean)

  return NextResponse.json({
    synced,
    count: synced.length,
  })
}
