import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Clock,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Trophy,
} from 'lucide-react'
import { useLeague } from '../store/LeagueContext'
import type { Game } from '../types'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { TeamLogo } from '../components/ui/TeamLogo'
import { Badge } from '../components/ui/Badge'
import { SearchInput, Tabs } from '../components/ui/SearchInput'
import { Select } from '../components/ui/Field'
import { EmptyState } from '../components/ui/EmptyState'
import { Pagination } from '../components/ui/Pagination'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { GameFormModal, GameResultModal } from '../components/games/GameModals'
import { useToast } from '../components/ui/ToastProvider'
import { isFinal, gameWinner } from '../lib/stats'
import {
  formatDate,
  formatNumber,
  formatShortDate,
  formatTime,
  normalizeSearch,
  teamFullName,
} from '../lib/format'

type StatusFilter = 'all' | 'final' | 'scheduled'
type SortMode = 'date-desc' | 'date-asc' | 'matchup'
const PAGE_SIZE = 12

export function Games() {
  const { db, activeSeason, seasons, deleteGame } = useLeague()
  const { notify } = useToast()
  const [seasonId, setSeasonId] = useState(activeSeason.id)
  const [status, setStatus] = useState<StatusFilter>('all')
  const [teamFilter, setTeamFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortMode>('date-desc')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [resultGame, setResultGame] = useState<Game | null>(null)
  const [deletingGame, setDeletingGame] = useState<Game | null>(null)

  const season = seasons.find((item) => item.id === seasonId) ?? activeSeason
  const teamsById = useMemo(() => new Map(db.teams.map((team) => [team.id, team])), [db.teams])
  const sortedTeams = useMemo(
    () => [...db.teams].sort((a, b) => teamFullName(a).localeCompare(teamFullName(b))),
    [db.teams],
  )

  const seasonGames = useMemo(
    () => db.games.filter((game) => game.seasonId === seasonId),
    [db.games, seasonId],
  )

  const filtered = useMemo(() => {
    const term = normalizeSearch(search.trim())
    const list = seasonGames.filter((game) => {
      if (status !== 'all' && game.status !== status) return false
      if (teamFilter !== 'all' && game.homeTeamId !== teamFilter && game.awayTeamId !== teamFilter) return false
      if (!term) return true
      const home = teamsById.get(game.homeTeamId)
      const away = teamsById.get(game.awayTeamId)
      return normalizeSearch(
        `${home?.city} ${home?.name} ${home?.abbreviation} ${away?.city} ${away?.name} ${away?.abbreviation} ${
          game.venue
        } ${game.homeScore ?? ''} ${game.awayScore ?? ''}`,
      ).includes(term)
    })
    return [...list].sort((a, b) => {
      if (sort === 'matchup') {
        const homeA = teamsById.get(a.homeTeamId)?.abbreviation ?? ''
        const homeB = teamsById.get(b.homeTeamId)?.abbreviation ?? ''
        return homeA.localeCompare(homeB)
      }
      const diff = new Date(a.date).getTime() - new Date(b.date).getTime()
      return sort === 'date-asc' ? diff : -diff
    })
  }, [seasonGames, sort, status, teamFilter, teamsById, search])

  useEffect(() => {
    setPage(1)
  }, [seasonId, status, teamFilter, search, sort])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const finals = seasonGames.filter(isFinal)
  const scheduled = seasonGames.filter((game) => game.status === 'scheduled')
  const avgPoints =
    finals.length > 0
      ? finals.reduce((sum, game) => sum + (game.homeScore ?? 0) + (game.awayScore ?? 0), 0) / (finals.length * 2)
      : 0

  const deleteTargetHome = deletingGame ? db.teams.find((team) => team.id === deletingGame.homeTeamId) : undefined
  const deleteTargetAway = deletingGame ? db.teams.find((team) => team.id === deletingGame.awayTeamId) : undefined

  const handleDelete = () => {
    if (!deletingGame) return
    const label =
      deleteTargetHome && deleteTargetAway
        ? `${deleteTargetAway.abbreviation} @ ${deleteTargetHome.abbreviation}`
        : 'El partido'
    deleteGame(deletingGame.id)
    notify('Partido eliminado', {
      message: `${label} se eliminó del calendario. La clasificación se recalculó automáticamente.`,
      variant: 'success',
    })
    setDeletingGame(null)
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Calendario"
        title="Partidos"
        description={`Gestiona el calendario y los resultados de la temporada ${season.name}. Cada marcador final recalcula la clasificación.`}
        actions={
          <Button onClick={() => setCreateOpen(true)} icon={<CalendarPlus className="h-4 w-4" />}>
            Programar partido
          </Button>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-ink-850/80 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-league-red/10 text-league-redSoft">
            <CalendarDays className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-2xl font-bold leading-none text-white">{seasonGames.length}</p>
            <p className="mt-0.5 text-[9px] uppercase tracking-wider text-mist-500">Partidos en la temporada</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-ink-850/80 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-400/10 text-emerald-300">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-2xl font-bold leading-none text-white">{finals.length}</p>
            <p className="mt-0.5 text-[9px] uppercase tracking-wider text-mist-500">
              Finalizados · {formatNumber(Math.round(avgPoints))} pts promedio
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-ink-850/80 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-league-blue/10 text-league-blueSoft">
            <Clock className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-2xl font-bold leading-none text-white">{scheduled.length}</p>
            <p className="mt-0.5 text-[9px] uppercase tracking-wider text-mist-500">Programados</p>
          </div>
        </div>
      </div>

      <Card padded={false} className="mb-5 p-3 sm:p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.7fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_auto]">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por equipo, pabellón o marcador…"
          />
          <Select
            value={seasonId}
            onChange={(event) => setSeasonId(event.target.value)}
            className="h-10 text-xs"
            aria-label="Temporada"
          >
            {seasons.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
                {item.isActive ? ' · Activa' : ''}
              </option>
            ))}
          </Select>
          <Select
            value={teamFilter}
            onChange={(event) => setTeamFilter(event.target.value)}
            className="h-10 text-xs"
            aria-label="Equipo"
          >
            <option value="all">Todos los equipos</option>
            {sortedTeams.map((team) => (
              <option key={team.id} value={team.id}>
                {teamFullName(team)}
              </option>
            ))}
          </Select>
          <Select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortMode)}
            className="h-10 text-xs"
            aria-label="Ordenar partidos"
          >
            <option value="date-desc">Fecha más reciente</option>
            <option value="date-asc">Fecha más antigua</option>
            <option value="matchup">Equipo local A–Z</option>
          </Select>
          <Tabs
            options={[
              { value: 'all', label: 'Todos', count: seasonGames.length },
              { value: 'final', label: 'Finales', count: finals.length },
              { value: 'scheduled', label: 'Próximos', count: scheduled.length },
            ]}
            value={status}
            onChange={(value) => setStatus(value as StatusFilter)}
            size="sm"
          />
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          title={seasonGames.length === 0 ? 'No hay partidos en esta temporada' : 'Sin coincidencias'}
          description={
            seasonGames.length === 0
              ? 'Programa el primer partido para comenzar a construir el calendario y la clasificación.'
              : 'Ajusta los filtros o la búsqueda para encontrar el partido que buscas.'
          }
          icon={<CalendarDays className="h-5 w-5" />}
          action={
            seasonGames.length === 0 ? (
              <Button onClick={() => setCreateOpen(true)} icon={<Plus className="h-4 w-4" />}>
                Programar partido
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch('')
                  setTeamFilter('all')
                  setStatus('all')
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
            <table className="w-full min-w-[960px] text-left text-xs">
              <thead className="border-b border-white/[0.06] bg-white/[0.02] text-[9px] uppercase tracking-[0.12em] text-mist-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-3 py-3 font-semibold">Enfrentamiento</th>
                  <th className="px-3 py-3 font-semibold">Pabellón</th>
                  <th className="px-3 py-3 text-center font-semibold">Estado</th>
                  <th className="px-3 py-3 text-center font-semibold">Marcador</th>
                  <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {visible.map((game) => {
                  const home = teamsById.get(game.homeTeamId)
                  const away = teamsById.get(game.awayTeamId)
                  const final = isFinal(game)
                  const winner = gameWinner(game)
                  return (
                    <tr key={game.id} className="group transition hover:bg-white/[0.03]">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-mist-200">{formatShortDate(game.date)}</p>
                        <p className="text-[9px] text-mist-500">{formatTime(game.date)}</p>
                      </td>
                      <td className="px-3 py-3">
                        <div className="space-y-1.5">
                          {[away, home].map((team, index) => {
                            if (!team) return null
                            const isHome = index === 1
                            const isWinner =
                              winner === (isHome ? 'home' : 'away')
                            return (
                              <div key={team.id} className="flex items-center gap-2">
                                <TeamLogo team={team} size={22} />
                                <span className={`w-9 font-display text-xs font-bold ${isWinner ? 'text-white' : 'text-mist-400'}`}>
                                  {team.abbreviation}
                                </span>
                                <span className={`hidden truncate text-[11px] sm:block ${isWinner ? 'text-mist-200' : 'text-mist-500'}`}>
                                  {team.name}
                                </span>
                                <span className="ml-1 text-[8px] uppercase tracking-wider text-mist-600">
                                  {isHome ? 'Local' : 'Visit.'}
                                </span>
                                {final ? (
                                  <span
                                    className={`ml-auto font-display text-sm font-bold ${
                                      isWinner ? 'text-white' : 'text-mist-500'
                                    }`}
                                  >
                                    {isHome ? game.homeScore : game.awayScore}
                                  </span>
                                ) : null}
                              </div>
                            )
                          })}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="flex items-center gap-1 text-[10px] text-mist-400">
                          <MapPin className="h-3 w-3 shrink-0 text-mist-600" /> {game.venue}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        {final ? (
                          <Badge tone="green">Final</Badge>
                        ) : (
                          <Badge tone="blue" dot>
                            Programado
                          </Badge>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {final ? (
                          <span className="font-display text-xl font-bold text-white">
                            {game.homeScore}–{game.awayScore}
                          </span>
                        ) : (
                          <span className="text-mist-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setResultGame(game)}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition ${
                              final
                                ? 'border-white/10 bg-white/[0.04] text-mist-300 hover:border-white/20 hover:text-white'
                                : 'border-league-red/30 bg-league-red/[0.08] text-league-redSoft hover:bg-league-red/15 hover:text-white'
                            }`}
                          >
                            {final ? <Pencil className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                            {final ? 'Editar' : 'Resultado'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingGame(game)}
                            className="rounded-lg border border-white/10 p-1.5 text-mist-500 transition hover:border-league-red/40 hover:bg-league-red/10 hover:text-league-redSoft"
                            aria-label="Eliminar partido"
                            title="Eliminar partido"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
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
            itemLabel="partidos"
          />
        </Card>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[10px] text-mist-500">
        <span className="flex items-center gap-1.5">
          <Trophy className="h-3.5 w-3.5 text-league-gold" />
          Los resultados alimentan la clasificación, las rachas y el análisis de favoritos.
        </span>
        <span>Actualizado {formatDate(db.updatedAt, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
      </div>

      <GameFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <GameResultModal open={Boolean(resultGame)} onClose={() => setResultGame(null)} game={resultGame} />
      <ConfirmDialog
        open={Boolean(deletingGame)}
        onClose={() => setDeletingGame(null)}
        onConfirm={handleDelete}
        title="Eliminar partido"
        description="¿Seguro que deseas eliminar este partido? Si tenía un resultado, la clasificación se recalculará sin él."
        confirmLabel="Eliminar partido"
        details={
          deletingGame && deleteTargetHome && deleteTargetAway ? (
            <div className="rounded-lg border border-white/10 bg-ink-900/60 px-3 py-2 text-xs">
              <p className="font-semibold text-white">
                {deleteTargetAway.city} {deleteTargetAway.name} @ {deleteTargetHome.city} {deleteTargetHome.name}
              </p>
              <p className="mt-0.5 text-mist-400">
                {formatDate(deletingGame.date, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })} ·{' '}
                {deletingGame.venue}
              </p>
              {isFinal(deletingGame) ? (
                <p className="mt-2 text-[11px] text-league-redSoft">
                  Este partido está finalizado. La tabla de posiciones y las estadísticas de ambos equipos cambiarán.
                </p>
              ) : (
                <p className="mt-2 text-[11px] text-mist-400">El partido aún no tiene resultado registrado.</p>
              )}
            </div>
          ) : null
        }
      />
    </div>
  )
}
