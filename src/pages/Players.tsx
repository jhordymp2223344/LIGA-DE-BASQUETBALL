import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Pencil, Plus, Trash2, UserRound, Users } from 'lucide-react'
import { useLeague } from '../store/LeagueContext'
import type { Player, Position } from '../types'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { PlayerAvatar } from '../components/ui/TeamLogo'
import { Badge } from '../components/ui/Badge'
import { SearchInput } from '../components/ui/SearchInput'
import { Select } from '../components/ui/Field'
import { EmptyState } from '../components/ui/EmptyState'
import { Pagination } from '../components/ui/Pagination'
import { PlayerFormModal } from '../components/players/PlayerFormModal'
import { PlayerDeleteDialog } from '../components/dialogs/DeleteDialogs'
import { buildPlayerList } from '../lib/stats'
import {
  POSITION_LABEL,
  POSITIONS,
  formatDecimal,
  fullName,
  normalizeSearch,
  teamFullName,
} from '../lib/format'

type SortMode = 'name' | 'ppg' | 'rpg' | 'apg' | 'age' | 'jersey'
const PAGE_SIZE = 12

export function Players() {
  const { db, activeSeason } = useLeague()
  const [search, setSearch] = useState('')
  const [teamFilter, setTeamFilter] = useState('all')
  const [positionFilter, setPositionFilter] = useState<Position | 'all'>('all')
  const [sort, setSort] = useState<SortMode>('ppg')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [deletingPlayer, setDeletingPlayer] = useState<Player | null>(null)

  const allPlayers = useMemo(
    () => buildPlayerList(db.players, db.teams, db.playerStats, activeSeason.id),
    [activeSeason.id, db.playerStats, db.players, db.teams],
  )

  const sortedTeams = useMemo(
    () => [...db.teams].sort((a, b) => teamFullName(a).localeCompare(teamFullName(b))),
    [db.teams],
  )

  const filtered = useMemo(() => {
    const term = normalizeSearch(search.trim())
    const list = allPlayers.filter(({ player, team, averages }) => {
      if (teamFilter !== 'all' && player.teamId !== teamFilter) return false
      if (positionFilter !== 'all' && player.position !== positionFilter) return false
      if (!term) return true
      const haystack = normalizeSearch(
        `${player.firstName} ${player.lastName} ${player.jerseyNumber} ${team?.city ?? ''} ${team?.name ?? ''} ${
          team?.abbreviation ?? ''
        } ${player.position} ${POSITION_LABEL[player.position]} ${player.nationality} ${averages.ppg.toFixed(1)}`,
      )
      return haystack.includes(term)
    })
    return [...list].sort((a, b) => {
      switch (sort) {
        case 'name':
          return fullName(a.player).localeCompare(fullName(b.player))
        case 'rpg':
          return b.averages.rpg - a.averages.rpg
        case 'apg':
          return b.averages.apg - a.averages.apg
        case 'age':
          return a.age - b.age
        case 'jersey':
          return a.player.jerseyNumber - b.player.jerseyNumber
        default:
          return b.averages.ppg - a.averages.ppg
      }
    })
  }, [allPlayers, positionFilter, search, sort, teamFilter])

  useEffect(() => {
    setPage(1)
  }, [search, teamFilter, positionFilter, sort])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const activeTeams = new Set(db.players.map((player) => player.teamId)).size
  const avgAge =
    allPlayers.length > 0
      ? allPlayers.reduce((sum, item) => sum + item.age, 0) / allPlayers.length
      : 0

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Talento de la liga"
        title="Jugadores"
        description={`Fichas completas y estadísticas individuales de la temporada ${activeSeason.name}. Busca por nombre, dorsal o equipo.`}
        actions={
          <Button
            onClick={() => {
              setEditingPlayer(null)
              setFormOpen(true)
            }}
            icon={<Plus className="h-4 w-4" />}
          >
            Nuevo jugador
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2 text-[11px] text-mist-400">
        <Badge tone="red">{db.players.length} jugadores</Badge>
        <Badge tone="blue">{activeTeams} equipos con plantilla</Badge>
        <Badge tone="neutral">Edad media {formatDecimal(avgAge, 1)} años</Badge>
        <span className="hidden h-3 w-px bg-white/10 sm:block" />
        <span className="flex items-center gap-1.5">
          <UserRound className="h-3.5 w-3.5" /> {POSITIONS.length} posiciones
        </span>
      </div>

      <Card padded={false} className="mb-5 p-3 sm:p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.7fr)_minmax(0,0.8fr)]">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre, dorsal, equipo o nacionalidad…"
          />
          <Select
            value={teamFilter}
            onChange={(event) => setTeamFilter(event.target.value)}
            className="h-10 text-xs"
            aria-label="Filtrar por equipo"
          >
            <option value="all">Todos los equipos</option>
            {sortedTeams.map((team) => (
              <option key={team.id} value={team.id}>
                {teamFullName(team)}
              </option>
            ))}
          </Select>
          <Select
            value={positionFilter}
            onChange={(event) => setPositionFilter(event.target.value as Position | 'all')}
            className="h-10 text-xs"
            aria-label="Filtrar por posición"
          >
            <option value="all">Todas las posiciones</option>
            {POSITIONS.map((position) => (
              <option key={position} value={position}>
                {POSITION_LABEL[position]} ({position})
              </option>
            ))}
          </Select>
          <Select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortMode)}
            className="h-10 text-xs"
            aria-label="Ordenar jugadores"
          >
            <option value="ppg">Más puntos por partido</option>
            <option value="rpg">Más rebotes</option>
            <option value="apg">Más asistencias</option>
            <option value="name">Nombre A–Z</option>
            <option value="age">Menor edad</option>
            <option value="jersey">Dorsal</option>
          </Select>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          title={db.players.length === 0 ? 'No hay jugadores registrados' : 'Sin coincidencias'}
          description={
            db.players.length === 0
              ? 'Registra el primer jugador y asígnalo a uno de los equipos de la liga.'
              : 'Prueba con otro nombre, dorsal o cambia los filtros de equipo y posición.'
          }
          icon={<Users className="h-5 w-5" />}
          action={
            db.players.length === 0 ? (
              <Button onClick={() => setFormOpen(true)} icon={<Plus className="h-4 w-4" />}>
                Registrar jugador
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch('')
                  setTeamFilter('all')
                  setPositionFilter('all')
                }}
              >
                Limpiar filtros
              </Button>
            )
          }
        />
      ) : (
        <Card padded={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-xs">
              <thead className="border-b border-white/[0.06] bg-white/[0.02] text-[9px] uppercase tracking-[0.12em] text-mist-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Jugador</th>
                  <th className="px-3 py-3 font-semibold">Equipo</th>
                  <th className="px-3 py-3 text-center font-semibold">Pos.</th>
                  <th className="px-3 py-3 text-center font-semibold">#</th>
                  <th className="px-3 py-3 text-center font-semibold">Edad</th>
                  <th className="px-3 py-3 text-center font-semibold">Estatura</th>
                  <th className="px-3 py-3 text-center font-semibold">PJ</th>
                  <th className="px-3 py-3 text-center font-semibold">PPP</th>
                  <th className="px-3 py-3 text-center font-semibold">RPP</th>
                  <th className="px-3 py-3 text-center font-semibold">APP</th>
                  <th className="px-3 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {visible.map(({ player, team, averages, age, stat }) => (
                  <tr key={player.id} className="group transition hover:bg-white/[0.035]">
                    <td className="px-4 py-2.5">
                      <Link to={`/players/${player.id}`} className="flex items-center gap-2.5">
                        <PlayerAvatar
                          firstName={player.firstName}
                          lastName={player.lastName}
                          team={team}
                          size={32}
                        />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-mist-100 group-hover:text-white">
                            {fullName(player)}
                          </p>
                          <p className="text-[9px] uppercase tracking-wider text-mist-500">
                            {player.nationality} · {formatDecimal(averages.ppg, 1)} PPP
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-3 py-2.5">
                      {team ? (
                        <Link to={`/teams/${team.id}`} className="flex items-center gap-1.5 text-mist-300 hover:text-white">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: team.colors.primary }}
                          />
                          <span className="font-semibold">{team.abbreviation}</span>
                        </Link>
                      ) : (
                        <span className="text-mist-600">Libre</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <Badge tone="neutral">{player.position}</Badge>
                    </td>
                    <td className="px-3 py-2.5 text-center font-display text-base font-bold text-white">
                      {player.jerseyNumber}
                    </td>
                    <td className="px-3 py-2.5 text-center text-mist-300">{age}</td>
                    <td className="px-3 py-2.5 text-center text-mist-400">{player.heightCm} cm</td>
                    <td className="px-3 py-2.5 text-center text-mist-400">{stat?.gamesPlayed ?? 0}</td>
                    <td className="px-3 py-2.5 text-center font-display text-sm font-bold text-white">
                      {formatDecimal(averages.ppg, 1)}
                    </td>
                    <td className="px-3 py-2.5 text-center text-mist-300">{formatDecimal(averages.rpg, 1)}</td>
                    <td className="px-3 py-2.5 text-center text-mist-300">{formatDecimal(averages.apg, 1)}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/players/${player.id}`}
                          className="rounded p-1.5 text-mist-500 transition hover:bg-white/[0.06] hover:text-white"
                          aria-label={`Ver perfil de ${fullName(player)}`}
                          title="Ver perfil"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPlayer(player)
                            setFormOpen(true)
                          }}
                          className="rounded p-1.5 text-mist-500 transition hover:bg-white/[0.06] hover:text-white"
                          aria-label={`Editar ${fullName(player)}`}
                          title="Editar jugador"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingPlayer(player)}
                          className="rounded p-1.5 text-mist-500 transition hover:bg-league-red/10 hover:text-league-redSoft"
                          aria-label={`Eliminar ${fullName(player)}`}
                          title="Eliminar jugador"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={currentPage}
            pageCount={pageCount}
            total={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            itemLabel="jugadores"
          />
        </Card>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] text-mist-500">
          {sort === 'ppg' ? 'Ordenado por puntos por partido.' : 'Usa los filtros y la búsqueda para encontrar jugadores.'} Los
          promedios se recalculan con los totales de temporada.
        </p>
        <Link
          to="/players/delete"
          className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-league-redSoft/80 transition hover:text-league-redSoft"
        >
          <Trash2 className="h-3.5 w-3.5" /> Módulo de eliminación
        </Link>
      </div>

      <PlayerFormModal open={formOpen} onClose={() => setFormOpen(false)} player={editingPlayer} />
      <PlayerDeleteDialog
        open={Boolean(deletingPlayer)}
        onClose={() => setDeletingPlayer(null)}
        player={deletingPlayer}
        onDeleted={() => setDeletingPlayer(null)}
      />
    </div>
  )
}
