export type Conference = 'East' | 'West'

export type Position = 'PG' | 'SG' | 'SF' | 'PF' | 'C'

export type GameStatus = 'scheduled' | 'final'

export interface TeamColors {
  primary: string
  secondary: string
}

export interface Team {
  id: string
  name: string
  city: string
  abbreviation: string
  conference: Conference
  coach: string
  founded: number
  arena: string
  colors: TeamColors
  createdAt: string
}

export interface Season {
  id: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean
}

export interface Player {
  id: string
  firstName: string
  lastName: string
  teamId: string
  position: Position
  jerseyNumber: number
  heightCm: number
  weightKg: number
  birthDate: string
  nationality: string
  createdAt: string
}

export interface PlayerSeasonStat {
  id: string
  playerId: string
  seasonId: string
  gamesPlayed: number
  points: number
  rebounds: number
  assists: number
  steals: number
  blocks: number
}

export interface Game {
  id: string
  seasonId: string
  date: string
  homeTeamId: string
  awayTeamId: string
  status: GameStatus
  homeScore?: number
  awayScore?: number
  venue: string
}

export interface LeagueDB {
  version: number
  teams: Team[]
  seasons: Season[]
  players: Player[]
  playerStats: PlayerSeasonStat[]
  games: Game[]
  updatedAt: string
}

export interface TeamRecord {
  team: Team
  played: number
  wins: number
  losses: number
  winPct: number
  pointsFor: number
  pointsAgainst: number
  diff: number
  ppg: number
  oppg: number
  streak: Array<'W' | 'L'>
  homeWins: number
  homeLosses: number
  awayWins: number
  awayLosses: number
  lastGames: Game[]
  upcoming: Game[]
}

export interface PlayerAverages {
  ppg: number
  rpg: number
  apg: number
  spg: number
  bpg: number
}

export interface PlayerWithStats {
  player: Player
  team?: Team
  stat?: PlayerSeasonStat
  averages: PlayerAverages
  age: number
}

export interface MatchupAnalysis {
  game: Game
  home: Team
  away: Team
  homeRecord: TeamRecord
  awayRecord: TeamRecord
  homeProbability: number
  awayProbability: number
  homeOdds: number
  awayOdds: number
  favorite: Team
  projectedHomeScore: number
  projectedAwayScore: number
}

export interface TeamFormValues {
  name: string
  city: string
  abbreviation: string
  conference: Conference
  coach: string
  founded: string
  arena: string
  primaryColor: string
  secondaryColor: string
}

export interface PlayerFormValues {
  firstName: string
  lastName: string
  teamId: string
  position: Position
  jerseyNumber: string
  heightCm: string
  weightKg: string
  birthDate: string
  nationality: string
  gamesPlayed: string
  points: string
  rebounds: string
  assists: string
  steals: string
  blocks: string
}

export interface GameFormValues {
  seasonId: string
  date: string
  homeTeamId: string
  awayTeamId: string
  venue: string
}
