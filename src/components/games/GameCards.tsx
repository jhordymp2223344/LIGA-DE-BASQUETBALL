import { Link } from 'react-router-dom'
import { ArrowRight, MapPin } from 'lucide-react'
import type { Game, MatchupAnalysis, Team } from '../../types'
import { TeamLogo } from '../ui/TeamLogo'
import { Badge } from '../ui/Badge'
import { formatLongDate, formatShortDate, formatTime } from '../../lib/format'

interface GameScoreCardProps {
  game: Game
  home?: Team
  away?: Team
  className?: string
}

export function GameScoreCard({ game, home, away, className = '' }: GameScoreCardProps) {
  const homeScore = game.homeScore
  const awayScore = game.awayScore
  if (!home || !away || homeScore === undefined || awayScore === undefined) return null
  return (
    <div className={`rounded-xl border border-white/[0.07] bg-ink-900/60 p-4 transition hover:border-white/[0.13] ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-mist-500">
          {formatShortDate(game.date)} · {formatTime(game.date)}
        </span>
        <Badge tone="neutral">Final</Badge>
      </div>
      <div className="space-y-2">
        {[
          { team: away, score: awayScore, isAway: true },
          { team: home, score: homeScore, isAway: false },
        ].map(({ team, score, isAway }) => {
          const won = isAway ? awayScore > homeScore : homeScore > awayScore
          return (
            <Link
              key={team.id}
              to={`/teams/${team.id}`}
              className={`flex items-center gap-3 rounded-lg px-1.5 py-1 transition hover:bg-white/[0.04] ${
                won ? '' : 'opacity-65'
              }`}
            >
              <TeamLogo team={team} size={26} />
              <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-semibold ${won ? 'text-white' : 'text-mist-300'}`}>
                  {team.city} <span className="text-mist-400">{team.name}</span>
                </p>
              </div>
              {isAway ? <span className="text-[9px] uppercase tracking-wider text-mist-600">Vis</span> : null}
              <span className={`font-display text-2xl font-bold leading-none ${won ? 'text-white' : 'text-mist-400'}`}>
                {score}
              </span>
            </Link>
          )
        })}
      </div>
      <p className="mt-2 flex items-center gap-1 text-[10px] text-mist-500">
        <MapPin className="h-3 w-3" /> {game.venue}
      </p>
    </div>
  )
}

interface UpcomingGameCardProps {
  game: Game
  home?: Team
  away?: Team
  analysis?: MatchupAnalysis
  className?: string
  showVenue?: boolean
}

export function UpcomingGameCard({ game, home, away, analysis, className = '', showVenue = true }: UpcomingGameCardProps) {
  if (!home || !away) return null
  return (
    <div className={`rounded-xl border border-white/[0.07] bg-ink-900/60 p-4 transition hover:border-white/[0.13] ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-mist-500">
          {formatShortDate(game.date)} · {formatTime(game.date)}
        </span>
        <Badge tone="blue" dot>
          Programado
        </Badge>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <Link to={`/teams/${away.id}`} className="group flex min-w-0 flex-col items-center gap-1.5 text-center">
          <TeamLogo team={away} size={38} />
          <p className="truncate text-xs font-semibold text-mist-200 group-hover:text-white">{away.abbreviation}</p>
          <p className="text-[9px] uppercase tracking-wider text-mist-600">Visitante</p>
        </Link>
        <div className="text-center">
          <p className="font-display text-lg font-bold text-mist-500">VS</p>
          {analysis ? (
            <p className="mt-1 text-[10px] font-semibold text-league-gold">
              {analysis.favorite.abbreviation} favorito
            </p>
          ) : null}
        </div>
        <Link to={`/teams/${home.id}`} className="group flex min-w-0 flex-col items-center gap-1.5 text-center">
          <TeamLogo team={home} size={38} />
          <p className="truncate text-xs font-semibold text-mist-200 group-hover:text-white">{home.abbreviation}</p>
          <p className="text-[9px] uppercase tracking-wider text-mist-600">Local</p>
        </Link>
      </div>
      {analysis ? (
        <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <span style={{ width: `${analysis.awayProbability * 100}%`, backgroundColor: away.colors.primary }} />
          <span style={{ width: `${analysis.homeProbability * 100}%`, backgroundColor: home.colors.primary }} />
        </div>
      ) : null}
      {showVenue ? (
        <p className="mt-2 flex items-center justify-center gap-1 text-[10px] text-mist-500">
          <MapPin className="h-3 w-3" /> {game.venue}
        </p>
      ) : null}
    </div>
  )
}

export function NextGameBanner({ game, home, away, analysis }: { game: Game; home?: Team; away?: Team; analysis?: MatchupAnalysis }) {
  if (!home || !away) return null
  return (
    <div className="rounded-2xl border border-white/10 bg-ink-950/55 p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-league-gold">Próximo encuentro</p>
        <span className="text-[10px] text-mist-400">{formatLongDate(game.date)}</span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <TeamLogo team={away} size={34} />
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-bold uppercase leading-none text-white">{away.abbreviation}</p>
            <p className="text-[9px] text-mist-500">Visitante</p>
          </div>
        </div>
        <div className="text-center">
          <p className="font-display text-xl font-bold leading-none text-mist-400">VS</p>
          <p className="mt-1 text-[10px] font-semibold text-white">{formatTime(game.date)}</p>
        </div>
        <div className="flex min-w-0 items-center justify-end gap-2 text-right">
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-bold uppercase leading-none text-white">{home.abbreviation}</p>
            <p className="text-[9px] text-mist-500">Local</p>
          </div>
          <TeamLogo team={home} size={34} />
        </div>
      </div>
      {analysis ? (
        <div className="mt-3">
          <div className="flex h-1.5 overflow-hidden rounded-full bg-white/10">
            <span style={{ width: `${analysis.awayProbability * 100}%`, backgroundColor: away.colors.primary }} />
            <span style={{ width: `${analysis.homeProbability * 100}%`, backgroundColor: home.colors.primary }} />
          </div>
          <div className="mt-1.5 flex justify-between text-[9px] font-semibold text-mist-400">
            <span>{Math.round(analysis.awayProbability * 100)}%</span>
            <span className="text-league-gold">Favorito: {analysis.favorite.name}</span>
            <span>{Math.round(analysis.homeProbability * 100)}%</span>
          </div>
        </div>
      ) : null}
      <Link
        to="/favorites"
        className="mt-3 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-league-redSoft transition hover:text-white"
      >
        Analizar el partido <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}
