import type {
  Conference,
  Game,
  LeagueDB,
  Player,
  PlayerSeasonStat,
  Position,
  Season,
  Team,
} from '../types'
import { clamp } from '../lib/format'
import { createRng, type Rng } from '../lib/random'

interface TeamSeed {
  name: string
  city: string
  abbreviation: string
  conference: Conference
  coach: string
  founded: number
  arena: string
  primary: string
  secondary: string
  rating: number
}

const TEAM_SEEDS: TeamSeed[] = [
  {
    name: 'Empires',
    city: 'New York',
    abbreviation: 'NYE',
    conference: 'East',
    coach: 'Damon Whitfield',
    founded: 1946,
    arena: 'Empire Arena',
    primary: '#1D4ED8',
    secondary: '#C8102E',
    rating: 0.74,
  },
  {
    name: 'Harbors',
    city: 'Boston',
    abbreviation: 'BOS',
    conference: 'East',
    coach: 'Patrick O’Neil',
    founded: 1947,
    arena: 'Harbor Garden',
    primary: '#007A33',
    secondary: '#BA9653',
    rating: 0.68,
  },
  {
    name: 'Waves',
    city: 'Miami',
    abbreviation: 'MIA',
    conference: 'East',
    coach: 'Rafael Duarte',
    founded: 1988,
    arena: 'Wavefront Center',
    primary: '#E5006D',
    secondary: '#00B2A9',
    rating: 0.6,
  },
  {
    name: 'Forge',
    city: 'Chicago',
    abbreviation: 'CHI',
    conference: 'East',
    coach: 'Gregory Lane',
    founded: 1966,
    arena: 'Forge Dome',
    primary: '#C8102E',
    secondary: '#111111',
    rating: 0.52,
  },
  {
    name: 'Bells',
    city: 'Philadelphia',
    abbreviation: 'PHI',
    conference: 'East',
    coach: 'Terrance Boyd',
    founded: 1949,
    arena: 'Liberty Hall',
    primary: '#006BB6',
    secondary: '#ED174C',
    rating: 0.47,
  },
  {
    name: 'Flight',
    city: 'Atlanta',
    abbreviation: 'ATL',
    conference: 'East',
    coach: 'Isaiah Coleman',
    founded: 1968,
    arena: 'Peachtree Air Dome',
    primary: '#E03A3E',
    secondary: '#FDB927',
    rating: 0.41,
  },
  {
    name: 'Stars',
    city: 'Los Angeles',
    abbreviation: 'LAS',
    conference: 'West',
    coach: 'Michael Sterling',
    founded: 1960,
    arena: 'Starlight Arena',
    primary: '#552583',
    secondary: '#FDB927',
    rating: 0.76,
  },
  {
    name: 'Gold',
    city: 'San Francisco',
    abbreviation: 'SFG',
    conference: 'West',
    coach: 'Elena Marsh',
    founded: 1962,
    arena: 'Bayfront Pavilion',
    primary: '#FDB927',
    secondary: '#1D428A',
    rating: 0.65,
  },
  {
    name: 'Wranglers',
    city: 'Dallas',
    abbreviation: 'DAL',
    conference: 'West',
    coach: 'Wade Hollister',
    founded: 1980,
    arena: 'Lone Star Fieldhouse',
    primary: '#00538C',
    secondary: '#B8C4CA',
    rating: 0.58,
  },
  {
    name: 'Sol',
    city: 'Phoenix',
    abbreviation: 'PHX',
    conference: 'West',
    coach: 'Martín Salazar',
    founded: 1968,
    arena: 'Sol Center',
    primary: '#E56020',
    secondary: '#1D1160',
    rating: 0.51,
  },
  {
    name: 'Peaks',
    city: 'Denver',
    abbreviation: 'DEN',
    conference: 'West',
    coach: 'Owen Barrett',
    founded: 1976,
    arena: 'Summit Arena',
    primary: '#0E2240',
    secondary: '#FEC524',
    rating: 0.46,
  },
  {
    name: 'Orcas',
    city: 'Seattle',
    abbreviation: 'SEA',
    conference: 'West',
    coach: 'Naomi Chen',
    founded: 2004,
    arena: 'Orca Bay Arena',
    primary: '#006D77',
    secondary: '#0C2340',
    rating: 0.39,
  },
]

