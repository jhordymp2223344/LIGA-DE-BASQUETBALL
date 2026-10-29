import type { ReactNode } from 'react'
import { Card } from './Card'

type StatTone = 'red' | 'blue' | 'gold' | 'green' | 'neutral'

const TONES: Record<StatTone, { icon: string; line: string; glow: string }> = {
  red: { icon: 'bg-league-red/12 text-league-redSoft', line: 'from-league-red to-league-red/0', glow: 'bg-league-red/10' },
  blue: { icon: 'bg-league-blue/12 text-league-blueSoft', line: 'from-league-blue to-league-blue/0', glow: 'bg-league-blue/10' },
  gold: { icon: 'bg-league-gold/12 text-league-gold', line: 'from-league-gold to-league-gold/0', glow: 'bg-league-gold/10' },
  green: { icon: 'bg-emerald-400/10 text-emerald-300', line: 'from-emerald-400 to-emerald-400/0', glow: 'bg-emerald-400/10' },
  neutral: { icon: 'bg-white/[0.06] text-white', line: 'from-white/40 to-white/0', glow: 'bg-white/5' },
}

interface StatTileProps {
  label: string
  value: ReactNode
  icon?: ReactNode
  hint?: ReactNode
  tone?: StatTone
  className?: string
}

export function StatTile({ label, value, icon, hint, tone = 'red', className = '' }: StatTileProps) {
  const colors = TONES[tone]
  return (
    <Card padded={false} className={`relative overflow-hidden p-4 sm:p-5 ${className}`}>
      <span className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${colors.line}`} />
      <span className={`absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl ${colors.glow}`} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-mist-400">{label}</p>
          <p className="mt-1.5 font-display text-4xl font-extrabold leading-none tracking-tight text-white">
            {value}
          </p>
          {hint ? <div className="mt-2 text-[11px] leading-snug text-mist-400">{hint}</div> : null}
        </div>
        {icon ? (
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${colors.icon}`}>{icon}</span>
        ) : null}
      </div>
    </Card>
  )
}
