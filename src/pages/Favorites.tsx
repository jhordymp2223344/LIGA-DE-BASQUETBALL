import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarClock,
  Flame,
  Info,
  MapPin,
  Percent,
  Trophy,
} from 'lucide-react'
import { useLeague } from '../store/LeagueContext'
import type { MatchupAnalysis, Team, TeamRecord } from '../types'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, SectionTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button, buttonStyles } from '../components/ui/Button'
import { SearchInput } from '../components/ui/SearchInput'
import { StatTile } from '../components/ui/StatTile'
import { EmptyState } from '../components/ui/EmptyState'
import { TeamLogo } from '../components/ui/TeamLogo'
import {
  CompareStatRow,
  FormPills,
  ProbabilitySplit,
  ScoreComparison,
} from '../components/charts/Charts'
import { analyzeMatchup } from '../lib/stats'
import {
  formatDate,
  formatDateTime,
  formatDecimal,
  formatPct,
  formatSigned,
  formatShortDate,
  formatTime,
  normalizeSearch,
  teamFullName,
} from '../lib/format'

function scoringSeries(record: TeamRecord, teamId: string): number[] {
  return [...record.lastGames]
    .slice(0, 5)
    .reverse()
    .map((game) => (game.homeTeamId === teamId ? game.homeScore ?? 0 : game.awayScore ?? 0))
}

function recentAverage(scores: number[]): number {
  if (scores.length === 0) return 0
  return scores.reduce((sum, score) => sum + score, 0) / scores.length
}