const FIRST_NAMES = [
  'Jalen', 'Marcus', 'Tyrese', 'Darius', 'Andre', 'Malik', 'Devin', 'Cameron', 'Trey', 'Isaiah',
  'Xavier', 'Jordan', 'Elias', 'Noah', 'Mateo', 'Luca', 'Kai', 'Owen', 'Miles', 'Cole',
  'Grant', 'Blake', 'Reid', 'Dante', 'Amari', 'Josiah', 'Kendrick', 'Lamar', 'Terrance', 'Deshawn',
  'Nico', 'Santiago', 'Emiliano', 'Rafael', 'Tomas', 'Nikola', 'Yuki', 'Hugo', 'Leo', 'Bruno',
  'Felix', 'Aaron', 'Caleb', 'Dylan', 'Ezra', 'Gavin', 'Hector', 'Ivan', 'Jasper', 'Lorenzo',
  'Mauricio', 'Nolan', 'Oscar', 'Pablo', 'Quentin', 'Ruben', 'Silas', 'Theo', 'Victor', 'Zane',
]

const LAST_NAMES = [
  'Hart', 'Bennett', 'Carter', 'Reed', 'Sullivan', 'Brooks', 'Hayes', 'Monroe', 'Parker', 'Foster',
  'Bishop', 'Hale', 'Vaughn', 'Merritt', 'Dawson', 'Cross', 'Barlow', 'Sinclair', 'Hudson', 'Mercer',
  'Lang', 'Pierce', 'Rowan', 'Ellison', 'Graves', 'Sharpe', 'Bowen', 'Holt', 'Keller', 'Marsh',
  'Nash', 'Porter', 'Quinn', 'Reyes', 'Santos', 'Molina', 'Vega', 'Cruz', 'Navarro', 'Duarte',
  'Ferreira', 'Costa', 'Novak', 'Petrov', 'Kovac', 'Vukovic', 'Andersson', 'Lindberg', 'Okafor', 'Adeyemi',
  'Mensah', 'Diallo', 'Traore', 'Tanaka', 'Sato', 'Kim', 'Park', 'Haddad', 'Rahimi', 'Bianchi',
]

const NATIONALITIES = [
  'Estados Unidos', 'Estados Unidos', 'Estados Unidos', 'Estados Unidos', 'Estados Unidos',
  'Estados Unidos', 'Estados Unidos', 'Canadá', 'España', 'Francia', 'Serbia', 'Australia',
  'Nigeria', 'Brasil', 'Alemania', 'Argentina', 'Lituania', 'República Dominicana', 'Japón',
  'Italia', 'Grecia', 'Croacia',
]

const JERSEYS = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 20, 21, 22, 23, 24, 25, 30, 31, 32, 33,
  34, 35, 40, 41, 42, 43, 44, 45, 50, 51, 52, 53, 54, 55,
]

const POSITION_HEIGHT: Record<Position, [number, number]> = {
  PG: [180, 193],
  SG: [188, 201],
  SF: [198, 207],
  PF: [203, 211],
  C: [208, 220],
}

const POSITION_WEIGHT: Record<Position, [number, number]> = {
  PG: [78, 94],
  SG: [84, 100],
  SF: [94, 110],
  PF: [100, 118],
  C: [108, 130],
}

const POSITION_POINTS: Record<Position, number> = { PG: 12, SG: 12.5, SF: 11.5, PF: 10.5, C: 10.5 }
const POSITION_REBOUNDS: Record<Position, number> = { PG: 3.1, SG: 3.5, SF: 4.7, PF: 6.3, C: 7.9 }
const POSITION_ASSISTS: Record<Position, number> = { PG: 6, SG: 3.3, SF: 3.1, PF: 2.1, C: 1.9 }
const POSITION_STEALS: Record<Position, number> = { PG: 1.3, SG: 1.1, SF: 1, PF: 0.8, C: 0.6 }
const POSITION_BLOCKS: Record<Position, number> = { PG: 0.25, SG: 0.35, SF: 0.55, PF: 0.95, C: 1.55 }

const ACTIVE_SEASON: Season = {
  id: 'season-2026-27',
  name: '2026-27',
  startDate: '2026-09-20',
  endDate: '2027-04-12',
  isActive: true,
}

const ARCHIVE_SEASON: Season = {
  id: 'season-2025-26',
  name: '2025-26',
  startDate: '2025-10-21',
  endDate: '2026-04-14',
  isActive: false,
}

