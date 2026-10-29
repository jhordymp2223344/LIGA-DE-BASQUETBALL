import { Link } from 'react-router-dom'
import { ArrowLeft, Compass, LayoutDashboard, TrendingUp } from 'lucide-react'
import { buttonStyles } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

export function NotFound() {
  return (
    <div className="mx-auto max-w-3xl animate-fade-up py-6 sm:py-12">
      <Card className="relative overflow-hidden p-6 sm:p-10">
        <div className="court-lines absolute inset-0 opacity-50" aria-hidden="true" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <span className="h-px w-6 bg-league-red" />
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-league-redSoft">Error 404</span>
          </div>
          <p className="mt-4 font-display text-7xl font-extrabold leading-none tracking-tight text-white sm:text-8xl">
            Fuera <span className="text-league-redSoft">de la cancha.</span>
          </p>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-mist-400">
            La página que buscas no existe o fue movida. Vuelve al panel principal para seguir gestionando equipos,
            jugadores, partidos y clasificación.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link to="/" className={buttonStyles('primary', 'md')}>
              <LayoutDashboard className="h-4 w-4" /> Panel principal
            </Link>
            <Link to="/teams" className={buttonStyles('secondary', 'md')}>
              <Compass className="h-4 w-4" /> Explorar equipos
            </Link>
            <Link to="/favorites" className={buttonStyles('ghost', 'md')}>
              <TrendingUp className="h-4 w-4" /> Favoritos y cuotas
            </Link>
          </div>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-mist-500 transition hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Volver al inicio
          </Link>
        </div>
      </Card>
    </div>
  )
}
