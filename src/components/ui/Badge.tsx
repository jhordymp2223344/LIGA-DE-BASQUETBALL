import type { ReactNode } from 'react'

type Tone = 'neutral' | 'red' | 'blue' | 'green' | 'gold' | 'dark' | 'outline'

const TONES: Record<Tone, string> = {
  neutral: 'border-white/10 bg-white/[0.06] text-mist-200',
  red: 'border-league-red/30 bg-league-red/12 text-league-redSoft',
  blue: 'border-league-blue/30 bg-league-blue/12 text-league-blueSoft',
  green: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300',
  gold: 'border-league-gold/30 bg-league-gold/12 text-league-gold',
  dark: 'border-black/30 bg-black/30 text-white',
  outline: 'border-white/15 bg-transparent text-mist-300',
}

interface BadgeProps {
  tone?: Tone
  children: ReactNode
  className?: string
  dot?: boolean
}

export function Badge({ tone = 'neutral', children, className = '', dot }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${TONES[tone]} ${className}`}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  )
}
