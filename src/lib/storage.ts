import type {
  Game,
  LeagueDB,
  Player,
  PlayerSeasonStat,
  Season,
  Team,
} from '../types'
import { createSeedData } from '../data/seed'

export const STORAGE_KEY = 'usblm.league.v1'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isNonNegativeNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && isNonNegativeNumber(value)
}

function isTeam(value: unknown): value is Team {
  if (!isPlainObject(value)) return false
  if (
    !isText(value.id) ||
    !isText(value.name) ||
    !isText(value.city) ||
    !isText(value.abbreviation) ||
    !isText(value.coach) ||
    !isText(value.arena) ||
    !isText(value.createdAt)
  ) {
    return false
  }
  if (value.conference !== 'East' && value.conference !== 'West') return false
  if (!Number.isInteger(value.founded)) return false
  if (!isPlainObject(value.colors)) return false
  return isText(value.colors.primary) && isText(value.colors.secondary)
}

function isSeason(value: unknown): value is Season {
  if (!isPlainObject(value)) return false
  return (
    isText(value.id) &&
    isText(value.name) &&
    isText(value.startDate) &&
    isText(value.endDate) &&
    typeof value.isActive === 'boolean'
  )
}

function isPlayer(value: unknown): value is Player {
  if (!isPlainObject(value)) return false
  const positions = ['PG', 'SG', 'SF', 'PF', 'C']
  return (
    isText(value.id) &&
    isText(value.firstName) &&
    isText(value.lastName) &&
    isText(value.teamId) &&
    typeof value.position === 'string' &&
    positions.includes(value.position) &&
    isNonNegativeInteger(value.jerseyNumber) &&
    isNonNegativeNumber(value.heightCm) &&
    isNonNegativeNumber(value.weightKg) &&
    isText(value.birthDate) &&
    isText(value.nationality) &&
    isText(value.createdAt)
  )
}

function isPlayerStat(value: unknown): value is PlayerSeasonStat {
  if (!isPlainObject(value)) return false
  return (
    isText(value.id) &&
    isText(value.playerId) &&
    isText(value.seasonId) &&
    isNonNegativeInteger(value.gamesPlayed) &&
    isNonNegativeInteger(value.points) &&
    isNonNegativeInteger(value.rebounds) &&
    isNonNegativeInteger(value.assists) &&
    isNonNegativeInteger(value.steals) &&
    isNonNegativeInteger(value.blocks)
  )
}

function isGame(value: unknown): value is Game {
  if (!isPlainObject(value)) return false
  if (
    !isText(value.id) ||
    !isText(value.seasonId) ||
    !isText(value.date) ||
    !isText(value.homeTeamId) ||
    !isText(value.awayTeamId) ||
    !isText(value.venue) ||
    value.homeTeamId === value.awayTeamId
  ) {
    return false
  }
  if (value.status !== 'scheduled' && value.status !== 'final') return false
  if (value.status === 'final') {
    if (!isNonNegativeInteger(value.homeScore) || !isNonNegativeInteger(value.awayScore)) return false
    if (value.homeScore === value.awayScore) return false
  }
  if (value.homeScore !== undefined && !isNonNegativeInteger(value.homeScore)) return false
  if (value.awayScore !== undefined && !isNonNegativeInteger(value.awayScore)) return false
  return true
}

function hasUniqueIds(items: Array<{ id: string }>): boolean {
  return new Set(items.map((item) => item.id)).size === items.length
}

export function isValidLeagueDB(value: unknown): value is LeagueDB {
  if (!isPlainObject(value)) return false
  if (typeof value.version !== 'number') return false
  if (!isText(value.updatedAt)) return false
  if (
    !Array.isArray(value.teams) ||
    !Array.isArray(value.players) ||
    !Array.isArray(value.games) ||
    !Array.isArray(value.seasons) ||
    !Array.isArray(value.playerStats)
  ) {
    return false
  }
  if (!value.teams.every(isTeam) || !value.players.every(isPlayer)) return false
  if (!value.seasons.every(isSeason) || !value.playerStats.every(isPlayerStat)) return false
  if (!value.games.every(isGame)) return false

  const teams = value.teams as Team[]
  const players = value.players as Player[]
  const seasons = value.seasons as Season[]
  const games = value.games as Game[]
  const stats = value.playerStats as PlayerSeasonStat[]

  if (teams.length === 0 || seasons.length === 0) return false
  if (!seasons.some((season) => season.isActive)) return false
  if (
    !hasUniqueIds(teams) ||
    !hasUniqueIds(players) ||
    !hasUniqueIds(seasons) ||
    !hasUniqueIds(games) ||
    !hasUniqueIds(stats)
  ) {
    return false
  }

  const teamIds = new Set(teams.map((team) => team.id))
  const playerIds = new Set(players.map((player) => player.id))
  const seasonIds = new Set(seasons.map((season) => season.id))
  if (!players.every((player) => teamIds.has(player.teamId))) return false
  if (!stats.every((stat) => playerIds.has(stat.playerId) && seasonIds.has(stat.seasonId))) return false
  if (
    !games.every(
      (game) =>
        seasonIds.has(game.seasonId) &&
        teamIds.has(game.homeTeamId) &&
        teamIds.has(game.awayTeamId),
    )
  ) {
    return false
  }

  return true
}

export function canUseStorage(): boolean {
  try {
    const probe = '__usblm_probe__'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return true
  } catch {
    return false
  }
}

export function loadLeagueDB(): LeagueDB {
  if (!canUseStorage()) return createSeedData()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const seed = createSeedData()
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
      return seed
    }
    const parsed: unknown = JSON.parse(raw)
    if (!isValidLeagueDB(parsed)) {
      const seed = createSeedData()
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
      return seed
    }
    return parsed
  } catch {
    return createSeedData()
  }
}

export function saveLeagueDB(db: LeagueDB): boolean {
  if (!canUseStorage()) return false
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
    return true
  } catch {
    return false
  }
}

export function parseImportedDB(raw: string): { db?: LeagueDB; error?: string } {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isValidLeagueDB(parsed)) {
      return {
        error:
          'El archivo no tiene una estructura válida o contiene referencias rotas entre equipos, jugadores, temporadas y partidos. Usa un respaldo JSON generado por esta aplicación.',
      }
    }
    return { db: parsed }
  } catch {
    return { error: 'No se pudo leer el archivo. Verifica que sea un JSON válido.' }
  }
}

export function formatStorageSize(db: LeagueDB): string {
  const bytes = new Blob([JSON.stringify(db)]).size
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
