import type { ReactNode } from 'react'
import { Search, X } from 'lucide-react'
import { inputClass } from './Field'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  ariaLabel?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Buscar…',
  className = '',
  ariaLabel = 'Buscar',
}: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-500" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={`${inputClass} pl-9 pr-9`}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-mist-500 transition hover:bg-white/[0.06] hover:text-white"
          aria-label="Limpiar búsqueda"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  )
}

interface TabsProps<T extends string> {
  options: Array<{ value: T; label: ReactNode; count?: number }>
  value: T
  onChange: (value: T) => void
  className?: string
  size?: 'sm' | 'md'
}

export function Tabs<T extends string>({ options, value, onChange, className = '', size = 'md' }: TabsProps<T>) {
  return (
    <div
      className={`inline-flex flex-wrap items-center gap-1 rounded-xl border border-white/[0.08] bg-ink-900/70 p-1 ${className}`}
      role="tablist"
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={`inline-flex items-center gap-1.5 rounded-lg font-semibold transition ${
              size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-3.5 py-2 text-sm'
            } ${
              active
                ? 'bg-league-red text-white shadow-[0_8px_20px_-12px_rgba(225,29,46,0.9)]'
                : 'text-mist-400 hover:bg-white/[0.05] hover:text-white'
            }`}
          >
            {option.label}
            {typeof option.count === 'number' ? (
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                  active ? 'bg-black/20 text-white' : 'bg-white/[0.07] text-mist-400'
                }`}
              >
                {option.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
