import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronRight,
  MapPin,
  Pencil,
  Plus,
  TrendingDown,
  TrendingUp,
  Trophy,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react'
import { useLeague } from '../store/LeagueContext'
import type { Player } from '../types'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, SectionTitle } from '../components/ui/Card'
import { Button, buttonStyles } from '../components/ui/Button'
import { TeamLogo, PlayerAvatar } from '../components/ui/TeamLogo'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { Select } from '../components/ui/Field'
import { FormPills, ScoreComparison } from '../components/charts/Charts'
import { TeamFormModal } from '../components/teams/TeamFormModal'
import { PlayerFormModal } from '../components/players/PlayerFormModal'
import { PlayerDeleteDialog, TeamDeleteDialog } from '../components/dialogs/DeleteDialogs'
import { buildPlayerList, buildTeamRecord, teamGameResult } from '../lib/stats'
import {
  POSITION_ORDER,
  formatDate,
  formatDecimal,
  formatNumber,
  formatPct,
  formatShortDate,
  formatSigned,
  fullName,
  teamFullName,
  streakLabel,
} from '../lib/format'

export function TeamDetail() {
  const { teamId } = useParams<{ teamId: string }>()
  const navigate = useNavigate()
  const { db, activeSeason, seasons } = useLeague()
  const [seasonId, setSeasonId] = useState(activeSeason.id)
  const [teamFormOpen, setTeamFormOpen] = useState(false)
  const [deleteTeamOpen, setDeleteTeamOpen] = useState(false)
  const [playerFormOpen, setPlayerFormOpen] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [deletingPlayer, setDeletingPlayer] = useState<Player | null>(null)

  const team = db.teams.find((item) => item.id === teamId)
  const season = seasons.find((item) => item.id === seasonId) ?? activeSeason

  const record = useMemo(
    () => (team ? buildTeamRecord(team, db.games, seasonId) : null),
    [db.games, seasonId, team],
  )

  const roster = useMemo(() => {
    if (!team) return []
    const list = buildPlayerList(db.players, db.teams, db.playerStats, seasonId).filter(
      (item) => item.player.teamId === team.id,
    )
    return list.sort(
      (a, b) =>
        POSITION_ORDER[a.player.position] - POSITION_ORDER[b.player.position] ||
        a.player.jerseyNumber - b.player.jerseyNumber,
    )
  }, [db.playerStats, db.players, db.teams, seasonId, team])

  if (!team || !record) {
    return (
      <div className="animate-fade-up">
        <PageHeader eyebrow="Equipos" title="Equipo no encontrado" />
        <EmptyState
          title="No pudimos encontrar este equipo"
          description="Puede que haya sido eliminado. Vuelve a la lista de equipos para continuar."
          action={
            <Link to="/teams" className={buttonStyles('primary', 'sm')}>
              Volver a equipos
            </Link>
          }
        />
      </div>
    )
  }

  const upcoming = record.upcoming.slice(0, 4)
  const recent = record.lastGames.slice(0, 5)
  const playerCount = db.players.filter((player) => player.teamId === team.id).length
  const forwardsCount = roster.filter((item) => ['SF', 'PF'].includes(item.player.position)).length
  const guardsCount = roster.filter((item) => ['PG', 'SG'].includes(item.player.position)).length
  const centersCount = roster.filter((item) => item.player.position === 'C').length
  const pointsForLast = [...recent].reverse().map((game) => {
    const isHome = game.homeTeamId === team.id
    return isHome ? game.homeScore ?? 0 : game.awayScore ?? 0
  })
  const pointsAgainstLast = [...recent].reverse().map((game) => {
    const isHome = game.homeTeamId === team.id
    return isHome ? game.awayScore ?? 0 : game.homeScore ?? 0
  })

  return (
    <div className="animate-fade-up">
      <Link
        to="/teams"
        className="mb-4 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-mist-400 transition hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Todos los equipos
      </Link>

      <section className="relative mb-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-850 shadow-panel">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(circle at 88% 10%, ${team.colors.primary}, transparent 45%), radial-gradient(circle at 15% 100%, ${team.colors.secondary}55, transparent 42%)`,
          }}
        />
        <div className="court-lines absolute inset-0 opacity-50" aria-hidden="true" />
        <div className="relative p-5 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-4 sm:gap-5">
              <TeamLogo team={team} size={82} glow className="mt-1" />
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge tone={team.conference === 'East' ? 'blue' : 'red'}>
                    Conferencia {team.conference === 'East' ? 'Este' : 'Oeste'}
                  </Badge>
                  <Badge tone="neutral">Fundado en {team.founded}</Badge>
                  <Badge tone="gold">{playerCount} jugadores</Badge>
                </div>
                <h1 className="font-display text-4xl font-extrabold uppercase leading-[0.9] tracking-tight text-white sm:text-6xl">
                  {team.city}
                  <span className="block text-mist-300">{team.name}</span>
                </h1>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[11px] text-mist-300">
                  <span className="flex items-center gap-1.5">
                    <UserRound className="h-3.5 w-3.5 text-mist-500" /> {team.coach}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-mist-500" /> {team.arena}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-mist-500" /> Temporada {season.name}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={seasonId}
                onChange={(event) => setSeasonId(event.target.value)}
                className="h-9 w-auto min-w-36 text-xs"
                aria-label="Temporada"
              >
                {seasons.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                    {item.isActive ? ' · Activa' : ''}
                  </option>
                ))}
              </Select>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setTeamFormOpen(true)}
                icon={<Pencil className="h-4 w-4" />}
              >
                Editar
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setDeleteTeamOpen(true)}
                icon={<Trash2 className="h-4 w-4" />}
              >
                Eliminar
              </Button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {[
              { label: 'Partidos', value: record.played, sub: `${formatDecimal(record.ppg, 1)} PPP` },
              { label: 'Victorias', value: record.wins, sub: 'temporada', tone: 'text-emerald-300' },
              { label: 'Derrotas', value: record.losses, sub: 'temporada', tone: 'text-league-redSoft' },
              { label: 'Porcentaje', value: formatPct(record.winPct), sub: 'victorias' },
              { label: 'Anotados', value: formatNumber(record.pointsFor), sub: `${formatDecimal(record.ppg, 1)} / partido` },
              { label: 'Recibidos', value: formatNumber(record.pointsAgainst), sub: `${formatDecimal(record.oppg, 1)} / partido` },
              {
                label: 'Diferencia',
                value: formatSigned(record.diff),
                sub: 'global',
                tone: record.diff >= 0 ? 'text-emerald-300' : 'text-league-redSoft',
              },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-white/[0.07] bg-black/20 p-3 backdrop-blur-sm">
                <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-mist-500">{stat.label}</p>
                <p className={`mt-1 font-display text-2xl font-bold leading-none ${stat.tone ?? 'text-white'}`}>
                  {stat.value}
                </p>
                <p className="mt-1 text-[9px] text-mist-500">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-12">
        <div className="space-y-5 xl:col-span-8">
          <Card className="overflow-hidden" padded={false}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] p-5">
              <div>
                <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-white">Plantilla</h2>
                <p className="mt-0.5 text-xs text-mist-400">
                  {roster.length} jugadores · {guardsCount} bases/escoltas · {forwardsCount} aleros/ala-pívots ·{' '}
                  {centersCount} pívots
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setEditingPlayer(null)
                  setPlayerFormOpen(true)
                }}
                icon={<Plus className="h-4 w-4" />}
              >
                Añadir jugador
              </Button>
            </div>
            {roster.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  title="Plantilla vacía"
                  description="Este equipo todavía no tiene jugadores. Añade el primero para comenzar."
                  icon={<Users className="h-5 w-5" />}
                  action={
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingPlayer(null)
                        setPlayerFormOpen(true)
                      }}
                    >
                      Añadir jugador
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-xs">
                  <thead className="border-b border-white/[0.06] bg-white/[0.02] text-[9px] uppercase tracking-[0.12em] text-mist-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Jugador</th>
                      <th className="px-3 py-3 font-semibold">Pos.</th>
                      <th className="px-3 py-3 text-center font-semibold">#</th>
                      <th className="px-3 py-3 text-center font-semibold">Edad</th>
                      <th className="px-3 py-3 text-center font-semibold">Est.</th>
                      <th className="px-3 py-3 text-center font-semibold">PJ</th>
                      <th className="px-3 py-3 text-center font-semibold">PPP</th>
                      <th className="px-3 py-3 text-center font-semibold">RPP</th>
                      <th className="px-3 py-3 text-center font-semibold">APP</th>
                      <th className="px-3 py-3 text-right font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {roster.map(({ player, averages, age, stat }) => (
                      <tr key={player.id} className="group transition hover:bg-white/[0.035]">
                        <td className="px-4 py-2.5">
                          <Link to={`/players/${player.id}`} className="flex items-center gap-2.5">
                            <PlayerAvatar
                              firstName={player.firstName}
                              lastName={player.lastName}
                              team={team}
                              size={30}
                            />
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-mist-100 group-hover:text-white">
                                {fullName(player)}
                              </p>
                              <p className="text-[9px] uppercase tracking-wider text-mist-500">{player.nationality}</p>
                            </div>
                          </Link>
                        </td>
                        <td className="px-3 py-2.5">
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
                                setPlayerFormOpen(true)
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
            )}
          </Card>

          <Card>
            <SectionTitle
              title="Resultados recientes"
              subtitle={`Últimos partidos · ${season.name}`}
              icon={<Trophy className="h-4 w-4" />}
            />
            {recent.length === 0 ? (
              <EmptyState className="mt-4" title="Sin resultados" description="Este equipo aún no ha jugado partidos finalizados." />
            ) : (
              <div className="mt-4 divide-y divide-white/[0.05]">
                {recent.map((game) => {
                  const isHome = game.homeTeamId === team.id
                  const opponent = db.teams.find(
                    (item) => item.id === (isHome ? game.awayTeamId : game.homeTeamId),
                  )
                  const result = teamGameResult(game, team.id)
                  if (!opponent) return null
                  return (
                    <Link
                      key={game.id}
                      to={`/teams/${opponent.id}`}
                      className="flex items-center gap-3 py-3 transition hover:bg-white/[0.02]"
                    >
                      <span
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-md font-display text-sm font-bold ${
                          result === 'W'
                            ? 'bg-emerald-400/10 text-emerald-300'
                            : 'bg-league-red/10 text-league-redSoft'
                        }`}
                      >
                        {result}
                      </span>
                      <TeamLogo team={opponent} size={26} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-white">
                          {isHome ? 'vs' : '@'} {teamFullName(opponent)}
                        </p>
                        <p className="text-[9px] text-mist-500">
                          {formatDate(game.date, { day: '2-digit', month: 'short' })} · {isHome ? 'Local' : 'Visitante'}
                        </p>
                      </div>
                      <span className="font-display text-lg font-bold text-white">
                        {isHome ? game.homeScore : game.awayScore} - {isHome ? game.awayScore : game.homeScore}
                      </span>
                      <ChevronRight className="h-4 w-4 text-mist-600" />
                    </Link>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-5 xl:col-span-4">
          <Card>
            <SectionTitle title="Rendimiento" subtitle="Balance y forma reciente" icon={<TrendingUp className="h-4 w-4" />} />
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
                <span className="text-[11px] text-mist-400">Racha</span>
                <div className="flex items-center gap-2">
                  <FormPills results={record.streak} />
                  <span className="font-display text-sm font-bold text-white">{streakLabel(record.streak)}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                  <p className="text-[9px] uppercase tracking-wider text-mist-500">Como local</p>
                  <p className="mt-1 font-display text-xl font-bold text-white">
                    {record.homeWins}-{record.homeLosses}
                  </p>
                </div>
                <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                  <p className="text-[9px] uppercase tracking-wider text-mist-500">Como visitante</p>
                  <p className="mt-1 font-display text-xl font-bold text-white">
                    {record.awayWins}-{record.awayLosses}
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] uppercase tracking-wider text-mist-500">Diferencia por partido</p>
                  <span
                    className={`flex items-center gap-1 font-display text-lg font-bold ${
                      record.ppg - record.oppg >= 0 ? 'text-emerald-300' : 'text-league-redSoft'
                    }`}
                  >
                    {record.ppg - record.oppg >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {formatSigned(Math.round(record.ppg - record.oppg))}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-5">
              <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.14em] text-mist-500">
                Últimos 5 · puntos a favor y en contra
              </p>
              <ScoreComparison
                homeScores={pointsForLast}
                awayScores={pointsAgainstLast}
                homeColor={team.colors.primary}
                awayColor="rgba(255,255,255,0.25)"
              />
            </div>
          </Card>

          <Card>
            <SectionTitle
              title="Próximos partidos"
              subtitle={`Calendario · ${season.name}`}
              icon={<CalendarDays className="h-4 w-4" />}
              action={
                <Link
                  to="/games"
                  className="text-[10px] font-bold uppercase tracking-wider text-league-redSoft hover:text-white"
                >
                  Ver todos
                </Link>
              }
            />
            {upcoming.length === 0 ? (
              <EmptyState className="mt-4" title="Sin partidos" description="No hay encuentros programados para este equipo." />
            ) : (
              <div className="mt-4 space-y-2">
                {upcoming.map((game) => {
                  const isHome = game.homeTeamId === team.id
                  const opponent = db.teams.find(
                    (item) => item.id === (isHome ? game.awayTeamId : game.homeTeamId),
                  )
                  if (!opponent) return null
                  return (
                    <div
                      key={game.id}
                      className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
                    >
                      <TeamLogo team={opponent} size={26} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-white">
                          {isHome ? 'vs' : '@'} {teamFullName(opponent)}
                        </p>
                        <p className="text-[9px] text-mist-500">{formatShortDate(game.date)} · {game.venue}</p>
                      </div>
                      <Badge tone="blue">Próximo</Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-[10px] leading-relaxed text-mist-500">
              Las estadísticas de {team.name} se calculan con resultados oficiales de esta base de datos local. No hay
              datos en tiempo real.
            </p>
            <Link
              to="/favorites"
              className="mt-3 flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-league-redSoft hover:text-white"
            >
              Analizar próximo rival <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <TeamFormModal open={teamFormOpen} onClose={() => setTeamFormOpen(false)} team={team} />
      <TeamDeleteDialog
        open={deleteTeamOpen}
        onClose={() => setDeleteTeamOpen(false)}
        team={team}
        onDeleted={() => navigate('/teams')}
      />
      <PlayerFormModal
        open={playerFormOpen}
        onClose={() => setPlayerFormOpen(false)}
        player={editingPlayer}
        defaultTeamId={team.id}
      />
      <PlayerDeleteDialog
        open={Boolean(deletingPlayer)}
        onClose={() => setDeletingPlayer(null)}
        player={deletingPlayer}
        onDeleted={() => setDeletingPlayer(null)}
      />
    </div>
  )
}