function dateAt(startDate: string, dayOffset: number, hour: number, minute: number): string {
  const date = new Date(`${startDate}T12:00:00`)
  date.setDate(date.getDate() + dayOffset)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(hour)}:${pad(minute)}:00`
}

function buildRoundRobin(teams: Team[]): Array<Array<{ home: Team; away: Team }>> {
  const rotating = teams.slice(1)
  const rounds: Array<Array<{ home: Team; away: Team }>> = []
  for (let round = 0; round < teams.length - 1; round += 1) {
    const lineup = [teams[0], ...rotating]
    const pairs: Array<{ home: Team; away: Team }> = []
    for (let index = 0; index < lineup.length / 2; index += 1) {
      const first = lineup[index]
      const second = lineup[lineup.length - 1 - index]
      const firstHome = (round + index) % 2 === 0
      pairs.push(firstHome ? { home: first, away: second } : { home: second, away: first })
    }
    rounds.push(pairs)
    rotating.unshift(rotating.pop() as Team)
  }
  return rounds
}

function scoreFromRating(rng: Rng, homeRating: number, awayRating: number): [number, number] {
  const gap = homeRating - awayRating
  let homeScore = Math.round(107 + gap * 23 + 2.4 + rng.normal(0, 6.2))
  let awayScore = Math.round(107 - gap * 23 - 2.4 + rng.normal(0, 6.2))
  homeScore = clamp(homeScore, 84, 141)
  awayScore = clamp(awayScore, 84, 141)
  if (homeScore === awayScore) homeScore += 2
  return [homeScore, awayScore]
}

function makeSeasonGames(
  season: Season,
  teams: Team[],
  ratingByTeam: Map<string, number>,
  rng: Rng,
  completedRounds: number,
  dayStep: number,
): Game[] {
  const rounds = buildRoundRobin(teams)
  return rounds.flatMap((pairs, roundIndex) =>
    pairs.map((pair, gameIndex) => {
      const isCompleted = roundIndex < completedRounds
      const [homeScore, awayScore] = scoreFromRating(
        rng,
        ratingByTeam.get(pair.home.id) ?? 0.5,
        ratingByTeam.get(pair.away.id) ?? 0.5,
      )
      return {
        id: `game-${season.id}-${roundIndex + 1}-${gameIndex + 1}`,
        seasonId: season.id,
        date: dateAt(season.startDate, roundIndex * dayStep, 19 + (gameIndex % 3), gameIndex % 2 === 0 ? 0 : 30),
        homeTeamId: pair.home.id,
        awayTeamId: pair.away.id,
        status: isCompleted ? 'final' : 'scheduled',
        homeScore: isCompleted ? homeScore : undefined,
        awayScore: isCompleted ? awayScore : undefined,
        venue: pair.home.arena,
      } satisfies Game
    }),
  )
}

function buildRoster(
  rng: Rng,
  team: Team,
  teamSeed: TeamSeed,
  namePool: Array<{ first: string; last: string }>,
  completedGames: Record<string, number>,
): { players: Player[]; stats: PlayerSeasonStat[] } {
  const players: Player[] = []
  const stats: PlayerSeasonStat[] = []
  const positions: Position[] = ['PG', 'PG', 'SG', 'SG', 'SF', 'SF', 'PF', 'PF', 'C', 'C']
  const jerseys = rng.shuffle(JERSEYS).slice(0, 10)
  const roleSeen: Record<Position, number> = { PG: 0, SG: 0, SF: 0, PF: 0, C: 0 }

  positions.forEach((position, index) => {
    const name = namePool.pop()
    if (!name) return
    const role = roleSeen[position]
    roleSeen[position] += 1
    const age = rng.int(19, 37)
    const year = 2026 - age
    const month = rng.int(1, 12)
    const day = rng.int(1, 28)
    const height = rng.int(POSITION_HEIGHT[position][0], POSITION_HEIGHT[position][1])
    const weight = rng.int(POSITION_WEIGHT[position][0], POSITION_WEIGHT[position][1])
    const isAmerican = rng.next() < 0.63
    const nationality = isAmerican ? 'Estados Unidos' : rng.pick(NATIONALITIES)
    const playerId = `player-${team.abbreviation.toLowerCase()}-${index + 1}`

    players.push({
      id: playerId,
      firstName: name.first,
      lastName: name.last,
      teamId: team.id,
      position,
      jerseyNumber: jerseys[index],
      heightCm: height,
      weightKg: weight,
      birthDate: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      nationality,
      createdAt: '2026-09-01T12:00:00',
    })

    const starterBonus = role === 0 ? 5.8 : -3.2
    const teamFactor = (teamSeed.rating - 0.55) * 16
    const makeStat = (seasonId: string, gamesPlayed: number, noise = 1): PlayerSeasonStat => {
      const ppg = clamp(
        POSITION_POINTS[position] + starterBonus + teamFactor + rng.normal(0, 2.6 * noise),
        4.1,
        31.5,
      )
      const rpg = clamp(
        POSITION_REBOUNDS[position] + (role === 0 ? 1.1 : -1.1) + rng.normal(0, 0.8 * noise),
        1.2,
        13.5,
      )
      const apg = clamp(
        POSITION_ASSISTS[position] + (role === 0 ? 1.2 : -0.9) + rng.normal(0, 0.9 * noise),
        0.4,
        11.8,
      )
      const spg = clamp(POSITION_STEALS[position] + rng.normal(0, 0.25 * noise), 0.1, 2.6)
      const bpg = clamp(POSITION_BLOCKS[position] + rng.normal(0, 0.24 * noise), 0.05, 3.4)
      return {
        id: `stat-${playerId}-${seasonId}`,
        playerId,
        seasonId,
        gamesPlayed,
        points: Math.round(ppg * gamesPlayed),
        rebounds: Math.round(rpg * gamesPlayed),
        assists: Math.round(apg * gamesPlayed),
        steals: Math.round(spg * gamesPlayed),
        blocks: Math.round(bpg * gamesPlayed),
      }
    }

    const activeGames = Math.max(1, completedGames[team.id] - (rng.next() < 0.28 ? 1 : 0))
    const archivedGames = Math.max(1, 11 - (rng.next() < 0.2 ? rng.int(1, 2) : 0))
    stats.push(makeStat(ACTIVE_SEASON.id, activeGames))
    stats.push(makeStat(ARCHIVE_SEASON.id, archivedGames, 1.1))
  })

  return { players, stats }
}

export function createSeedData(): LeagueDB {
  const rng = createRng(20261029)
  const createdAt = '2026-09-01T12:00:00'
  const teams: Team[] = TEAM_SEEDS.map((seed) => ({
    id: `team-${seed.abbreviation.toLowerCase()}`,
    name: seed.name,
    city: seed.city,
    abbreviation: seed.abbreviation,
    conference: seed.conference,
    coach: seed.coach,
    founded: seed.founded,
    arena: seed.arena,
    colors: { primary: seed.primary, secondary: seed.secondary },
    createdAt,
  }))
  const ratingByTeam = new Map(
    TEAM_SEEDS.map((seed) => [`team-${seed.abbreviation.toLowerCase()}`, seed.rating]),
  )

  const activeGames = makeSeasonGames(ACTIVE_SEASON, teams, ratingByTeam, rng, 8, 5)
  const archiveGames = makeSeasonGames(ARCHIVE_SEASON, teams, ratingByTeam, rng, 11, 14)

  const completedGames: Record<string, number> = {}
  for (const team of teams) {
    completedGames[team.id] = activeGames.filter(
      (game) => game.status === 'final' && (game.homeTeamId === team.id || game.awayTeamId === team.id),
    ).length
  }

  const allNames = rng.shuffle(
    FIRST_NAMES.flatMap((first) => LAST_NAMES.map((last) => ({ first, last }))),
  )

  const players: Player[] = []
  const playerStats: PlayerSeasonStat[] = []
  for (const team of teams) {
    const seed = TEAM_SEEDS.find((item) => `team-${item.abbreviation.toLowerCase()}` === team.id)
    if (!seed) continue
    const roster = buildRoster(rng, team, seed, allNames, completedGames)
    players.push(...roster.players)
    playerStats.push(...roster.stats)
  }

  return {
    version: 1,
    teams,
    seasons: [ACTIVE_SEASON, ARCHIVE_SEASON],
    players,
    playerStats,
    games: [...activeGames, ...archiveGames],
    updatedAt: new Date().toISOString(),
  }
}
