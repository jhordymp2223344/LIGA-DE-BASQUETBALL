import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  CalendarDays,
  Database,
  LayoutDashboard,
  ListOrdered,
  Shield,
  TrendingUp,
  UserX,
  Users,
} from 'lucide-react'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Competición',
    items: [
      { label: 'Panel principal', to: '/', icon: LayoutDashboard, end: true },
      { label: 'Equipos', to: '/teams', icon: Shield },
      { label: 'Jugadores', to: '/players', icon: Users },
      { label: 'Partidos', to: '/games', icon: CalendarDays },
      { label: 'Clasificación', to: '/standings', icon: ListOrdered },
    ],
  },
  {
    title: 'Análisis',
    items: [{ label: 'Favoritos y cuotas', to: '/favorites', icon: TrendingUp }],
  },
  {
    title: 'Administración',
    items: [
      { label: 'Eliminar jugadores', to: '/players/delete', icon: UserX },
      { label: 'Datos y respaldo', to: '/data', icon: Database },
    ],
  },
]

export function pageTitleFor(pathname: string): { title: string; section: string } {
  if (pathname === '/') return { title: 'Panel principal', section: 'Liga' }
  if (pathname === '/teams') return { title: 'Equipos', section: 'Competición' }
  if (pathname.startsWith('/teams/')) return { title: 'Detalle del equipo', section: 'Equipos' }
  if (pathname === '/players') return { title: 'Jugadores', section: 'Competición' }
  if (pathname === '/players/delete') return { title: 'Eliminar jugadores', section: 'Administración' }
  if (pathname.startsWith('/players/')) return { title: 'Perfil del jugador', section: 'Jugadores' }
  if (pathname === '/games') return { title: 'Partidos', section: 'Competición' }
  if (pathname === '/standings') return { title: 'Clasificación', section: 'Competición' }
  if (pathname === '/favorites') return { title: 'Favoritos y cuotas', section: 'Análisis' }
  if (pathname === '/data') return { title: 'Datos y respaldo', section: 'Administración' }
  return { title: 'US Basketball League', section: 'Liga' }
}

export const SEASON_STATS_ICON = BarChart3
