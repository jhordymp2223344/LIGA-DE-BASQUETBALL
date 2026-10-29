import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({ title, description, icon, action, className = '' }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center ${className}`}
    >
      <span className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-mist-400">
        {icon ?? <Inbox className="h-5 w-5" />}
      </span>
      <p className="mt-3 font-display text-lg font-bold uppercase tracking-wide text-white">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-xs leading-relaxed text-mist-400">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
