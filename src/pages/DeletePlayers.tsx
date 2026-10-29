import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react'
import { useLeague } from '../store/LeagueContext'
import type { Player, Position } from '../types'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { PlayerAvatar, TeamLogo } from '../components/ui/TeamLogo'
import { Badge } from '../components/ui/Badge'
import { SearchInput } from '../components/ui/SearchInput'
import { Select } from '../components/ui/Field'
import { EmptyState } from '../components/ui/EmptyState'
import { Pagination } from '../components/ui/Pagination'
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

type SortMode = 'name' | 'team' | 'ppg' | 'stats'
const PAGE_SIZE = 10

export function DeletePlayers() {
  const { db, activeSeason, seasons } = useLeague()
  const [search, setSearch] = useState('')
  const [teamFilter, setTeamFilter] = useState('all')
  const [positionFilter, setPositionFilter] = useState<Position | 'all'>('all')
  const [sort, setSort] = useState<SortMode>('name')
  const [page, setPage] = useState(1)
  const [deletingPlayer, setDeletingPlayer] = useState<Player | null>(null)
  const [lastAction, setLastAction] = useState<{ name: string; statsRemoved: number } | null>(null)

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
    const list = allPlayers.filter(({ player, team }) => {
      if (teamFilter !== 'all' && player.teamId !== teamFilter) return false
      if (positionFilter !== 'all' && player.position !== positionFilter) return false
      if (!term) return true
      return normalizeSearch(
        `${player.firstName} ${player.lastName} ${player.jerseyNumber} ${team?.city ?? ''} ${team?.name ?? ''} ${
          team?.abbreviation ?? ''
        } ${player.position} ${POSITION_LABEL[player.position]} ${player.nationality}`,
      ).includes(term)
    })
    return [...list].sort((a, b) => {
      switch (sort) {
        case 'team':
          return (a.team ? teamFullName(a.team) : '').localeCompare(b.team ? teamFullName(b.team) : '')
        case 'ppg':
          return b.averages.ppg - a.averages.ppg
        case 'stats': {
          const countA = db.playerStats.filter((stat) => stat.playerId === a.player.id).length
          const countB = db.playerStats.filter((stat) => stat.playerId === b.player.id).length
          return countB - countA
        }
        default:
          return fullName(a.player).localeCompare(fullName(b.player))
      }
    })
  }, [allPlayers, db.playerStats, positionFilter, search, sort, teamFilter])

  useEffect(() => {
    setPage(1)
  }, [search, teamFilter, positionFilter, sort])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const statsRows = db.playerStats.length

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Administración"
        title="Eliminar jugadores"
        description="Gestiona la baja definitiva de jugadores. Cada eliminación requiere confirmación y limpia los registros de estadísticas vinculados."
        actions={
          <Badge tone="red" dot>
            Zona sensible
          </Badge>
        }
      />

      <div className="mb-5 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="relative overflow-hidden rounded-2xl border border-league-red/25 bg-gradient-to-br from-league-red/[0.12] via-ink-850 to-ink-850 p-5">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-league-red/30 bg-league-red/10 text-league-redSoft">
              <ShieldAlert className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-xl font-bold uppercase tracking-wide text-white">Eliminación segura</p>
              <p className="mt-1 max-w-xl text-xs leading-relaxed text-mist-300">
                El sistema elimina únicamente al jugador seleccionado y sus estadísticas de temporada. Nunca se eliminan
                otros jugadores ni se alteran los partidos. Se te pedirá confirmación antes de aplicar el cambio.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {[
              { icon: <Users className="h-4 w-4" />, label: 'Jugadores registrados', value: db.players.length },
              { icon: <Database className="h-4 w-4" />, label: 'Filas de estadísticas', value: statsRows },
              { icon: <ShieldCheck className="h-4 w-4" />, label: 'Temporadas cubiertas', value: seasons.length },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-white/[0.07] bg-black/20 px-3 py-2.5">
                <p className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-mist-500">
                  {item.icon} {item.label}
                </p>
                <p className="mt-1 font-display text-2xl font-bold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <Card className="p-5">
          <p className="flex items-center gap-2 font-display text-lg font-bold uppercase tracking-wide text-white">
            <AlertTriangle className="h-4 w-4 text-league-gold" /> Antes de eliminar
          </p>
          <ul className="mt-3 space-y-2 text-[11px] leading-relaxed text-mist-400">
            <li className="flex gap-2">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-league-gold" /> Verifica el nombre, equipo y dorsal
              del jugador en la tabla.
            </li>
            <li className="flex gap-2">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-league-gold" /> La eliminación borra las estadísticas
              de todas las temporadas de ese jugador.
            </li>
            <li className="flex gap-2">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-league-gold" /> Descarga un respaldo desde{' '}
              <Link to="/data" className="font-semibold text-league-redSoft hover:text-white">
                Datos y respaldo
              </Link>{' '}
              si necesitas conservar la información.
            </li>
          </ul>
        </Card>
      </div>

      {lastAction ? (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.07] px-4 py-3">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-emerald-200">Operación completada</p>
            <p className="mt-0.5 text-[11px] text-mist-400">
              {lastAction.name} fue eliminado correctamente. Se borraron {lastAction.statsRemoved} registro(s) de
              estadísticas y la tabla se actualizó.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setLastAction(null)}
            className="text-[10px] font-semibold uppercase tracking-wider text-mist-500 hover:text-white"
          >
            Cerrar
          </button>
        </div>
      ) : null}

      <Card padded={false} className="mb-5 p-3 sm:p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,0.9fr)_minmax(0,0.8fr)_minmax(0,0.8fr)]">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar jugador por nombre, dorsal o equipo…"
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
            <option value="name">Nombre A–Z</option>
            <option value="team">Equipo</option>
            <option value="ppg">Puntos por partido</option>
            <option value="stats">Más estadísticas</option>
          </Select>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          title={db.players.length === 0 ? 'No hay jugadores registrados' : 'Sin coincidencias'}
          description={
            db.players.length === 0
              ? 'No hay jugadores para eliminar. Registra jugadores desde el módulo de jugadores.'
              : 'Ajusta la búsqueda o los filtros para localizar al jugador que deseas eliminar.'
          }
          icon={<Users className="h-5 w-5" />}
          action={
            db.players.length > 0 ? (
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
            ) : (
              <Link to="/players" className="text-xs font-semibold text-league-redSoft hover:text-white">
                Ir a jugadores →
              </Link>
            )
          }
        />
      ) : (
        <Card padded={false} className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
            <div>
              <p className="font-display text-xl font-bold uppercase tracking-wide text-white">Jugadores registrados</p>
              <p className="mt-0.5 text-[10px] text-mist-500">
                {filtered.length} coincidencia(s) · Selecciona el botón de eliminación de una fila.
              </p>
            </div>
            <Badge tone="red">Acción irreversible</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-xs">
              <thead className="border-b border-white/[0.06] bg-white/[0.02] text-[9px] uppercase tracking-[0.12em] text-mist-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Jugador</th>
                  <th className="px-3 py-3 font-semibold">Equipo</th>
                  <th className="px-3 py-3 text-center font-semibold">Pos.</th>
                  <th className="px-3 py-3 text-center font-semibold">#</th>
                  <th className="px-3 py-3 text-center font-semibold">Edad</th>
                  <th className="px-3 py-3 text-center font-semibold">PPP</th>
                  <th className="px-3 py-3 text-center font-semibold">Estadísticas</th>
                  <th className="px-4 py-3 text-right font-semibold">Eliminar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {visible.map(({ player, team, averages, age }) => {
                  const statCount = db.playerStats.filter((stat) => stat.playerId === player.id).length
                  return (
                    <tr key={player.id} className="group transition hover:bg-league-red/[0.03]">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <PlayerAvatar
                            firstName={player.firstName}
                            lastName={player.lastName}
                            team={team}
                            size={32}
                          />
                          <div className="min-w-0">
                            <Link
                              to={`/players/${player.id}`}
                              className="truncate font-semibold text-mist-100 hover:text-white"
                            >
                              {fullName(player)}
                            </Link>
                            <p className="text-[9px] uppercase tracking-wider text-mist-500">
                              {player.nationality} · {POSITION_LABEL[player.position]}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        {team ? (
                          <Link to={`/teams/${team.id}`} className="flex items-center gap-2 text-mist-300 hover:text-white">
                            <TeamLogo team={team} size={20} />
                            <span className="font-semibold">{team.abbreviation}</span>
                            <span className="hidden text-[10px] text-mist-500 lg:inline">{team.name}</span>
                          </Link>
                        ) : (
                          <span className="text-mist-600">Sin equipo</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Badge tone="neutral">{player.position}</Badge>
                      </td>
                      <td className="px-3 py-2.5 text-center font-display text-base font-bold text-white">
                        {player.jerseyNumber}
                      </td>
                      <td className="px-3 py-2.5 text-center text-mist-300">{age}</td>
                      <td className="px-3 py-2.5 text-center font-display text-sm font-bold text-white">
                        {formatDecimal(averages.ppg, 1)}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] text-mist-400">
                          <Database className="h-3 w-3" /> {statCount} temporada{statCount === 1 ? '' : 's'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => setDeletingPlayer(player)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-league-red/25 bg-league-red/[0.08] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-league-redSoft transition hover:border-league-red/60 hover:bg-league-red/15 hover:text-white"
                          aria-label={`Eliminar a ${fullName(player)}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Eliminar
                        </button>
                      </td>
                    </tr>
                  )
                })}
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

      <p className="mt-4 flex items-start gap-2 text-[10px] leading-relaxed text-mist-500">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-league-gold" />
        Esta operación elimina datos de la base local de este navegador. Si necesitas recuperarlos, importa un respaldo
        JSON desde Datos y respaldo.
      </p>

      <PlayerDeleteDialog
        open={Boolean(deletingPlayer)}
        onClose={() => setDeletingPlayer(null)}
        player={deletingPlayer}
        onDeleted={(info) => {
          setDeletingPlayer(null)
          setLastAction(info)
        }}
      />
    </div>
  )
}
