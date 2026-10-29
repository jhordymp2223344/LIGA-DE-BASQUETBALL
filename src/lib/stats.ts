import type {
  Conference,
  Game,
  MatchupAnalysis,
  Player,
  PlayerAverages,
  PlayerSeasonStat,
  PlayerWithStats,
  Season,
  Team,
  TeamRecord,
} from '../types'
import { ageFromBirthDate, clamp } from './format'

export function emptyAverages(): PlayerAverages {
  return { ppg: 0, rpg: 0, apg: 0, spg: 0, bpg: 0 }
}

export function averagesFromStat(stat?: PlayerSeasonStat): PlayerAverages {
  if (!stat || stat.gamesPlayed <= 0) return emptyAverages()
  const gp = stat.gamesPlayed
  return {
    ppg: stat.points / gp,
    rpg: stat.rebounds / gp,
    apg: stat.assists / gp,
    spg: stat.steals / gp,
    bpg: stat.blocks / gp,
  }
}

export function isFinal(game: Game): boolean {
  return game.status === 'final' && typeof game.homeScore === 'number' && typeof game.awayScore === 'number'
}

export function gameWinner(game: Game): 'home' | 'away' | null {
  if (!isFinal(game)) return null
  if ((game.homeScore as number) === (game.awayScore as number)) return null
  return (game.homeScore as number) > (game.awayScore as number) ? 'home' : 'away'
}

export function teamGameResult(game: Game, teamId: string): 'W' | 'L' | null {
  const winner = gameWinner(game)
  if (!winner) return null
  const isHome = game.homeTeamId === teamId
  const teamWon = (winner === 'home' && isHome) || (winner === 'away' && !isHome)
  return teamWon ? 'W' : 'L'
}

export function buildTeamRecord(team: Team, games: Game[], seasonId: string): TeamRecord {
  const seasonGames = games.filter(
    (game) =>
      game.seasonId === seasonId &&
      (game.homeTeamId === team.id || game.awayTeamId === team.id),
  )
  const finals = seasonGames
    .filter(isFinal)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const upcoming = seasonGames
    .filter((game) => game.status === 'scheduled')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  let wins = 0
  let losses = 0
  let pointsFor = 0
  let pointsAgainst = 0
  let homeWins = 0
  let homeLosses = 0
  let awayWins = 0
  let awayLosses = 0

  for (const game of finals) {
    const isHome = game.homeTeamId === team.id
    const own = (isHome ? game.homeScore : game.awayScore) as number
    const rival = (isHome ? game.awayScore : game.homeScore) as number
    pointsFor += own
    pointsAgainst += rival
    const won = own > rival
    if (won) {
      wins += 1
      if (isHome) homeWins += 1
      else awayWins += 1
    } else {
      losses += 1
      if (isHome) homeLosses += 1
      else awayLosses += 1
    }
  }

  const played = wins + losses
  const streak = finals
    .slice(0, 5)
    .map((game) => teamGameResult(game, team.id))
    .filter((result): result is 'W' | 'L' => result !== null)

  return {
    team,
    played,
    wins,
    losses,
    winPct: played > 0 ? wins / played : 0,
    pointsFor,
    pointsAgainst,
    diff: pointsFor - pointsAgainst,
    ppg: played > 0 ? pointsFor / played : 0,
    oppg: played > 0 ? pointsAgainst / played : 0,
    streak,
    homeWins,
    homeLosses,
    awayWins,
    awayLosses,
    lastGames: finals,
    upcoming,
  }
}

export function buildStandings(teams: Team[], games: Game[], seasonId: string, conference?: Conference) {
  return teams
    .filter((team) => !conference || team.conference === conference)
    .map((team) => buildTeamRecord(team, games, seasonId))
    .sort((a, b) => {
      if (b.winPct !== a.winPct) return b.winPct - a.winPct
      if (b.diff !== a.diff) return b.diff - a.diff
      if (b.pointsFor !== a.pointsFor) return b.pointsFor - a.pointsFor
      return a.team.name.localeCompare(b.team.name)
    })
}

