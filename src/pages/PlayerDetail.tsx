import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  MapPin,
  Pencil,
  Ruler,
  Shield,
  Trash2,
  Trophy,
  UserRound,
  Weight,
} from 'lucide-react'
import { useLeague } from '../store/LeagueContext'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, SectionTitle } from '../components/ui/Card'
import { Button, buttonStyles } from '../components/ui/Button'
import { PlayerAvatar, TeamLogo } from '../components/ui/TeamLogo'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { Select } from '../components/ui/Field'
import { FormPills } from '../components/charts/Charts'
import { PlayerFormModal } from '../components/players/PlayerFormModal'
import { PlayerDeleteDialog } from '../components/dialogs/DeleteDialogs'
import {
  averagesFromStat,
  buildPlayerList,
  buildTeamRecord,
  topPlayers,
} from '../lib/stats'
import {
  POSITION_LABEL,
  ageFromBirthDate,
  formatDate,
  formatDecimal,
  formatHeight,
  formatNumber,
  formatPct,
  formatSigned,
  fullName,
  streakLabel,
  teamFullName,
} from '../lib/format'

const STAT_META = [
  { key: 'ppg', label: 'Puntos', short: 'PPP', color: '#e11d2e' },
  { key: 'rpg', label: 'Rebotes', short: 'RPP', color: '#2563eb' },
  { key: 'apg', label: 'Asistencias', short: 'APP', color: '#f5b82e' },
  { key: 'spg', label: 'Robos', short: 'ROB', color: '#10b981' },
  { key: 'bpg', label: 'Bloqueos', short: 'BLQ', color: '#8b5cf6' },
] as const

