import { useId } from 'react'
import type { Team } from '../../types'

interface TeamLogoProps {
  team: Pick<Team, 'abbreviation' | 'colors' | 'name'>
  size?: number
  className?: string
  glow?: boolean
}

export function TeamLogo({ team, size = 44, className = '', glow = false }: TeamLogoProps) {
  const rawId = useId()
  const gradientId = `logo-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`
  const { primary, secondary } = team.colors
  return (
    <svg
      width={size}
      height={size * 1.125}
      viewBox="0 0 64 72"
      className={`shrink-0 drop-shadow-[0_6px_12px_rgba(0,0,0,0.45)] ${glow ? 'drop-shadow-[0_0_18px_rgba(225,29,46,0.25)]' : ''} ${className}`}
      role="img"
      aria-label={`Escudo de ${team.name}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={primary} />
          <stop offset="100%" stopColor={secondary} />
        </linearGradient>
      </defs>
      <path
        d="M32 2.5 60 12v26c0 16.2-13.2 27.4-28 33.2C17.2 65.4 4 54.2 4 38V12Z"
        fill={`url(#${gradientId})`}
        stroke="rgba(255,255,255,0.32)"
        strokeWidth="1.5"
      />
      <path
        d="M32 6.5 56 14.7v23.1c0 13.7-11.2 23.7-24 29-12.8-5.3-24-15.3-24-29V14.7Z"
        fill="none"
        stroke="rgba(0,0,0,0.28)"
        strokeWidth="1"
      />
      <text
        x="32"
        y="38"
        textAnchor="middle"
        fontFamily="Barlow Condensed, Arial Narrow, sans-serif"
        fontSize={team.abbreviation.length > 3 ? 17 : 20}
        fontWeight="800"
        fill="#ffffff"
        letterSpacing="0.5"
        style={{ paintOrder: 'stroke', stroke: 'rgba(0,0,0,0.25)', strokeWidth: '1px' }}
      >
        {team.abbreviation}
      </text>
      <g opacity="0.8" stroke="#ffffff" strokeWidth="1" fill="none">
        <circle cx="32" cy="52" r="4.6" />
        <path d="M27.4 52h9.2M32 47.4v9.2M28.7 48.7c2.2 2 2.2 4.6 0 6.6M35.3 48.7c-2.2 2-2.2 4.6 0 6.6" />
      </g>
    </svg>
  )
}

interface PlayerAvatarProps {
  firstName: string
  lastName: string
  team?: Pick<Team, 'colors'>
  size?: number
  jerseyNumber?: number
  className?: string
}

export function PlayerAvatar({
  firstName,
  lastName,
  team,
  size = 40,
  jerseyNumber,
  className = '',
}: PlayerAvatarProps) {
  const primary = team?.colors.primary ?? '#1e304d'
  const secondary = team?.colors.secondary ?? '#2a3f61'
  const textSize = size <= 32 ? 'text-[11px]' : size <= 48 ? 'text-sm' : size <= 80 ? 'text-2xl' : 'text-4xl'
  return (
    <div className={`relative inline-flex shrink-0 ${className}`} style={{ width: size, height: size }}>
      <div
        className={`grid h-full w-full place-items-center overflow-hidden rounded-full border border-white/20 font-display font-extrabold tracking-wide text-white ${textSize}`}
        style={{
          background: `radial-gradient(circle at 30% 20%, rgba(255,255,255,0.28), transparent 45%), linear-gradient(140deg, ${primary}, ${secondary})`,
        }}
        aria-hidden="true"
      >
      {firstName.charAt(0)}
      {lastName.charAt(0)}
      </div>
      {typeof jerseyNumber === 'number' ? (
        <span className="absolute -bottom-1 -right-1 grid min-w-5 place-items-center rounded-full border border-ink-850 bg-ink-950 px-1 font-display text-[10px] font-bold text-white">
          {jerseyNumber}
        </span>
      ) : null}
    </div>
  )
}