function MatchupListItem({
  analysis,
  selected,
  onSelect,
}: {
  analysis: MatchupAnalysis
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`w-full border-l-2 px-4 py-3 text-left transition ${
        selected
          ? 'border-l-league-red bg-league-red/[0.07]'
          : 'border-l-transparent hover:bg-white/[0.035]'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-mist-500">
          {formatShortDate(analysis.game.date)} · {formatTime(analysis.game.date)}
        </span>
        <span className="text-[9px] font-semibold uppercase tracking-wider text-league-gold">
          {Math.round(Math.max(analysis.homeProbability, analysis.awayProbability) * 100)}% conf.
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <TeamLogo team={analysis.away} size={22} />
        <span className="w-10 font-display text-sm font-bold text-white">{analysis.away.abbreviation}</span>
        <span className="text-[10px] text-mist-600">@</span>
        <TeamLogo team={analysis.home} size={22} />
        <span className="w-10 font-display text-sm font-bold text-white">{analysis.home.abbreviation}</span>
        <span className="ml-auto truncate text-[10px] text-mist-400">
          Favorito: <span className="font-semibold text-mist-200">{analysis.favorite.abbreviation}</span>
        </span>
      </div>
    </button>
  )
}

function TeamSide({
  team,
  record,
  role,
  probability,
  odds,
  favorite,
  projected,
}: {
  team: Team
  record: TeamRecord
  role: string
  probability: number
  odds: number
  favorite: boolean
  projected: number
}) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
      <div className="flex items-center gap-3">
        <TeamLogo team={team} size={42} />
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-mist-500">{role}</p>
          <p className="truncate font-display text-lg font-bold uppercase leading-tight text-white">
            {team.abbreviation}
          </p>
          <p className="truncate text-[10px] text-mist-400">{teamFullName(team)}</p>
        </div>
        {favorite ? (
          <Badge tone="gold" dot>
            Favorito
          </Badge>
        ) : null}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-mist-500">Récord</p>
          <p className="font-display text-lg font-bold text-white">
            {record.wins}-{record.losses}
          </p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-mist-500">Modelo</p>
          <p className="font-display text-lg font-bold text-white">{Math.round(probability * 100)}%</p>
        </div>
        <div>
          <p className="text-[8px] font-bold uppercase tracking-wider text-mist-500">Cuota demo</p>
          <p className="font-display text-lg font-bold text-league-gold">{formatDecimal(odds, 2)}</p>
        </div>
      </div>
      <p className="mt-2 border-t border-white/[0.06] pt-2 text-center text-[10px] text-mist-500">
        Marcador proyectado: <span className="font-semibold text-mist-200">{projected}</span>
      </p>
    </div>
  )
}

export function Favorites() {
  const { db, activeSeason } = useLeague()
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState('')

  const upcoming = useMemo(
    () =>
      db.games
        .filter((game) => game.seasonId === activeSeason.id && game.status === 'scheduled')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [activeSeason.id, db.games],
  )

  const analyses = useMemo(
    () =>
      upcoming
        .map((game) => analyzeMatchup(game, db.teams, db.games, activeSeason.id))
        .filter((analysis): analysis is MatchupAnalysis => analysis !== null),
    [activeSeason.id, db.games, db.teams, upcoming],
  )

  const filteredAnalyses = useMemo(() => {
    const term = normalizeSearch(search.trim())
    if (!term) return analyses
    return analyses.filter((analysis) =>
      normalizeSearch(
        `${teamFullName(analysis.home)} ${analysis.home.abbreviation} ${teamFullName(analysis.away)} ${
          analysis.away.abbreviation
        } ${analysis.game.venue}`,
      ).includes(term),
    )
  }, [analyses, search])

  const selected =
    filteredAnalyses.find((analysis) => analysis.game.id === selectedId) ?? filteredAnalyses[0]

  const averageConfidence =
    analyses.length > 0
      ? analyses.reduce(
          (sum, analysis) => sum + Math.max(analysis.homeProbability, analysis.awayProbability),
          0,
        ) / analyses.length
      : 0
  const homeFavorites = analyses.filter((analysis) => analysis.favorite.id === analysis.home.id).length
  const closeMatchups = analyses.filter(
    (analysis) => Math.abs(analysis.homeProbability - analysis.awayProbability) < 0.12,
  ).length

  const homeScores = selected ? scoringSeries(selected.homeRecord, selected.home.id) : []
  const awayScores = selected ? scoringSeries(selected.awayRecord, selected.away.id) : []

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Análisis de enfrentamientos"
        title="Favoritos y cuotas"
        description={`Probabilidades y cuotas simuladas para los próximos partidos de la temporada ${activeSeason.name}. El modelo usa el rendimiento de cada equipo en los resultados registrados.`}
        actions={
          <>
            <Link to="/games" className={buttonStyles('secondary', 'md')}>
              <CalendarClock className="h-4 w-4" /> Calendario
            </Link>
            <Badge tone="gold" dot>
              Datos de demostración
            </Badge>
          </>
        }
      />

      <section className="relative mb-5 overflow-hidden rounded-2xl border border-white/[0.08] bg-hero-glow p-5 shadow-panel sm:p-6">
        <div className="court-lines absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-px w-6 bg-league-red" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-league-redSoft">
                Modelo local · sin casa de apuestas
              </span>
            </div>
            <h2 className="font-display text-3xl font-extrabold uppercase leading-none tracking-tight text-white sm:text-4xl">
              Cada partido, con contexto.
            </h2>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-mist-300">
              Selecciona un encuentro para ver la probabilidad estimada, la cuota decimal simulada, la forma reciente y
              las comparaciones estadísticas. Las cuotas incluyen un margen de demostración del 5%.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 text-[10px] text-mist-400">
            <span className="rounded-lg border border-white/10 bg-ink-950/50 px-3 py-2">
              <span className="block text-[8px] font-bold uppercase tracking-wider text-mist-500">Última actualización</span>
              <span className="mt-0.5 block font-semibold text-mist-200">{formatDateTime(db.updatedAt)}</span>
            </span>
            <span className="rounded-lg border border-white/10 bg-ink-950/50 px-3 py-2">
              <span className="block text-[8px] font-bold uppercase tracking-wider text-mist-500">Partidos analizados</span>
              <span className="mt-0.5 block font-display text-xl font-bold leading-none text-white">{analyses.length}</span>
            </span>
          </div>
        </div>
      </section>

      <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Próximos partidos"
          value={upcoming.length}
          icon={<Flame className="h-5 w-5" />}
          hint={`Temporada ${activeSeason.name}`}
          tone="red"
        />
        <StatTile
          label="Confianza media"
          value={`${Math.round(averageConfidence * 100)}%`}
          icon={<Percent className="h-5 w-5" />}
          hint="Probabilidad del favorito"
          tone="blue"
        />
        <StatTile
          label="Favoritos locales"
          value={`${homeFavorites}/${analyses.length}`}
          icon={<Trophy className="h-5 w-5" />}
          hint="Ventaja de cancha incluida"
          tone="gold"
        />
        <StatTile
          label="Encuentros cerrados"
          value={closeMatchups}
          icon={<Activity className="h-5 w-5" />}
          hint="Diferencia menor al 12%"
          tone="green"
        />
      </section>

      {analyses.length === 0 ? (
        <EmptyState
          title="No hay partidos programados"
          description="El análisis de favoritos se genera con encuentros programados de la temporada activa. Programa un partido para comenzar."
          icon={<CalendarClock className="h-5 w-5" />}
          action={
            <Link to="/games" className={buttonStyles('primary', 'sm')}>
              Ir a partidos
            </Link>
          }
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
          <Card padded={false} className="h-fit overflow-hidden">
            <div className="border-b border-white/[0.07] p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-display text-xl font-bold uppercase tracking-wide text-white">Encuentros</p>
                  <p className="mt-0.5 text-[10px] text-mist-500">
                    {filteredAnalyses.length} de {analyses.length} próximos partidos
                  </p>
                </div>
                <Flame className="h-4 w-4 text-league-redSoft" />
              </div>
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Buscar por equipo o pabellón…"
                className="mt-3"
              />
            </div>
            {filteredAnalyses.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="Sin coincidencias"
                  description="Prueba con otro equipo o limpia la búsqueda."
                  action={
                    <Button variant="secondary" size="sm" onClick={() => setSearch('')}>
                      Limpiar búsqueda
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="max-h-[680px] divide-y divide-white/[0.05] overflow-y-auto">
                {filteredAnalyses.map((analysis) => (
                  <MatchupListItem
                    key={analysis.game.id}
                    analysis={analysis}
                    selected={selected?.game.id === analysis.game.id}
                    onSelect={() => setSelectedId(analysis.game.id)}
                  />
                ))}
              </div>
            )}
          </Card>

          {selected ? (
            <div className="space-y-5">
              <Card className="relative overflow-hidden">
                <div
                  className="absolute inset-0 opacity-25"
                  style={{
                    background: `radial-gradient(circle at 10% 10%, ${selected.home.colors.primary}, transparent 42%), radial-gradient(circle at 90% 90%, ${selected.away.colors.primary}, transparent 42%)`,
                  }}
                />
                <div className="relative">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="red" dot>
                          Análisis del partido
                        </Badge>
                        <Badge tone="gold">Cuotas demo</Badge>
                      </div>
                      <h2 className="mt-2 font-display text-3xl font-extrabold uppercase leading-none tracking-tight text-white sm:text-4xl">
                        {selected.away.abbreviation} <span className="text-mist-500">@</span>{' '}
                        {selected.home.abbreviation}
                      </h2>
                      <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-mist-300">
                        <span className="flex items-center gap-1.5">
                          <CalendarClock className="h-3.5 w-3.5 text-mist-500" />
                          {formatDate(selected.game.date, {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}{' '}
                          · {formatTime(selected.game.date)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-mist-500" /> {selected.game.venue}
                        </span>
                      </p>
                    </div>
                    <div className="rounded-xl border border-league-gold/25 bg-league-gold/[0.08] px-4 py-2 text-right">
                      <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-league-gold">
                        Favorito del modelo
                      </p>
                      <p className="mt-0.5 font-display text-2xl font-bold leading-none text-white">
                        {selected.favorite.abbreviation}
                      </p>
                      <p className="mt-1 text-[10px] text-mist-400">
                        {Math.round(Math.max(selected.homeProbability, selected.awayProbability) * 100)}% de probabilidad
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <TeamSide
                      team={selected.home}
                      record={selected.homeRecord}
                      role="Local"
                      probability={selected.homeProbability}
                      odds={selected.homeOdds}
                      favorite={selected.favorite.id === selected.home.id}
                      projected={selected.projectedHomeScore}
                    />
                    <TeamSide
                      team={selected.away}
                      record={selected.awayRecord}
                      role="Visitante"
                      probability={selected.awayProbability}
                      odds={selected.awayOdds}
                      favorite={selected.favorite.id === selected.away.id}
                      projected={selected.projectedAwayScore}
                    />
                  </div>

                  <div className="mt-5">
                    <ProbabilitySplit
                      homeLabel={selected.home.abbreviation}
                      awayLabel={selected.away.abbreviation}
                      homeProbability={selected.homeProbability}
                      awayProbability={selected.awayProbability}
                      homeColor={selected.home.colors.primary}
                      awayColor={selected.away.colors.primary}
                    />
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-mist-500">
                      <span>
                        Marcador proyectado: {selected.projectedHomeScore}–{selected.projectedAwayScore}
                      </span>
                      <span>Probabilidades normalizadas al 100% · margen de cuota 5%</span>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="grid gap-5 lg:grid-cols-2">
                <Card>
                  <SectionTitle
                    title="Forma reciente"
                    subtitle="Últimos resultados y puntos anotados"
                    icon={<Activity className="h-4 w-4" />}
                  />
                  <div className="mt-4 space-y-4">
                    {[
                      {
                        team: selected.home,
                        record: selected.homeRecord,
                        scores: homeScores,
                        role: 'Local',
                      },
                      {
                        team: selected.away,
                        record: selected.awayRecord,
                        scores: awayScores,
                        role: 'Visitante',
                      },
                    ].map((side) => (
                      <div
                        key={side.team.id}
                        className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
                      >
                        <div className="flex items-center gap-2">
                          <TeamLogo team={side.team} size={24} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-xs font-semibold text-white">
                              {teamFullName(side.team)}
                            </span>
                            <span className="block text-[9px] uppercase tracking-wider text-mist-500">
                              {side.role} · {side.record.wins}-{side.record.losses} ·{' '}
                              {recentAverage(side.scores) > 0
                                ? `${formatDecimal(recentAverage(side.scores), 1)} pts/partido`
                                : 'sin resultados'}
                            </span>
                          </span>
                          <FormPills results={side.record.streak} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5">
                    <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.14em] text-mist-500">
                      Puntos en los últimos 5 partidos
                    </p>
                    <ScoreComparison
                      homeScores={homeScores}
                      awayScores={awayScores}
                      homeColor={selected.home.colors.primary}
                      awayColor={selected.away.colors.primary}
                    />
                    <p className="mt-2 text-center text-[9px] text-mist-500">
                      {selected.home.abbreviation} (local) vs {selected.away.abbreviation} (visitante) · de izquierda a
                      derecha, del más antiguo al más reciente.
                    </p>
                  </div>
                </Card>

                <Card>
                  <SectionTitle
                    title="Comparación"
                    subtitle="Temporada activa · por partido"
                    icon={<BarChart3 className="h-4 w-4" />}
                  />
                  <div className="mt-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-mist-500">
                    <span>{selected.home.abbreviation}</span>
                    <span>{selected.away.abbreviation}</span>
                  </div>
                  <div className="mt-1 divide-y divide-white/[0.05]">
                    <CompareStatRow
                      label="% victorias"
                      leftValue={selected.homeRecord.winPct}
                      rightValue={selected.awayRecord.winPct}
                      leftDisplay={formatPct(selected.homeRecord.winPct)}
                      rightDisplay={formatPct(selected.awayRecord.winPct)}
                      leftColor={selected.home.colors.primary}
                      rightColor={selected.away.colors.primary}
                      leftHighlight={selected.homeRecord.winPct >= selected.awayRecord.winPct}
                      rightHighlight={selected.awayRecord.winPct > selected.homeRecord.winPct}
                    />
                    <CompareStatRow
                      label="Puntos anotados"
                      leftValue={selected.homeRecord.ppg}
                      rightValue={selected.awayRecord.ppg}
                      leftDisplay={formatDecimal(selected.homeRecord.ppg, 1)}
                      rightDisplay={formatDecimal(selected.awayRecord.ppg, 1)}
                      leftColor={selected.home.colors.primary}
                      rightColor={selected.away.colors.primary}
                      leftHighlight={selected.homeRecord.ppg >= selected.awayRecord.ppg}
                      rightHighlight={selected.awayRecord.ppg > selected.homeRecord.ppg}
                    />
                    <CompareStatRow
                      label="Puntos recibidos"
                      leftValue={selected.homeRecord.oppg}
                      rightValue={selected.awayRecord.oppg}
                      leftDisplay={formatDecimal(selected.homeRecord.oppg, 1)}
                      rightDisplay={formatDecimal(selected.awayRecord.oppg, 1)}
                      leftColor={selected.home.colors.primary}
                      rightColor={selected.away.colors.primary}
                      leftHighlight={selected.homeRecord.oppg <= selected.awayRecord.oppg}
                      rightHighlight={selected.awayRecord.oppg < selected.homeRecord.oppg}
                    />
                    <CompareStatRow
                      label="Diferencia / partido"
                      leftValue={selected.homeRecord.ppg - selected.homeRecord.oppg}
                      rightValue={selected.awayRecord.ppg - selected.awayRecord.oppg}
                      leftDisplay={formatSigned(
                        Math.round(selected.homeRecord.ppg - selected.homeRecord.oppg),
                      )}
                      rightDisplay={formatSigned(
                        Math.round(selected.awayRecord.ppg - selected.awayRecord.oppg),
                      )}
                      leftColor={selected.home.colors.primary}
                      rightColor={selected.away.colors.primary}
                      leftHighlight={
                        selected.homeRecord.ppg - selected.homeRecord.oppg >=
                        selected.awayRecord.ppg - selected.awayRecord.oppg
                      }
                      rightHighlight={
                        selected.awayRecord.ppg - selected.awayRecord.oppg >
                        selected.homeRecord.ppg - selected.homeRecord.oppg
                      }
                    />
                    <CompareStatRow
                      label="Récord local / visitante"
                      leftValue={selected.homeRecord.homeWins}
                      rightValue={selected.awayRecord.awayWins}
                      leftDisplay={`${selected.homeRecord.homeWins}-${selected.homeRecord.homeLosses}`}
                      rightDisplay={`${selected.awayRecord.awayWins}-${selected.awayRecord.awayLosses}`}
                      leftColor={selected.home.colors.primary}
                      rightColor={selected.away.colors.primary}
                      leftHighlight={selected.homeRecord.homeWins >= selected.awayRecord.awayWins}
                      rightHighlight={selected.awayRecord.awayWins > selected.homeRecord.homeWins}
                    />
                  </div>
                </Card>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <Card>
                  <SectionTitle
                    title="Cómo se calcula"
                    subtitle="Modelo explicable, sin caja negra"
                    icon={<Info className="h-4 w-4" />}
                  />
                  <ul className="mt-4 space-y-2.5 text-[11px] leading-relaxed text-mist-400">
                    <li className="flex gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-league-redSoft" />
                      Se calcula el diferencial de puntos por partido de cada equipo con los resultados finalizados de la
                      temporada.
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-league-redSoft" />
                      Se añade una ventaja de cancha de 3,1 puntos al equipo local y se aplica una función logística para
                      obtener la probabilidad.
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-league-redSoft" />
                      Las cuotas decimales se derivan de la probabilidad con un margen de demostración del 5%. No
                      representan precios reales de mercado.
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-league-redSoft" />
                      Los marcadores proyectados combinan el ataque y la defensa de ambos equipos con el promedio de
                      anotación de la liga.
                    </li>
                  </ul>
                  <p className="mt-4 border-t border-white/[0.06] pt-3 text-[10px] text-mist-500">
                    Actualizado con los datos guardados el {formatDateTime(db.updatedAt)}. Al registrar o editar un
                    resultado, el análisis se recalcula automáticamente.
                  </p>
                </Card>

                <div className="rounded-2xl border border-league-gold/25 bg-league-gold/[0.07] p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-league-gold/30 bg-league-gold/10 text-league-gold">
                      <AlertTriangle className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-display text-xl font-bold uppercase tracking-wide text-white">
                        Datos de demostración
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-mist-300">
                        Esta sección es un ejercicio estadístico con equipos y jugadores ficticios. Las cuotas son
                        simuladas, no provienen de una casa de apuestas ni de una API deportiva, y no deben usarse para
                        apostar dinero real. Las probabilidades no garantizan ningún resultado.
                      </p>
                      <Link
                        to="/data"
                        className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-league-gold transition hover:text-white"
                      >
                        Gestionar datos y respaldos <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
