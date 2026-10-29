import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  Game,
  GameFormValues,
  LeagueDB,
  Player,
  PlayerFormValues,
  PlayerSeasonStat,
  Season,
  Team,
  TeamFormValues,
} from '../types'
import { makeId } from '../lib/id'
import { loadLeagueDB, saveLeagueDB } from '../lib/storage'
import { activeSeason } from '../lib/stats'
import { createSeedData } from '../data/seed'

interface DeleteTeamResult {
  deletedPlayers: number
  deletedGames: number
}

interface LeagueContextValue {
  db: LeagueDB
  activeSeason: Season
  seasons: Season[]
  createTeam: (values: TeamFormValues) => Team
  updateTeam: (id: string, values: TeamFormValues) => void
  deleteTeam: (id: string) => DeleteTeamResult
  createPlayer: (values: PlayerFormValues) => Player
  updatePlayer: (id: string, values: PlayerFormValues) => void
  deletePlayer: (id: string) => number
  createGame: (values: GameFormValues) => Game
  updateGameResult: (id: string, homeScore: number, awayScore: number) => void
  deleteGame: (id: string) => void
  replaceDatabase: (db: LeagueDB) => void
  resetDemoData: () => void
  playerStatsFor: (playerId: string, seasonId: string) => PlayerSeasonStat | undefined
  toastStorageIssue: boolean
}

const LeagueContext = createContext<LeagueContextValue | null>(null)

function teamFromValues(values: TeamFormValues, id: string, createdAt: string): Team {
  return {
    id,
    name: values.name.trim(),
    city: values.city.trim(),
    abbreviation: values.abbreviation.trim().toUpperCase(),
    conference: values.conference,
    coach: values.coach.trim(),
    founded: Number(values.founded),
    arena: values.arena.trim(),
    colors: {
      primary: values.primaryColor,
      secondary: values.secondaryColor,
    },
    createdAt,
  }
}

function statValuesFromForm(values: PlayerFormValues): Omit<PlayerSeasonStat, 'id' | 'playerId' | 'seasonId'> {
  return {
    gamesPlayed: Math.max(0, Math.round(Number(values.gamesPlayed) || 0)),
    points: Math.max(0, Math.round(Number(values.points) || 0)),
    rebounds: Math.max(0, Math.round(Number(values.rebounds) || 0)),
    assists: Math.max(0, Math.round(Number(values.assists) || 0)),
    steals: Math.max(0, Math.round(Number(values.steals) || 0)),
    blocks: Math.max(0, Math.round(Number(values.blocks) || 0)),
  }
}

