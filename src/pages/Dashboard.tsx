import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  CalendarClock,
  ChevronRight,
  Flame,
  Shield,
  Trophy,
  Users,
} from 'lucide-react'
import { useLeague } from '../store/LeagueContext'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, SectionTitle } from '../components/ui/Card'
import { StatTile } from '../components/ui/StatTile'
import { TeamLogo } from '../components/ui/TeamLogo'
import { Badge } from '../components/ui/Badge'
import { Tabs } from '../components/ui/SearchInput'
import { EmptyState } from '../components/ui/EmptyState'
import { buttonStyles } from '../components/ui/Button'
import { BarList, FormPills } from '../components/charts/Charts'
import { GameScoreCard, NextGameBanner, UpcomingGameCard } from '../components/games/GameCards'
import {
  analyzeMatchup,
  buildPlayerList,
  buildStandings,
  isFinal,
  topPlayers,
  type LeaderMetric,
} from '../lib/stats'
import {
  formatDate,
  formatDecimal,
  formatPct,
  formatShortDate,
  formatSigned,
  fullName,
} from '../lib/format'
import type { Conference, Team } from '../types'

const METRICS: Array<{ value: LeaderMetric; label: string }> = [
  { value: 'ppg', label: 'Puntos' },
  { value: 'rpg', label: 'Rebotes' },
  { value: 'apg', label: 'Asistencias' },
]

