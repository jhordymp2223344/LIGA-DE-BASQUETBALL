import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarClock, Info, ListOrdered, Trophy } from 'lucide-react'
import { useLeague } from '../store/LeagueContext'
import type { Conference } from '../types'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, SectionTitle } from '../components/ui/Card'
import { TeamLogo } from '../components/ui/TeamLogo'
import { Badge } from '../components/ui/Badge'
import { Tabs } from '../components/ui/SearchInput'
import { Select } from '../components/ui/Field'
import { EmptyState } from '../components/ui/EmptyState'
import { GameScoreCard, UpcomingGameCard } from '../components/games/GameCards'
import { FormPills } from '../components/charts/Charts'
import { analyzeMatchup, buildStandings, gamesBehind, isFinal } from '../lib/stats'
import {
  formatDate,
  formatDecimal,
  formatNumber,
  formatPct,
  formatSigned,
  streakLabel,
} from '../lib/format'

export function Standings() {
  const { db, activeSeason, seasons } = useLeague()
  const [seasonId, setSeasonId] = useState(activeSeason.id)
  const [conference, setConference] = useState<Conference>('East')

  const season = seasons.find((item) => item.id === seasonId) ?? activeSeason
  const standings = useMemo(
    () => buildStandings(db.teams, db.games, seasonId, conference),
    [conference, db.games, db.teams, seasonId],
  )
  const general = useMemo(
    () => buildStandings(db.teams, db.games, seasonId),
    [db.games, db.teams, seasonId],
  )
  const leader = standings[0]
  const bestOffense = [...standings].filter((record) => record.played > 0).sort((a, b) => b.ppg - a.ppg)[0]
  const bestDefense = [...standings].filter((record) => record.played > 0).sort((a, b) => a.oppg - b.oppg)[0]

  const conferenceTeamIds = new Set(
    db.teams.filter((team) => team.conference === conference).map((team) => team.id),
  )
  const seasonGames = db.games.filter((game) => game.seasonId === seasonId)
  const finals = seasonGames
    .filter((game) => isFinal(game) && conferenceTeamIds.has(game.homeTeamId) && conferenceTeamIds.has(game.awayTeamId))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4)
  const upcoming = seasonGames
    .filter(
      (game) =>
        game.status === 'scheduled' &&
        conferenceTeamIds.has(game.homeTeamId) &&
        conferenceTeamIds.has(game.awayTeamId),
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4)

  const totalGamesPlayed = seasonGames.filter(isFinal).length
  const playedInConference = standings.reduce((sum, record) => sum + record.played, 0) / 2

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Competición"
        title="Clasificación"
        description="Posiciones calculadas automáticamente a partir de los resultados finalizados. Los empates se resuelven por diferencia de puntos y puntos anotados."
        actions={
          <Select
            value={seasonId}
            onChange={(event) => setSeasonId(event.target.value)}
            className="h-10 w-auto min-w-40 text-xs"
            aria-label="Filtrar por temporada"
          >
            {seasons.map((item) => (
              <option key={item.id} value={item.id}>
                Temporada {item.name}
                {item.isActive ? ' · Activa' : ''}
              </option>
            ))}
          </Select>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/[0.07] bg-ink-850/80 p-4">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-mist-500">Líder de conferencia</p>
            <Trophy className="h-4 w-4 text-league-gold" />
          </div>
          {leader ? (
            <Link to={`/teams/${leader.team.id}`} className="mt-2.5 flex items-center gap-3">
              <TeamLogo team={leader.team} size={38} />
              <div className="min-w-0">
                <p className="truncate font-display text-xl font-bold uppercase leading-tight text-white">
                  {leader.team.city} {leader.team.name}
                </p>
                <p className="text-[10px] text-mist-400">
                  {leader.wins}-{leader.losses} · {formatPct(leader.winPct)} victorias
                </p>
              </div>
            </Link>
          ) : (
            <p className="mt-3 text-xs text-mist-500">Sin equipos.</p>
          )}
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-ink-850/80 p-4">
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-mist-500">Mejor ataque (PPP)</p>
          {bestOffense ? (
            <div className="mt-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TeamLogo team={bestOffense.team} size={28} />
                <span className="text-sm font-semibold text-white">{bestOffense.team.abbreviation}</span>
              </div>
              <span className="font-display text-3xl font-bold text-white">{formatDecimal(bestOffense.ppg, 1)}</span>
            </div>
          ) : (
            <p className="mt-3 text-xs text-mist-500">Aún no hay partidos.</p>
          )}
          <p className="mt-1 text-[10px] text-mist-500">
            {bestOffense ? `${formatNumber(bestOffense.pointsFor)} puntos anotados` : '—'}
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-ink-850/80 p-4">
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-mist-500">Mejor defensa (PCC)</p>
          {bestDefense ? (
            <div className="mt-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TeamLogo team={bestDefense.team} size={28} />
                <span className="text-sm font-semibold text-white">{bestDefense.team.abbreviation}</span>
              </div>
              <span className="font-display text-3xl font-bold text-white">{formatDecimal(bestDefense.oppg, 1)}</span>
            </div>
          ) : (
            <p className="mt-3 text-xs text-mist-500">Aún no hay partidos.</p>
          )}
          <p className="mt-1 text-[10px] text-mist-500">
            {bestDefense ? `${formatNumber(bestDefense.pointsAgainst)} puntos recibidos` : '—'}
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          options={[
            {
              value: 'East',
              label: 'Conferencia Este',
              count: db.teams.filter((team) => team.conference === 'East').length,
            },
            {
              value: 'West',
              label: 'Conferencia Oeste',
              count: db.teams.filter((team) => team.conference === 'West').length,
            },
          ]}
          value={conference}
          onChange={setConference}
        />
        <p className="flex items-center gap-1.5 text-[10px] text-mist-500">
          <Info className="h-3.5 w-3.5" />
          {playedInConference} partidos finalizados en esta conferencia · Actualizado{' '}
          {formatDate(db.updatedAt, { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
      </div>

      {standings.length === 0 ? (
        <EmptyState
          title="No hay equipos en esta conferencia"
          description="Registra equipos y asígnalos a la conferencia para generar la clasificación."
          icon={<ListOrdered className="h-5 w-5" />}
          action={
            <Link to="/teams" className="text-xs font-semibold text-league-redSoft hover:text-white">
              Ir a equipos →
            </Link>
          }
        />
      ) : (
        <Card padded={false} className="mb-5 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] px-4 py-3">
            <div>
              <p className="font-display text-xl font-bold uppercase tracking-wide text-white">
                Tabla de posiciones · {conference === 'East' ? 'Este' : 'Oeste'}
              </p>
              <p className="mt-0.5 text-[10px] text-mist-500">
                Orden automático por porcentaje de victorias · {totalGamesPlayed} partidos en la temporada
              </p>
            </div>
            <Badge tone="green" dot>
              Calculada en vivo
            </Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-xs">
              <thead className="border-b border-white/[0.06] bg-white/[0.02] text-[9px] uppercase tracking-[0.12em] text-mist-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Pos.</th>
                  <th className="px-3 py-3 font-semibold">Equipo</th>
                  <th className="px-3 py-3 text-center font-semibold">PJ</th>
                  <th className="px-3 py-3 text-center font-semibold">G</th>
                  <th className="px-3 py-3 text-center font-semibold">P</th>
                  <th className="px-3 py-3 text-center font-semibold">PCT</th>
                  <th className="px-3 py-3 text-right font-semibold">PF</th>
                  <th className="px-3 py-3 text-right font-semibold">PC</th>
                  <th className="px-3 py-3 text-right font-semibold">DIF</th>
                  <th className="px-3 py-3 text-center font-semibold">Racha</th>
                  <th className="px-4 py-3 text-right font-semibold">Últimos 5</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {standings.map((record, index) => {
                  const playoff = index < 4
                  const gb = leader ? gamesBehind(record, leader) : 0
                  return (
                    <tr
                      key={record.team.id}
                      className={`group transition hover:bg-white/[0.035] ${
                        index === 3 ? 'border-b border-white/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`grid h-6 w-6 place-items-center rounded-md font-display text-sm font-bold ${
                              playoff ? 'bg-league-red/15 text-league-redSoft' : 'bg-white/[0.04] text-mist-400'
                            }`}
                          >
                            {index + 1}
                          </span>
                          {index === 3 ? (
                            <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-mist-500">
                              Corte
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <Link to={`/teams/${record.team.id}`} className="flex items-center gap-3">
                          <TeamLogo team={record.team} size={30} />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-white group-hover:text-league-redSoft">
                              {record.team.city} {record.team.name}
                            </p>
                            <p className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-mist-500">
                              {record.team.abbreviation}
                              {playoff ? <span className="text-emerald-300">· Playoffs</span> : null}
                              {gb > 0 ? <span>· {gb.toFixed(1)} GB</span> : null}
                            </p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-center text-mist-400">{record.played}</td>
                      <td className="px-3 py-3 text-center font-semibold text-emerald-300">{record.wins}</td>
                      <td className="px-3 py-3 text-center text-mist-400">{record.losses}</td>
                      <td className="px-3 py-3 text-center font-display text-base font-bold text-white">
                        {formatPct(record.winPct)}
                      </td>
                      <td className="px-3 py-3 text-right text-mist-300">{formatNumber(record.pointsFor)}</td>
                      <td className="px-3 py-3 text-right text-mist-300">{formatNumber(record.pointsAgainst)}</td>
                      <td
                        className={`px-3 py-3 text-right font-display text-base font-bold ${
                          record.diff > 0 ? 'text-emerald-300' : record.diff < 0 ? 'text-league-redSoft' : 'text-mist-400'
                        }`}
                      >
                        {formatSigned(record.diff)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 font-display text-xs font-bold ${
                            record.streak[0] === 'W'
                              ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                              : record.streak[0] === 'L'
                                ? 'border-league-red/20 bg-league-red/10 text-league-redSoft'
                                : 'border-white/10 bg-white/[0.03] text-mist-400'
                          }`}
                        >
                          {streakLabel(record.streak)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <FormPills results={record.streak} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] bg-white/[0.015] px-4 py-3 text-[10px] text-mist-500">
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-league-red" /> Zona de playoffs (top 4)
              </span>
              <span>GB = partidos de diferencia con el líder</span>
            </span>
            <span>
              PF = puntos anotados · PC = puntos recibidos · DIF = diferencia total
            </span>
          </div>
        </Card>
      )}

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <SectionTitle
            title="Últimos resultados"
            subtitle={`Conferencia ${conference === 'East' ? 'Este' : 'Oeste'} · ${season.name}`}
            icon={<Trophy className="h-4 w-4" />}
            action={
              <Link to="/games" className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-league-redSoft hover:text-white">
                Ver todos <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          {finals.length === 0 ? (
            <EmptyState className="mt-4" title="Sin resultados" description="No hay partidos finalizados entre equipos de esta conferencia." />
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {finals.map((game) => (
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

        <Card>
          <SectionTitle
            title="Próximos encuentros"
            subtitle={`Conferencia ${conference === 'East' ? 'Este' : 'Oeste'}`}
            icon={<CalendarClock className="h-4 w-4" />}
          />
          {upcoming.length === 0 ? (
            <EmptyState
              className="mt-4"
              title="Sin partidos programados"
              description="Programa nuevos encuentros desde el módulo de partidos."
            />
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {upcoming.map((game) => {
                const analysis = analyzeMatchup(game, db.teams, db.games, seasonId) ?? undefined
                return (
                  <UpcomingGameCard
                    key={game.id}
                    game={game}
                    home={db.teams.find((team) => team.id === game.homeTeamId)}
                    away={db.teams.find((team) => team.id === game.awayTeamId)}
                    analysis={analysis}
                  />
                )
              })}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
        <p className="text-[10px] leading-relaxed text-mist-500">
          <span className="font-semibold text-mist-300">Datos calculados:</span> la clasificación, los porcentajes, las
          diferencias y las rachas se derivan exclusivamente de los resultados registrados en esta base local. El filtro
          de temporada {season.name} afecta a toda la tabla y a los encuentros mostrados. General: líder actual{' '}
          {general[0] ? `${general[0].team.abbreviation} (${formatPct(general[0].winPct)})` : 'sin datos'}.
        </p>
      </div>
    </div>
  )
}
