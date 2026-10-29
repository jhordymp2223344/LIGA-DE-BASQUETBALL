import type { CSSProperties, ReactNode } from 'react'

interface BarListItem {
  id: string
  label: ReactNode
  value: number
  display: string
  color?: string
  meta?: ReactNode
}

interface BarListProps {
  items: BarListItem[]
  max?: number
  className?: string
  barClassName?: string
}

export function BarList({ items, max, className = '', barClassName = 'h-1.5' }: BarListProps) {
  const ceiling = max ?? Math.max(...items.map((item) => item.value), 1)
  return (
    <div className={`space-y-3.5 ${className}`}>
      {items.map((item) => (
        <div key={item.id}>
          <div className="mb-1.5 flex items-end justify-between gap-3">
            <div className="min-w-0">{item.label}</div>
            <div className="flex shrink-0 items-baseline gap-2">
              {item.meta}
              <span className="font-display text-lg font-bold leading-none text-white">{item.display}</span>
            </div>
          </div>
          <div className={`w-full overflow-hidden rounded-full bg-white/[0.06] ${barClassName}`}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.max(3, Math.min(100, (item.value / ceiling) * 100))}%`,
                background: item.color ?? 'linear-gradient(90deg, #e11d2e, #ff4d5d)',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

interface FormPillsProps {
  results: Array<'W' | 'L'>
  size?: 'sm' | 'md'
  emptyLabel?: string
}

export function FormPills({ results, size = 'sm', emptyLabel = 'Sin partidos' }: FormPillsProps) {
  if (results.length === 0) return <span className="text-xs text-mist-500">{emptyLabel}</span>
  const dimensions = size === 'sm' ? 'h-6 w-6 text-[10px]' : 'h-8 w-8 text-xs'
  return (
    <div className="flex items-center gap-1.5" aria-label={`Racha reciente: ${results.join(', ')}`}>
      {results.map((result, index) => (
        <span
          key={`${result}-${index}`}
          title={result === 'W' ? 'Victoria' : 'Derrota'}
          className={`grid place-items-center rounded-md border font-display font-bold ${dimensions} ${
            result === 'W'
              ? 'border-emerald-400/30 bg-emerald-400/12 text-emerald-300'
              : 'border-league-red/30 bg-league-red/12 text-league-redSoft'
          }`}
        >
          {result === 'W' ? 'V' : 'D'}
        </span>
      ))}
    </div>
  )
}

interface ProbabilitySplitProps {
  homeLabel: string
  awayLabel: string
  homeProbability: number
  awayProbability: number
  homeColor: string
  awayColor: string
  className?: string
}

export function ProbabilitySplit({
  homeLabel,
  awayLabel,
  homeProbability,
  awayProbability,
  homeColor,
  awayColor,
  className = '',
}: ProbabilitySplitProps) {
  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: homeColor }} />
          <span className="font-semibold text-white">{homeLabel}</span>
          <span className="font-display text-lg font-bold text-white">{Math.round(homeProbability * 100)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-display text-lg font-bold text-white">{Math.round(awayProbability * 100)}%</span>
          <span className="font-semibold text-white">{awayLabel}</span>
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: awayColor }} />
        </div>
      </div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full transition-all duration-700"
          style={{ width: `${homeProbability * 100}%`, background: homeColor }}
        />
        <div
          className="h-full transition-all duration-700"
          style={{ width: `${awayProbability * 100}%`, background: awayColor }}
        />
      </div>
    </div>
  )
}

interface CompareStatRowProps {
  label: string
  leftValue: number
  rightValue: number
  leftDisplay: string
  rightDisplay: string
  leftColor: string
  rightColor: string
  leftHighlight?: boolean
  rightHighlight?: boolean
}

export function CompareStatRow({
  label,
  leftValue,
  rightValue,
  leftDisplay,
  rightDisplay,
  leftColor,
  rightColor,
  leftHighlight,
  rightHighlight,
}: CompareStatRowProps) {
  const max = Math.max(Math.abs(leftValue), Math.abs(rightValue), 1)
  const leftWidth = (Math.abs(leftValue) / max) * 100
  const rightWidth = (Math.abs(rightValue) / max) * 100
  return (
    <div className="py-2.5">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <span className={`text-right font-display text-base font-bold ${leftHighlight ? 'text-white' : 'text-mist-200'}`}>
          {leftDisplay}
        </span>
        <span className="min-w-24 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-mist-500">
          {label}
        </span>
        <span className={`text-left font-display text-base font-bold ${rightHighlight ? 'text-white' : 'text-mist-200'}`}>
          {rightDisplay}
        </span>
      </div>
      <div className="mt-1.5 grid grid-cols-2 gap-1">
        <div className="flex justify-end rounded-full bg-white/[0.04]">
          <span className="block h-1.5 rounded-full transition-all duration-700" style={{ width: `${leftWidth}%`, backgroundColor: leftColor }} />
        </div>
        <div className="rounded-full bg-white/[0.04]">
          <span className="block h-1.5 rounded-full transition-all duration-700" style={{ width: `${rightWidth}%`, backgroundColor: rightColor }} />
        </div>
      </div>
    </div>
  )
}

interface ScoreComparisonProps {
  homeScores: number[]
  awayScores: number[]
  homeColor: string
  awayColor: string
}

export function ScoreComparison({ homeScores, awayScores, homeColor, awayColor }: ScoreComparisonProps) {
  const count = Math.max(homeScores.length, awayScores.length)
  if (count === 0) return <p className="text-xs text-mist-500">Todavía no hay partidos finalizados.</p>
  const max = Math.max(...homeScores, ...awayScores, 1)
  const groups = Array.from({ length: count }, (_, index) => ({
    home: homeScores[index],
    away: awayScores[index],
  }))
  return (
    <div>
      <div className="flex h-32 items-end justify-around gap-2 border-b border-white/[0.07] pb-2">
        {groups.map((group, index) => (
          <div key={index} className="flex h-full flex-1 items-end justify-center gap-1">
            <div
              className="w-3 rounded-t-sm transition-all duration-500"
              style={{ height: group.home ? `${(group.home / max) * 100}%` : '3px', backgroundColor: homeColor }}
              title={group.home ? `${group.home} puntos` : 'Sin dato'}
            />
            <div
              className="w-3 rounded-t-sm transition-all duration-500"
              style={{ height: group.away ? `${(group.away / max) * 100}%` : '3px', backgroundColor: awayColor }}
              title={group.away ? `${group.away} puntos` : 'Sin dato'}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-center gap-4 text-[10px] text-mist-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: homeColor }} /> Local
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: awayColor }} /> Visitante
        </span>
      </div>
    </div>
  )
}

export function barStyle(color: string): CSSProperties {
  return { background: color }
}