function MiniStandings({ conference, teams }: { conference: Conference; teams: Team[] }) {
  const { db, activeSeason } = useLeague()
  const standings = buildStandings(teams, db.games, activeSeason.id, conference)
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-mist-400">
          Conferencia {conference === 'East' ? 'Este' : 'Oeste'}
        </p>
        <span className="text-[10px] text-mist-500">{formatPct(standings[0]?.winPct ?? 0)} líder</span>
      </div>
      <div className="overflow-hidden rounded-lg border border-white/[0.06]">
        <table className="w-full text-left text-xs">
          <thead className="bg-white/[0.03] text-[9px] uppercase tracking-wider text-mist-500">
            <tr>
              <th className="px-2 py-2 font-semibold">#</th>
              <th className="px-2 py-2 font-semibold">Equipo</th>
              <th className="px-2 py-2 text-center font-semibold">G</th>
              <th className="px-2 py-2 text-center font-semibold">P</th>
              <th className="px-2 py-2 text-right font-semibold">%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {standings.map((record, index) => (
              <tr key={record.team.id} className="group transition hover:bg-white/[0.035]">
                <td className="px-2 py-2 font-display text-sm font-bold text-mist-500">{index + 1}</td>
                <td className="px-2 py-2">
                  <Link to={`/teams/${record.team.id}`} className="flex items-center gap-2">
                    <TeamLogo team={record.team} size={20} />
                    <span className="font-semibold text-mist-200 group-hover:text-white">{record.team.abbreviation}</span>
                    <span className="hidden truncate text-[10px] text-mist-500 sm:inline">{record.team.name}</span>
                  </Link>
                </td>
                <td className="px-2 py-2 text-center font-semibold text-emerald-300">{record.wins}</td>
                <td className="px-2 py-2 text-center text-mist-400">{record.losses}</td>
                <td className="px-2 py-2 text-right font-display text-sm font-bold text-white">
                  {formatPct(record.winPct).replace('%', '')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function Dashboard() {
  const { db, activeSeason } = useLeague()
  const [metric, setMetric] = useState<LeaderMetric>('ppg')
  const [conference, setConference] = useState<Conference | 'all'>('all')

  const standings = buildStandings(db.teams, db.games, activeSeason.id)
  const finals = db.games
    .filter((game) => game.seasonId === activeSeason.id && isFinal(game))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const upcoming = db.games
    .filter((game) => game.seasonId === activeSeason.id && game.status === 'scheduled')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const leaderPlayers = buildPlayerList(db.players, db.teams, db.playerStats, activeSeason.id)
  const leaders = topPlayers(leaderPlayers, metric, 5)
  const nextGame = upcoming[0]
  const nextHome = nextGame ? db.teams.find((team) => team.id === nextGame.homeTeamId) : undefined
  const nextAway = nextGame ? db.teams.find((team) => team.id === nextGame.awayTeamId) : undefined
  const nextAnalysis =
    nextGame && nextHome && nextAway
      ? analyzeMatchup(nextGame, db.teams, db.games, activeSeason.id) ?? undefined
      : undefined

  const bestTeams = [...standings]
    .filter((record) => record.played > 0)
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 4)

  const scheduledSeason = db.games.filter((game) => game.seasonId === activeSeason.id)
  const activeTeams = db.teams
  const eastCount = activeTeams.filter((team) => team.conference === 'East').length
  const westCount = activeTeams.filter((team) => team.conference === 'West').length
  const filteredTeams = conference === 'all' ? activeTeams : activeTeams.filter((team) => team.conference === conference)
  const scoringTop = [...standings]
    .filter((record) => record.played > 0)
    .sort((a, b) => b.ppg - a.ppg)
    .slice(0, 6)
  const maxScoring = Math.max(...scoringTop.map((record) => Math.max(record.ppg, record.oppg)), 1)

  const avgPoints =
    finals.length > 0
      ? finals.reduce((sum, game) => sum + (game.homeScore ?? 0) + (game.awayScore ?? 0), 0) /
        (finals.length * 2)
      : 0

  const metricMeta: Record<LeaderMetric, string> = {
    ppg: 'PPP',
    rpg: 'RPP',
    apg: 'APP',
    spg: 'ROB',
    bpg: 'BLQ',
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Temporada activa"
        title="Panel principal"
        description={`Resumen general de la liga, resultados, clasificación y líderes de la temporada ${activeSeason.name}.`}
        actions={
          <>
            <Link to="/standings" className={buttonStyles('secondary', 'md')}>
              Ver clasificación
            </Link>
            <Link to="/favorites" className={buttonStyles('primary', 'md')}>
              <Flame className="h-4 w-4" /> Analizar favoritos
            </Link>
          </>
        }
      />

      <section className="relative mb-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-hero-glow shadow-panel">
        <div className="court-lines absolute inset-0 opacity-70" aria-hidden="true" />
        <div className="court-arc absolute inset-0" aria-hidden="true" />
        <div className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.45fr_1fr] lg:items-center">
          <div className="max-w-2xl">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge tone="red" dot>
                {activeSeason.name}
              </Badge>
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-mist-400">
                Baloncesto profesional · Datos ficticios
              </span>
            </div>
            <h2 className="font-display text-4xl font-extrabold uppercase leading-[0.92] tracking-tight text-white sm:text-6xl">
              La liga vive <span className="text-league-redSoft">aquí</span>.
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-mist-300">
              Administra {db.teams.length} franquicias, sigue a {db.players.length} jugadores y analiza cada enfrentamiento
              con estadísticas calculadas a partir de los resultados.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-mist-400">
              <span className="flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-league-redSoft" /> {formatDecimal(avgPoints, 1)} pts por equipo
              </span>
              <span className="flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5 text-league-gold" /> {activeSeason.name}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Datos actualizados
              </span>
            </div>
          </div>
          <div>
            {nextGame && nextHome && nextAway ? (
              <NextGameBanner game={nextGame} home={nextHome} away={nextAway} analysis={nextAnalysis} />
            ) : (
              <div className="rounded-2xl border border-white/10 bg-ink-950/55 p-5 text-center">
                <CalendarClock className="mx-auto h-6 w-6 text-mist-500" />
                <p className="mt-2 text-xs text-mist-400">No hay próximos encuentros programados.</p>
                <Link to="/games" className="mt-2 inline-flex text-[10px] font-bold uppercase tracking-wider text-league-redSoft">
                  Programar partido
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Equipos"
          value={db.teams.length}
          icon={<Shield className="h-5 w-5" />}
          hint={`${eastCount} Este · ${westCount} Oeste`}
          tone="blue"
        />
        <StatTile
          label="Jugadores"
          value={db.players.length}
          icon={<Users className="h-5 w-5" />}
          hint={`${new Set(leaguePlayersNationalities(db.players)).size} nacionalidades`}
          tone="red"
        />
        <StatTile
          label="Partidos finalizados"
          value={finals.length}
          icon={<Trophy className="h-5 w-5" />}
          hint={`${scheduledSeason.length} programados en la temporada`}
          tone="gold"
        />
        <StatTile
          label="Próximos encuentros"
          value={upcoming.length}
          icon={<CalendarClock className="h-5 w-5" />}
          hint={nextGame ? `Siguiente: ${formatShortDate(nextGame.date)} · ${nextGame.venue}` : 'Sin partidos programados'}
          tone="green"
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-12">
        <Card className="xl:col-span-7">
          <SectionTitle
            title="Últimos resultados"
            subtitle="Resultados finalizados de la temporada activa"
            icon={<Activity className="h-4 w-4" />}
            action={
              <Link
                to="/games"
                className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-league-redSoft transition hover:text-white"
              >
                Ver todos <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          {finals.length === 0 ? (
            <EmptyState
              className="mt-4"
              title="Sin resultados"
              description="Registra el marcador de un partido para ver los resultados aquí."
            />
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {finals.slice(0, 4).map((game) => (
                <GameScoreCard
                  key={game.id}
                  game={game}
                  home={db.teams.find((team) => team.id === game.homeTeamId)}
                  away={db.teams.find((team) => team.id === game.awayTeamId)}
                />
              ))}
            </div>
          )}
        </Card>

        <Card className="xl:col-span-5">
          <SectionTitle
            title="Líderes de la liga"
            subtitle={`Mejores promedios · ${activeSeason.name}`}
            icon={<Flame className="h-4 w-4" />}
          />
          <Tabs options={METRICS} value={metric} onChange={setMetric} size="sm" className="mt-4" />
          {leaders.length === 0 ? (
            <EmptyState className="mt-4" title="Sin estadísticas" description="Añade estadísticas a los jugadores." />
          ) : (
            <BarList
              className="mt-5"
              max={leaders[0]?.averages[metric] ?? 1}
              items={leaders.map((item, index) => ({
                id: item.player.id,
                value: item.averages[metric],
                display: formatDecimal(item.averages[metric], 1),
                color: item.team
                  ? `linear-gradient(90deg, ${item.team.colors.primary}, ${item.team.colors.secondary})`
                  : undefined,
                meta: <span className="text-[9px] font-bold uppercase tracking-wider text-mist-500">{metricMeta[metric]}</span>,
                label: (
                  <Link to={`/players/${item.player.id}`} className="group flex items-center gap-2.5">
                    <span className="w-4 shrink-0 font-display text-sm font-bold text-mist-600">0{index + 1}</span>
                    <span
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/20 font-display text-[11px] font-bold text-white"
                      style={{
                        background: `linear-gradient(140deg, ${item.team?.colors.primary ?? '#1e304d'}, ${item.team?.colors.secondary ?? '#2a3f61'})`,
                      }}
                    >
                      {item.player.firstName.charAt(0)}
                      {item.player.lastName.charAt(0)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold text-mist-100 group-hover:text-white">
                        {fullName(item.player)}
                      </span>
                      <span className="block text-[9px] uppercase tracking-wider text-mist-500">
                        {item.team?.abbreviation} · {item.player.position}
                      </span>
                    </span>
                  </Link>
                ),
              }))}
            />
          )}
          <Link
            to="/players"
            className="mt-4 flex items-center justify-center gap-1.5 border-t border-white/[0.06] pt-3 text-[10px] font-bold uppercase tracking-[0.12em] text-mist-400 transition hover:text-white"
          >
            Explorar todos los jugadores <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-12">
        <Card className="xl:col-span-7">
          <SectionTitle
            title="Clasificación express"
            subtitle="Posiciones por conferencia"
            icon={<Trophy className="h-4 w-4" />}
            action={
              <Tabs
                options={[
                  { value: 'all', label: 'Ambas' },
                  { value: 'East', label: 'Este' },
                  { value: 'West', label: 'Oeste' },
                ]}
                value={conference}
                onChange={(value) => setConference(value as Conference | 'all')}
                size="sm"
              />
            }
          />
          {filteredTeams.length === 0 ? (
            <EmptyState className="mt-4" title="Sin equipos" description="Registra equipos para generar la clasificación." />
          ) : (
            <div className={`mt-4 grid gap-4 ${conference === 'all' ? 'md:grid-cols-2' : ''}`}>
              {conference !== 'West' ? <MiniStandings conference="East" teams={activeTeams} /> : null}
              {conference !== 'East' ? <MiniStandings conference="West" teams={activeTeams} /> : null}
            </div>
          )}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-3">
            <p className="text-[10px] text-mist-500">Ordenado automáticamente por porcentaje de victorias.</p>
            <Link to="/standings" className="text-[10px] font-bold uppercase tracking-[0.12em] text-league-redSoft hover:text-white">
              Clasificación completa →
            </Link>
          </div>
        </Card>

        <Card className="xl:col-span-5">
          <SectionTitle
            title="Mejor rendimiento"
            subtitle="Diferencia de puntos por partido"
            icon={<Activity className="h-4 w-4" />}
          />
          {bestTeams.length === 0 ? (
            <EmptyState className="mt-4" title="Sin datos" description="Aún no se han jugado partidos." />
          ) : (
            <div className="mt-4 space-y-2">
              {bestTeams.map((record, index) => (
                <Link
                  key={record.team.id}
                  to={`/teams/${record.team.id}`}
                  className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 transition hover:border-white/15 hover:bg-white/[0.04]"
                >
                  <span className="w-4 font-display text-sm font-bold text-mist-600">0{index + 1}</span>
                  <TeamLogo team={record.team} size={28} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-white">{record.team.city} {record.team.name}</p>
                    <p className="text-[9px] uppercase tracking-wider text-mist-500">
                      {record.wins}V-{record.losses}D · {formatDecimal(record.ppg, 1)} PPP
                    </p>
                  </div>
                  <FormPills results={record.streak.slice(0, 3)} />
                  <span
                    className={`w-11 text-right font-display text-lg font-bold ${
                      record.diff >= 0 ? 'text-emerald-300' : 'text-league-redSoft'
                    }`}
                  >
                    {formatSigned(Math.round(record.diff / Math.max(record.played, 1)))}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-12">
        <Card className="xl:col-span-7">
          <SectionTitle
            title="Próximos encuentros"
            subtitle="Calendario de la temporada activa"
            icon={<CalendarClock className="h-4 w-4" />}
            action={
              <Link to="/favorites" className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-league-redSoft hover:text-white">
                Analizar <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          {upcoming.length === 0 ? (
            <EmptyState
              className="mt-4"
              title="Sin próximos partidos"
              description="Programa un nuevo encuentro desde el módulo de partidos."
              action={
                <Link to="/games" className={buttonStyles('secondary', 'sm')}>
                  Ir a partidos
                </Link>
              }
            />
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {upcoming.slice(0, 4).map((game) => {
                const home = db.teams.find((team) => team.id === game.homeTeamId)
                const away = db.teams.find((team) => team.id === game.awayTeamId)
                const analysis = analyzeMatchup(game, db.teams, db.games, activeSeason.id) ?? undefined
                return <UpcomingGameCard key={game.id} game={game} home={home} away={away} analysis={analysis} />
              })}
            </div>
          )}
        </Card>

        <Card className="xl:col-span-5">
          <SectionTitle
            title="Puntos por partido"
            subtitle="Equipos con mayor anotación · anotados vs recibidos"
            icon={<Activity className="h-4 w-4" />}
          />
          {scoringTop.length === 0 ? (
            <EmptyState className="mt-4" title="Sin partidos" description="La gráfica se genera con resultados finales." />
          ) : (
            <div className="mt-4">
              <div className="mb-3 flex items-center gap-4 text-[9px] uppercase tracking-wider text-mist-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-league-red" /> Anotados
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-white/25" /> Recibidos
                </span>
              </div>
              <div className="space-y-3">
                {scoringTop.map((record) => (
                  <div key={record.team.id}>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <Link to={`/teams/${record.team.id}`} className="flex items-center gap-1.5 text-[11px] font-semibold text-mist-200 hover:text-white">
                        <TeamLogo team={record.team} size={16} />
                        {record.team.abbreviation}
                      </Link>
                      <span className="text-[10px] font-medium text-mist-400">
                        {formatDecimal(record.ppg, 1)} / {formatDecimal(record.oppg, 1)}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${(record.ppg / maxScoring) * 100}%`, backgroundColor: record.team.colors.primary }}
                        />
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-white/[0.05]">
                        <div
                          className="h-full rounded-full bg-white/20"
                          style={{ width: `${(record.oppg / maxScoring) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <p className="mt-4 border-t border-white/[0.06] pt-3 text-[10px] leading-relaxed text-mist-500">
            Promedios calculados a partir de los {finals.length} partidos finalizados. Actualizado:{' '}
            {formatDate(db.updatedAt, { day: '2-digit', month: 'short' })}.
          </p>
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <p className="text-[10px] leading-relaxed text-mist-500">
          Estadísticas derivadas de los resultados registrados · Sin conexión a una API deportiva · Datos de demostración.
        </p>
        <div className="flex items-center gap-2 text-[10px] text-mist-500">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Persistencia local activa
        </div>
      </div>
    </div>
  )
}

function leaguePlayersNationalities(players: { nationality: string }[]): string[] {
  return players.map((player) => player.nationality)
}