export function PlayerDetail() {
  const { playerId } = useParams<{ playerId: string }>()
  const navigate = useNavigate()
  const { db, activeSeason, seasons, playerStatsFor } = useLeague()
  const [seasonId, setSeasonId] = useState(activeSeason.id)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const player = db.players.find((item) => item.id === playerId)
  const team = player ? db.teams.find((item) => item.id === player.teamId) : undefined
  const season = seasons.find((item) => item.id === seasonId) ?? activeSeason
  const stat = player ? playerStatsFor(player.id, seasonId) : undefined
  const averages = averagesFromStat(stat)

  const leaguePlayers = useMemo(
    () => buildPlayerList(db.players, db.teams, db.playerStats, seasonId),
    [db.playerStats, db.players, db.teams, seasonId],
  )
  const peerAverages = useMemo(
    () =>
      leaguePlayers
        .filter((item) => (item.stat?.gamesPlayed ?? 0) > 0)
        .map((item) => item.averages),
    [leaguePlayers],
  )
  const leaders = topPlayers(leaguePlayers, 'ppg', 5)

  if (!player || !team) {
    return (
      <div className="animate-fade-up">
        <PageHeader eyebrow="Jugadores" title="Jugador no encontrado" />
        <EmptyState
          title="No pudimos encontrar esta ficha"
          description="El jugador pudo haber sido eliminado. Vuelve a la lista para continuar explorando la liga."
          action={
            <Link to="/players" className={buttonStyles('primary', 'sm')}>
              Volver a jugadores
            </Link>
          }
        />
      </div>
    )
  }

  const age = ageFromBirthDate(player.birthDate)
  const teamRecord = buildTeamRecord(team, db.games, seasonId)
  const history = db.playerStats
    .filter((item) => item.playerId === player.id)
    .sort((a, b) => {
      const seasonA = seasons.find((item) => item.id === a.seasonId)
      const seasonB = seasons.find((item) => item.id === b.seasonId)
      return (seasonB?.startDate ?? '').localeCompare(seasonA?.startDate ?? '')
    })
  const pointsRank =
    leaguePlayers
      .filter((item) => (item.stat?.gamesPlayed ?? 0) > 0)
      .sort((a, b) => b.averages.ppg - a.averages.ppg)
      .findIndex((item) => item.player.id === player.id) + 1

  return (
    <div className="animate-fade-up">
      <Link
        to="/players"
        className="mb-4 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-mist-400 transition hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Todos los jugadores
      </Link>

      <section className="relative mb-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-850 shadow-panel">
        <div
          className="absolute inset-0 opacity-35"
          style={{
            background: `radial-gradient(circle at 82% 5%, ${team.colors.primary}, transparent 45%), radial-gradient(circle at 20% 100%, ${team.colors.secondary}55, transparent 40%)`,
          }}
        />
        <div className="court-lines absolute inset-0 opacity-40" aria-hidden="true" />
        <div className="relative flex flex-col gap-6 p-5 sm:p-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-col items-start gap-5 sm:flex-row sm:items-center">
            <div className="relative">
              <PlayerAvatar
                firstName={player.firstName}
                lastName={player.lastName}
                team={team}
                size={108}
                jerseyNumber={player.jerseyNumber}
                className="shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)]"
              />
              <span className="absolute -left-2 -top-2 rounded-full border border-white/20 bg-ink-950/90 px-2 py-0.5 font-display text-xs font-bold tracking-wider text-white">
                #{player.jerseyNumber}
              </span>
            </div>
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge tone="red">{POSITION_LABEL[player.position]} · {player.position}</Badge>
                <Badge tone="neutral">{player.nationality}</Badge>
                <Badge tone="gold">{season.name}</Badge>
              </div>
              <h1 className="font-display text-4xl font-extrabold uppercase leading-[0.9] tracking-tight text-white sm:text-6xl">
                {player.firstName}
                <span className="block text-mist-300">{player.lastName}</span>
              </h1>
              <Link
                to={`/teams/${team.id}`}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-2.5 py-1.5 text-xs font-semibold text-mist-200 backdrop-blur-sm transition hover:border-white/25 hover:text-white"
              >
                <TeamLogo team={team} size={22} />
                {teamFullName(team)}
                <ChevronRight className="h-3.5 w-3.5 text-mist-500" />
              </Link>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setFormOpen(true)} icon={<Pencil className="h-4 w-4" />}>
              Editar jugador
            </Button>
            <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)} icon={<Trash2 className="h-4 w-4" />}>
              Eliminar
            </Button>
          </div>
        </div>

        <div className="relative grid grid-cols-2 gap-px border-t border-white/[0.07] bg-white/[0.06] sm:grid-cols-4">
          {[
            {
              icon: <Ruler className="h-3.5 w-3.5" />,
              label: 'Estatura',
              value: `${player.heightCm} cm`,
              sub: formatHeight(player.heightCm).split(' · ')[1],
            },
            { icon: <Weight className="h-3.5 w-3.5" />, label: 'Peso', value: `${player.weightKg} kg`, sub: 'peso actual' },
            { icon: <CalendarDays className="h-3.5 w-3.5" />, label: 'Edad', value: `${age} años`, sub: formatDate(player.birthDate) },
            {
              icon: <UserRound className="h-3.5 w-3.5" />,
              label: 'Dorsal / posición',
              value: `#${player.jerseyNumber}`,
              sub: POSITION_LABEL[player.position],
            },
          ].map((item) => (
            <div key={item.label} className="bg-ink-850/90 px-4 py-3">
              <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-mist-500">
                {item.icon} {item.label}
              </p>
              <p className="mt-1 font-display text-xl font-bold leading-none text-white">{item.value}</p>
              <p className="mt-0.5 text-[9px] text-mist-500">{item.sub}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-12">
        <div className="space-y-5 xl:col-span-8">
          <Card>
            <SectionTitle
              title="Rendimiento individual"
              subtitle="Promedios por partido en la temporada seleccionada"
              icon={<Trophy className="h-4 w-4" />}
              action={
                <Select
                  value={seasonId}
                  onChange={(event) => setSeasonId(event.target.value)}
                  className="h-9 w-auto min-w-32 text-xs"
                  aria-label="Temporada del jugador"
                >
                  {seasons.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                      {item.isActive ? ' · Activa' : ''}
                    </option>
                  ))}
                </Select>
              }
            />
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {STAT_META.map((metric) => (
                <div key={metric.key} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                  <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-mist-500">{metric.short}</p>
                  <p className="mt-1 font-display text-3xl font-bold leading-none text-white">
                    {formatDecimal(averages[metric.key], 1)}
                  </p>
                  <p className="mt-1 text-[9px] text-mist-500">{metric.label} / partido</p>
                </div>
              ))}
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto]">
              <div>
                <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.14em] text-mist-500">
                  Comparación con el máximo de la liga
                </p>
                <div className="space-y-2.5">
                  {STAT_META.map((metric) => {
                    const max = Math.max(...peerAverages.map((item) => item[metric.key]), 1)
                    const value = averages[metric.key]
                    return (
                      <div key={metric.key}>
                        <div className="mb-1 flex items-center justify-between text-[10px]">
                          <span className="text-mist-400">{metric.label}</span>
                          <span className="text-mist-500">
                            {formatDecimal(value, 1)} / {formatDecimal(max, 1)} máx.
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${Math.max(2, (value / max) * 100)}%`, backgroundColor: metric.color }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="flex flex-col items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.02] px-5 py-4 text-center sm:w-40">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-mist-500">Partidos</p>
                <p className="font-display text-4xl font-bold text-white">{stat?.gamesPlayed ?? 0}</p>
                <p className="mt-1 text-[10px] leading-relaxed text-mist-400">
                  {stat ? `${formatNumber(stat.points)} puntos totales` : 'Sin estadísticas registradas'}
                </p>
                {pointsRank > 0 ? (
                  <Badge tone="gold" className="mt-2">
                    #{pointsRank} en anotación
                  </Badge>
                ) : null}
              </div>
            </div>
            {!stat || stat.gamesPlayed === 0 ? (
              <div className="mt-4 rounded-lg border border-league-gold/20 bg-league-gold/[0.06] px-3 py-2 text-[11px] leading-relaxed text-mist-300">
                Este jugador aún no tiene estadísticas en {season.name}. Usa <strong>Editar jugador</strong> para
                registrar sus totales.
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-5 gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                {[
                  ['PTS', stat.points],
                  ['REB', stat.rebounds],
                  ['AST', stat.assists],
                  ['ROB', stat.steals],
                  ['BLQ', stat.blocks],
                ].map(([label, value]) => (
                  <div key={label} className="text-center">
                    <p className="text-[8px] font-bold uppercase tracking-widest text-mist-500">{label}</p>
                    <p className="font-display text-lg font-bold text-white">{formatNumber(value as number)}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="overflow-hidden" padded={false}>
            <div className="border-b border-white/[0.06] p-5">
              <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-white">Historial por temporada</h2>
              <p className="mt-0.5 text-xs text-mist-400">Totales y promedios registrados en la base de datos.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-xs">
                <thead className="border-b border-white/[0.06] bg-white/[0.02] text-[9px] uppercase tracking-[0.12em] text-mist-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Temporada</th>
                    <th className="px-3 py-3 text-center font-semibold">PJ</th>
                    <th className="px-3 py-3 text-center font-semibold">PTS</th>
                    <th className="px-3 py-3 text-center font-semibold">REB</th>
                    <th className="px-3 py-3 text-center font-semibold">AST</th>
                    <th className="px-3 py-3 text-center font-semibold">ROB</th>
                    <th className="px-3 py-3 text-center font-semibold">BLQ</th>
                    <th className="px-4 py-3 text-right font-semibold">PPP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-mist-500">
                        Sin historial de estadísticas.
                      </td>
                    </tr>
                  ) : (
                    history.map((item) => {
                      const seasonItem = db.seasons.find((seasonData) => seasonData.id === item.seasonId)
                      const itemAverages = averagesFromStat(item)
                      return (
                        <tr key={item.id} className="transition hover:bg-white/[0.02]">
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => setSeasonId(item.seasonId)}
                              className={`font-semibold transition hover:text-white ${
                                item.seasonId === seasonId ? 'text-league-redSoft' : 'text-mist-200'
                              }`}
                            >
                              {seasonItem?.name ?? 'Temporada'}
                              {seasonItem?.isActive ? (
                                <span className="ml-1.5 text-[9px] uppercase tracking-wider text-emerald-300">Activa</span>
                              ) : null}
                            </button>
                          </td>
                          <td className="px-3 py-3 text-center text-mist-400">{item.gamesPlayed}</td>
                          <td className="px-3 py-3 text-center text-mist-200">{formatNumber(item.points)}</td>
                          <td className="px-3 py-3 text-center text-mist-400">{formatNumber(item.rebounds)}</td>
                          <td className="px-3 py-3 text-center text-mist-400">{formatNumber(item.assists)}</td>
                          <td className="px-3 py-3 text-center text-mist-400">{formatNumber(item.steals)}</td>
                          <td className="px-3 py-3 text-center text-mist-400">{formatNumber(item.blocks)}</td>
                          <td className="px-4 py-3 text-right font-display text-base font-bold text-white">
                            {formatDecimal(itemAverages.ppg, 1)}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-5 xl:col-span-4">
          <Card>
            <SectionTitle title="Ficha" subtitle="Datos personales y contractuales" icon={<UserRound className="h-4 w-4" />} />
            <dl className="mt-4 space-y-2.5 text-xs">
              {[
                ['Nombre completo', fullName(player)],
                ['Nacionalidad', player.nationality],
                ['Fecha de nacimiento', formatDate(player.birthDate)],
                ['Edad', `${age} años`],
                ['Estatura', formatHeight(player.heightCm)],
                ['Peso', `${player.weightKg} kg`],
                ['Posición', `${POSITION_LABEL[player.position]} (${player.position})`],
                ['Dorsal', `#${player.jerseyNumber}`],
                ['Equipo', teamFullName(team)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-3 border-b border-white/[0.05] pb-2 last:border-0 last:pb-0">
                  <dt className="text-mist-500">{label}</dt>
                  <dd className="text-right font-medium text-mist-200">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card>
            <SectionTitle title="Equipo actual" subtitle={`Temporada ${season.name}`} icon={<Shield className="h-4 w-4" />} />
            <Link
              to={`/teams/${team.id}`}
              className="mt-4 flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 transition hover:border-white/15 hover:bg-white/[0.04]"
            >
              <TeamLogo team={team} size={42} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{teamFullName(team)}</p>
                <p className="mt-0.5 text-[10px] text-mist-500">
                  {team.conference === 'East' ? 'Este' : 'Oeste'} · {formatPct(teamRecord.winPct)} victorias
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-mist-500" />
            </Link>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] py-2">
                <p className="text-[8px] uppercase tracking-wider text-mist-500">Récord</p>
                <p className="font-display text-lg font-bold text-white">{teamRecord.wins}-{teamRecord.losses}</p>
              </div>
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] py-2">
                <p className="text-[8px] uppercase tracking-wider text-mist-500">Diferencia</p>
                <p className={`font-display text-lg font-bold ${teamRecord.diff >= 0 ? 'text-emerald-300' : 'text-league-redSoft'}`}>
                  {formatSigned(teamRecord.diff)}
                </p>
              </div>
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] py-2">
                <p className="text-[8px] uppercase tracking-wider text-mist-500">Racha</p>
                <p className="font-display text-lg font-bold text-white">{streakLabel(teamRecord.streak)}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-wider text-mist-500">Últimos 5</span>
              <FormPills results={teamRecord.streak} />
            </div>
          </Card>

          <Card>
            <SectionTitle title="Líderes de anotación" subtitle={season.name} icon={<Trophy className="h-4 w-4" />} />
            <div className="mt-4 space-y-2">
              {leaders.map((item, index) => (
                <Link
                  key={item.player.id}
                  to={`/players/${item.player.id}`}
                  className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition hover:bg-white/[0.04] ${
                    item.player.id === player.id ? 'bg-league-red/[0.08]' : ''
                  }`}
                >
                  <span className="w-4 font-display text-sm font-bold text-mist-600">{index + 1}</span>
                  <PlayerAvatar
                    firstName={item.player.firstName}
                    lastName={item.player.lastName}
                    team={item.team}
                    size={26}
                  />
                  <span className="min-w-0 flex-1 truncate text-xs text-mist-200">{fullName(item.player)}</span>
                  <span className="font-display text-base font-bold text-white">{formatDecimal(item.averages.ppg, 1)}</span>
                </Link>
              ))}
            </div>
          </Card>

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-mist-500">
              <MapPin className="h-3.5 w-3.5" /> {team.arena}
            </p>
            <p className="mt-2 text-[10px] leading-relaxed text-mist-500">
              Los datos de esta ficha son ficticios y se almacenan en el navegador. Los promedios se calculan desde los
              totales de temporada registrados.
            </p>
          </div>
        </div>
      </div>

      <PlayerFormModal open={formOpen} onClose={() => setFormOpen(false)} player={player} />
      <PlayerDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        player={player}
        onDeleted={() => navigate('/players')}
      />
    </div>
  )
}