export function LeagueProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<LeagueDB>(() => loadLeagueDB())
  const [toastStorageIssue, setToastStorageIssue] = useState(false)

  useEffect(() => {
    const saved = saveLeagueDB(db)
    setToastStorageIssue(!saved)
  }, [db])

  const seasons = useMemo(
    () => [...db.seasons].sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [db.seasons],
  )
  const currentSeason = useMemo(() => activeSeason(seasons) as Season, [seasons])

  const commit = useCallback((updater: (previous: LeagueDB) => LeagueDB) => {
    setDb((previous) => {
      const next = updater(previous)
      return { ...next, updatedAt: new Date().toISOString() }
    })
  }, [])

  const createTeam = useCallback(
    (values: TeamFormValues) => {
      const abbreviation = values.abbreviation.trim().toUpperCase()
      const duplicate = db.teams.some(
        (team) =>
          team.abbreviation.toUpperCase() === abbreviation ||
          `${team.city} ${team.name}`.toLowerCase() === `${values.city.trim()} ${values.name.trim()}`.toLowerCase(),
      )
      if (duplicate) {
        throw new Error('Ya existe un equipo con esa abreviatura o con ese nombre completo.')
      }
      const team = teamFromValues(values, makeId('team'), new Date().toISOString())
      commit((previous) => ({ ...previous, teams: [...previous.teams, team] }))
      return team
    },
    [commit, db.teams],
  )

  const updateTeam = useCallback(
    (id: string, values: TeamFormValues) => {
      const abbreviation = values.abbreviation.trim().toUpperCase()
      const duplicate = db.teams.some(
        (team) =>
          team.id !== id &&
          (team.abbreviation.toUpperCase() === abbreviation ||
            `${team.city} ${team.name}`.toLowerCase() ===
              `${values.city.trim()} ${values.name.trim()}`.toLowerCase()),
      )
      if (duplicate) {
        throw new Error('Ya existe otro equipo con esa abreviatura o con ese nombre completo.')
      }
      commit((previous) => ({
        ...previous,
        teams: previous.teams.map((team) =>
          team.id === id ? teamFromValues(values, id, team.createdAt) : team,
        ),
      }))
    },
    [commit, db.teams],
  )

  const deleteTeam = useCallback(
    (id: string) => {
      const playerIds = new Set(db.players.filter((player) => player.teamId === id).map((player) => player.id))
      const deletedGames = db.games.filter(
        (game) => game.homeTeamId === id || game.awayTeamId === id,
      ).length
      commit((previous) => ({
        ...previous,
        teams: previous.teams.filter((team) => team.id !== id),
        players: previous.players.filter((player) => player.teamId !== id),
        playerStats: previous.playerStats.filter((stat) => !playerIds.has(stat.playerId)),
        games: previous.games.filter(
          (game) => game.homeTeamId !== id && game.awayTeamId !== id,
        ),
      }))
      return { deletedPlayers: playerIds.size, deletedGames }
    },
    [commit, db.games, db.players],
  )

  const createPlayer = useCallback(
    (values: PlayerFormValues) => {
      const jersey = Number(values.jerseyNumber)
      const duplicateJersey = db.players.some(
        (player) => player.teamId === values.teamId && player.jerseyNumber === jersey,
      )
      if (duplicateJersey) {
        throw new Error('Ese dorsal ya está asignado a otro jugador del mismo equipo.')
      }
      const playerId = makeId('player')
      const player: Player = {
        id: playerId,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        teamId: values.teamId,
        position: values.position,
        jerseyNumber: jersey,
        heightCm: Number(values.heightCm),
        weightKg: Number(values.weightKg),
        birthDate: values.birthDate,
        nationality: values.nationality.trim(),
        createdAt: new Date().toISOString(),
      }
      const statValues = statValuesFromForm(values)
      const stat: PlayerSeasonStat = {
        id: makeId('stat'),
        playerId,
        seasonId: currentSeason.id,
        ...statValues,
      }
      commit((previous) => ({
        ...previous,
        players: [...previous.players, player],
        playerStats: [...previous.playerStats, stat],
      }))
      return player
    },
    [commit, currentSeason.id, db.players],
  )

  const updatePlayer = useCallback(
    (id: string, values: PlayerFormValues) => {
      const jersey = Number(values.jerseyNumber)
      const duplicateJersey = db.players.some(
        (player) =>
          player.id !== id &&
          player.teamId === values.teamId &&
          player.jerseyNumber === jersey,
      )
      if (duplicateJersey) {
        throw new Error('Ese dorsal ya está asignado a otro jugador del mismo equipo.')
      }
      const statValues = statValuesFromForm(values)
      const existingStat = db.playerStats.find(
        (stat) => stat.playerId === id && stat.seasonId === currentSeason.id,
      )
      commit((previous) => {
        const updatedPlayers = previous.players.map((player) =>
          player.id === id
            ? {
                ...player,
                firstName: values.firstName.trim(),
                lastName: values.lastName.trim(),
                teamId: values.teamId,
                position: values.position,
                jerseyNumber: jersey,
                heightCm: Number(values.heightCm),
                weightKg: Number(values.weightKg),
                birthDate: values.birthDate,
                nationality: values.nationality.trim(),
              }
            : player,
        )
        const updatedStats = existingStat
          ? previous.playerStats.map((stat) =>
              stat.id === existingStat.id ? { ...stat, ...statValues } : stat,
            )
          : [
              ...previous.playerStats,
              {
                id: makeId('stat'),
                playerId: id,
                seasonId: currentSeason.id,
                ...statValues,
              },
            ]
        return { ...previous, players: updatedPlayers, playerStats: updatedStats }
      })
    },
    [commit, currentSeason.id, db.playerStats, db.players],
  )

  const deletePlayer = useCallback(
    (id: string) => {
      const statCount = db.playerStats.filter((stat) => stat.playerId === id).length
      commit((previous) => ({
        ...previous,
        players: previous.players.filter((player) => player.id !== id),
        playerStats: previous.playerStats.filter((stat) => stat.playerId !== id),
      }))
      return statCount
    },
    [commit, db.playerStats],
  )

  const createGame = useCallback(
    (values: GameFormValues) => {
      const homeTeam = db.teams.find((team) => team.id === values.homeTeamId)
      if (!homeTeam) throw new Error('El equipo local no existe.')
      if (values.homeTeamId === values.awayTeamId) {
        throw new Error('El equipo local y el visitante deben ser diferentes.')
      }
      const game: Game = {
        id: makeId('game'),
        seasonId: values.seasonId,
        date: values.date,
        homeTeamId: values.homeTeamId,
        awayTeamId: values.awayTeamId,
        status: 'scheduled',
        venue: values.venue.trim() || homeTeam.arena,
      }
      commit((previous) => ({ ...previous, games: [...previous.games, game] }))
      return game
    },
    [commit, db.teams],
  )

  const updateGameResult = useCallback(
    (id: string, homeScore: number, awayScore: number) => {
      commit((previous) => ({
        ...previous,
        games: previous.games.map((game) =>
          game.id === id
            ? { ...game, status: 'final', homeScore, awayScore }
            : game,
        ),
      }))
    },
    [commit],
  )

  const deleteGame = useCallback(
    (id: string) => {
      commit((previous) => ({
        ...previous,
        games: previous.games.filter((game) => game.id !== id),
      }))
    },
    [commit],
  )

  const replaceDatabase = useCallback((next: LeagueDB) => {
    setDb({ ...next, updatedAt: new Date().toISOString() })
  }, [])

  const resetDemoData = useCallback(() => {
    setDb(createSeedData())
  }, [])

  const playerStatsFor = useCallback(
    (playerId: string, seasonId: string) =>
      db.playerStats.find(
        (stat) => stat.playerId === playerId && stat.seasonId === seasonId,
      ),
    [db.playerStats],
  )

  const value = useMemo<LeagueContextValue>(
    () => ({
      db,
      activeSeason: currentSeason,
      seasons,
      createTeam,
      updateTeam,
      deleteTeam,
      createPlayer,
      updatePlayer,
      deletePlayer,
      createGame,
      updateGameResult,
      deleteGame,
      replaceDatabase,
      resetDemoData,
      playerStatsFor,
      toastStorageIssue,
    }),
    [
      db,
      currentSeason,
      seasons,
      createTeam,
      updateTeam,
      deleteTeam,
      createPlayer,
      updatePlayer,
      deletePlayer,
      createGame,
      updateGameResult,
      deleteGame,
      replaceDatabase,
      resetDemoData,
      playerStatsFor,
      toastStorageIssue,
    ],
  )

  return <LeagueContext.Provider value={value}>{children}</LeagueContext.Provider>
}

export function useLeague(): LeagueContextValue {
  const context = useContext(LeagueContext)
  if (!context) throw new Error('useLeague debe usarse dentro de LeagueProvider')
  return context
}
