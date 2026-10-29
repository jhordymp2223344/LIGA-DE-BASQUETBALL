import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean
  hover?: boolean
}

export function Card({ padded = true, hover = false, className = '', children, ...rest }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.07] bg-ink-850/90 shadow-panel ${
        padded ? 'p-5 sm:p-6' : ''
      } ${hover ? 'transition duration-300 hover:-translate-y-0.5 hover:border-white/[0.14] hover:shadow-lift' : ''} ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}

interface SectionTitleProps {
  title: string
  subtitle?: string
  action?: ReactNode
  icon?: ReactNode
  className?: string
}

export function SectionTitle({ title, subtitle, action, icon, className = '' }: SectionTitleProps) {
  return (
    <div className={`flex flex-wrap items-start justify-between gap-3 ${className}`}>
      <div className="flex items-start gap-3">
        {icon ? (
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-league-redSoft">
            {icon}
          </span>
        ) : null}
        <div>
          <h2 className="font-display text-xl font-bold uppercase tracking-wide text-white">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs text-mist-400">{subtitle}</p> : null}
        </div>
      </div>
      {action}
    </div>
  )
}