export function gamesBehind(record: TeamRecord, leader: TeamRecord): number {
  return ((leader.wins - record.wins) + (record.losses - leader.losses)) / 2
}

export function buildPlayerList(
  players: Player[],
  teams: Team[],
  playerStats: PlayerSeasonStat[],
  seasonId: string,
): PlayerWithStats[] {
  const teamMap = new Map(teams.map((team) => [team.id, team]))
  return players.map((player) => {
    const stat = playerStats.find((item) => item.playerId === player.id && item.seasonId === seasonId)
    return {
      player,
      team: teamMap.get(player.teamId),
      stat,
      averages: averagesFromStat(stat),
      age: ageFromBirthDate(player.birthDate),
    }
  })
}

export type LeaderMetric = 'ppg' | 'rpg' | 'apg' | 'spg' | 'bpg'

export function topPlayers(
  players: PlayerWithStats[],
  metric: LeaderMetric,
  limit = 5,
): PlayerWithStats[] {
  return players
    .filter((item) => (item.stat?.gamesPlayed ?? 0) > 0)
    .sort((a, b) => b.averages[metric] - a.averages[metric])
    .slice(0, limit)
}

export function leagueScoringAverage(games: Game[], seasonId: string): number {
  const finals = games.filter((game) => game.seasonId === seasonId && isFinal(game))
  if (finals.length === 0) return 108
  const total = finals.reduce(
    (sum, game) => sum + (game.homeScore as number) + (game.awayScore as number),
    0,
  )
  return total / (finals.length * 2)
}

export function analyzeMatchup(
  game: Game,
  teams: Team[],
  games: Game[],
  seasonId: string,
): MatchupAnalysis | null {
  const home = teams.find((team) => team.id === game.homeTeamId)
  const away = teams.find((team) => team.id === game.awayTeamId)
  if (!home || !away) return null

  const homeRecord = buildTeamRecord(home, games, seasonId)
  const awayRecord = buildTeamRecord(away, games, seasonId)
  const homeNet = homeRecord.ppg - homeRecord.oppg
  const awayNet = awayRecord.ppg - awayRecord.oppg
  const homeCourt = 3.1
  const ratingGap = homeNet - awayNet + homeCourt
  const probability = clamp(1 / (1 + Math.exp(-ratingGap / 7.4)), 0.08, 0.92)
  const margin = 1.05
  const homeOdds = Math.round((1 / (probability * margin)) * 100) / 100
  const awayOdds = Math.round((1 / ((1 - probability) * margin)) * 100) / 100
  const leagueAvg = leagueScoringAverage(games, seasonId)

  const projectedHomeScore = Math.round(
    clamp((homeRecord.ppg + awayRecord.oppg) / 2 + homeCourt / 2 + (leagueAvg - 108) * 0.25, 78, 145),
  )
  const projectedAwayScore = Math.round(
    clamp((awayRecord.ppg + homeRecord.oppg) / 2 - homeCourt / 2 + (leagueAvg - 108) * 0.25, 78, 145),
  )

  return {
    game,
    home,
    away,
    homeRecord,
    awayRecord,
    homeProbability: probability,
    awayProbability: 1 - probability,
    homeOdds,
    awayOdds,
    favorite: probability >= 0.5 ? home : away,
    projectedHomeScore,
    projectedAwayScore,
  }
}

export function teamGamesForSeason(games: Game[], teamId: string, seasonId: string): Game[] {
  return games.filter(
    (game) =>
      game.seasonId === seasonId &&
      (game.homeTeamId === teamId || game.awayTeamId === teamId),
  )
}

export function playerPercentile(value: number, allValues: number[]): number {
  const positive = allValues.filter((item) => item > 0)
  if (positive.length === 0 || value <= 0) return 0
  const below = positive.filter((item) => item <= value).length
  return clamp(below / positive.length, 0, 1)
}

export function activeSeason(seasons: Season[]): Season | undefined {
  return seasons.find((season) => season.isActive) ?? seasons[0]
}

export function latestSeason(seasons: Season[]): Season | undefined {
  return seasons[0]
}
