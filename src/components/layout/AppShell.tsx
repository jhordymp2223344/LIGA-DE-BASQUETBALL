import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { CalendarDays, Menu, ShieldCheck, X } from 'lucide-react'
import { NAV_SECTIONS, pageTitleFor } from './navigation'
import { useLeague } from '../../store/LeagueContext'
import { formatDate } from '../../lib/format'
import { Badge } from '../ui/Badge'

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-3">
      <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-league-red text-white shadow-glow">
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3 12h18M12 3v18M5.6 5.6c3.5 3.5 3.5 9.3 0 12.8M18.4 5.6c-3.5 3.5-3.5 9.3 0 12.8" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </span>
      <span className="min-w-0">
        <span className="block font-display text-xl font-extrabold uppercase leading-none tracking-wide text-white">
          US <span className="text-league-redSoft">Basketball</span>
        </span>
        <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.28em] text-mist-400">
          League Manager
        </span>
      </span>
    </Link>
  )
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation()
  const { activeSeason, db } = useLeague()

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[78px] shrink-0 items-center justify-between border-b border-white/[0.07] px-5">
        <Brand />
        {onNavigate ? (
          <button
            type="button"
            onClick={onNavigate}
            className="rounded-lg p-2 text-mist-400 transition hover:bg-white/[0.06] hover:text-white lg:hidden"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="Navegación principal">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.2em] text-mist-500">
              {section.title}
            </p>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const active = item.end
                  ? location.pathname === item.to
                  : item.to === '/players'
                    ? location.pathname === '/players' ||
                      (location.pathname.startsWith('/players/') && location.pathname !== '/players/delete')
                    : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
                const Icon = item.icon
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      onClick={onNavigate}
                      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-semibold transition ${
                        active
                          ? 'bg-league-red/10 text-white'
                          : 'text-mist-400 hover:bg-white/[0.04] hover:text-white'
                      }`}
                    >
                      {active ? (
                        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-league-red" />
                      ) : null}
                      <Icon
                        className={`h-[18px] w-[18px] shrink-0 transition ${
                          active ? 'text-league-redSoft' : 'text-mist-500 group-hover:text-mist-300'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                      {item.to === '/players/delete' ? (
                        <span className="ml-auto rounded bg-league-red/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-league-redSoft">
                          Admin
                        </span>
                      ) : null}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 space-y-3 border-t border-white/[0.07] p-4">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-mist-400">
              <CalendarDays className="h-3.5 w-3.5" /> Temporada activa
            </span>
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          </div>
          <p className="mt-1.5 font-display text-2xl font-bold leading-none text-white">{activeSeason.name}</p>
          <p className="mt-1 text-[10px] text-mist-500">
            {db.teams.length} equipos · {db.players.length} jugadores
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-league-gold/15 bg-league-gold/[0.06] px-3 py-2">
          <ShieldCheck className="h-4 w-4 shrink-0 text-league-gold" />
          <p className="text-[10px] leading-snug text-mist-400">
            <span className="font-semibold text-league-gold">Modo demo.</span> Datos ficticios guardados localmente.
          </p>
        </div>
      </div>
    </div>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const { activeSeason, db } = useLeague()
  const page = pageTitleFor(location.pathname)

  useEffect(() => {
    setMobileOpen(false)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[268px] border-r border-white/[0.07] bg-ink-900/95 lg:block">
        <SidebarContent />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative h-full w-[286px] animate-slide-in border-r border-white/10 bg-ink-900 shadow-lift">
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-[268px]">
        <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-ink-950/85 backdrop-blur-lg">
          <div className="flex h-[66px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-lg border border-white/10 p-2 text-mist-300 transition hover:bg-white/[0.06] hover:text-white lg:hidden"
                aria-label="Abrir menú"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-mist-500">{page.section}</p>
                <p className="truncate font-display text-lg font-bold uppercase leading-tight tracking-wide text-white">
                  {page.title}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden items-center gap-2 border-r border-white/10 pr-4 md:flex">
                <span className="text-[10px] uppercase tracking-wider text-mist-500">Actualizado</span>
                <span className="text-[11px] font-medium text-mist-300">
                  {formatDate(db.updatedAt, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <Badge tone="gold" dot>
                Demo
              </Badge>
              <span className="hidden rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 font-display text-xs font-bold uppercase tracking-wide text-mist-200 sm:inline-flex">
                {activeSeason.name}
              </span>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1540px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
          <footer className="mt-12 border-t border-white/[0.06] py-6 text-center text-[10px] leading-relaxed text-mist-500">
            <p>
              US Basketball League Manager · Proyecto de demostración con equipos, jugadores y resultados ficticios.
            </p>
            <p className="mt-1">
              No está afiliado a la NBA ni a ninguna liga real. Los datos se almacenan en este navegador.
            </p>
          </footer>
        </main>
      </div>
    </div>
  )
}
