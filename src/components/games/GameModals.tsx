import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { CalendarPlus, Save } from 'lucide-react'
import type { Game, GameFormValues } from '../../types'
import { useLeague } from '../../store/LeagueContext'
import { useToast } from '../ui/ToastProvider'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Field, Input, Select } from '../ui/Field'
import { formatTime, teamFullName, toDateTimeInputValue } from '../../lib/format'

interface GameFormModalProps {
  open: boolean
  onClose: () => void
}

function defaultDate(seasonStart?: string): string {
  const now = new Date()
  if (seasonStart) {
    const start = new Date(`${seasonStart}T19:30:00`)
    if (start.getTime() > now.getTime()) {
      return toDateTimeInputValue(start)
    }
  }
  const date = new Date(now)
  date.setDate(date.getDate() + 2)
  date.setHours(19, 30, 0, 0)
  return toDateTimeInputValue(date)
}

export function GameFormModal({ open, onClose }: GameFormModalProps) {
  const { db, activeSeason, createGame } = useLeague()
  const { notify } = useToast()
  const [values, setValues] = useState<GameFormValues>({
    seasonId: activeSeason.id,
    date: defaultDate(activeSeason.startDate),
    homeTeamId: '',
    awayTeamId: '',
    venue: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof GameFormValues, string>>>({})
  const [formError, setFormError] = useState('')

  const sortedTeams = useMemo(
    () => [...db.teams].sort((a, b) => teamFullName(a).localeCompare(teamFullName(b))),
    [db.teams],
  )

  useEffect(() => {
    if (!open) return
    const first = sortedTeams[0]?.id ?? ''
    const second = sortedTeams[1]?.id ?? ''
    const home = db.teams.find((team) => team.id === first)
    setValues({
      seasonId: activeSeason.id,
      date: defaultDate(activeSeason.startDate),
      homeTeamId: first,
      awayTeamId: second,
      venue: home?.arena ?? '',
    })
    setErrors({})
    setFormError('')
  }, [open, activeSeason.id, activeSeason.startDate, sortedTeams, db.teams])

  const update = <K extends keyof GameFormValues>(key: K, value: GameFormValues[K]) => {
    setValues((current) => {
      if (key === 'homeTeamId') {
        const team = db.teams.find((item) => item.id === value)
        const previousHome = db.teams.find((item) => item.id === current.homeTeamId)
        return {
          ...current,
          homeTeamId: value as string,
          venue:
            !current.venue || current.venue === previousHome?.arena
              ? team?.arena ?? ''
              : current.venue,
        }
      }
      return { ...current, [key]: value }
    })
    setErrors((current) => ({ ...current, [key]: undefined }))
    setFormError('')
  }

  const validate = (): boolean => {
    const next: Partial<Record<keyof GameFormValues, string>> = {}
    if (!values.seasonId) next.seasonId = 'Selecciona una temporada.'
    if (!values.date) next.date = 'La fecha y hora son obligatorias.'
    if (!values.homeTeamId) next.homeTeamId = 'Selecciona el equipo local.'
    if (!values.awayTeamId) next.awayTeamId = 'Selecciona el equipo visitante.'
    if (values.homeTeamId && values.homeTeamId === values.awayTeamId) {
      next.awayTeamId = 'El visitante debe ser diferente al local.'
    }
    if (!values.venue.trim()) next.venue = 'El pabellón es obligatorio.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!validate()) return
    try {
      createGame(values)
      const home = db.teams.find((team) => team.id === values.homeTeamId)
      const away = db.teams.find((team) => team.id === values.awayTeamId)
      notify('Partido programado', {
        message: `${away?.abbreviation ?? ''} visita a ${home?.abbreviation ?? ''} · ${formatTime(values.date)}.`,
        variant: 'success',
      })
      onClose()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'No se pudo programar el partido.')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Programar partido"
      subtitle="Los encuentros programados aparecen en el calendario y en el análisis de favoritos."
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button size="sm" type="submit" form="game-form" icon={<CalendarPlus className="h-4 w-4" />}>
            Programar partido
          </Button>
        </>
      }
    >
      <form id="game-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
        {formError ? (
          <div className="rounded-lg border border-league-red/30 bg-league-red/10 px-3 py-2 text-xs text-league-redSoft">
            {formError}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Temporada" htmlFor="game-season" required error={errors.seasonId}>
            <Select
              id="game-season"
              value={values.seasonId}
              onChange={(event) => update('seasonId', event.target.value)}
              error={Boolean(errors.seasonId)}
            >
              {db.seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  Temporada {season.name}
                  {season.isActive ? ' (activa)' : ''}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Fecha y hora" htmlFor="game-date" required error={errors.date}>
            <Input
              id="game-date"
              type="datetime-local"
              value={values.date}
              onChange={(event) => update('date', event.target.value)}
              error={Boolean(errors.date)}
            />
          </Field>
          <Field label="Equipo local" htmlFor="game-home" required error={errors.homeTeamId}>
            <Select
              id="game-home"
              value={values.homeTeamId}
              onChange={(event) => update('homeTeamId', event.target.value)}
              error={Boolean(errors.homeTeamId)}
            >
              <option value="">Selecciona un equipo</option>
              {sortedTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {teamFullName(team)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Equipo visitante" htmlFor="game-away" required error={errors.awayTeamId}>
            <Select
              id="game-away"
              value={values.awayTeamId}
              onChange={(event) => update('awayTeamId', event.target.value)}
              error={Boolean(errors.awayTeamId)}
            >
              <option value="">Selecciona un equipo</option>
              {sortedTeams
                .filter((team) => team.id !== values.homeTeamId)
                .map((team) => (
                  <option key={team.id} value={team.id}>
                    {teamFullName(team)}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Pabellón" htmlFor="game-venue" required error={errors.venue} className="sm:col-span-2">
            <Input
              id="game-venue"
              value={values.venue}
              onChange={(event) => update('venue', event.target.value)}
              placeholder="Nombre del pabellón"
              error={Boolean(errors.venue)}
            />
          </Field>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-league-blue/20 bg-league-blue/[0.07] p-3">
          <Save className="mt-0.5 h-4 w-4 shrink-0 text-league-blueSoft" />
          <p className="text-[11px] leading-relaxed text-mist-400">
            El partido se crea como <span className="font-semibold text-white">programado</span>. Después podrás ingresar
            el marcador final desde la sección Partidos.
          </p>
        </div>
      </form>
    </Modal>
  )
}

interface GameResultModalProps {
  open: boolean
  onClose: () => void
  game: Game | null
}

export function GameResultModal({ open, onClose, game }: GameResultModalProps) {
  const { db, updateGameResult } = useLeague()
  const { notify } = useToast()
  const [homeScore, setHomeScore] = useState('')
  const [awayScore, setAwayScore] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !game) return
    setHomeScore(game.homeScore !== undefined ? String(game.homeScore) : '')
    setAwayScore(game.awayScore !== undefined ? String(game.awayScore) : '')
    setError('')
  }, [open, game])

  if (!game) return null
  const home = db.teams.find((team) => team.id === game.homeTeamId)
  const away = db.teams.find((team) => team.id === game.awayTeamId)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const home = Number(homeScore)
    const away = Number(awayScore)
    if (homeScore === '' || awayScore === '') {
      setError('Debes ingresar ambos marcadores.')
      return
    }
    if (!Number.isInteger(home) || !Number.isInteger(away) || home < 0 || away < 0 || home > 200 || away > 200) {
      setError('Los marcadores deben ser números enteros entre 0 y 200.')
      return
    }
    if (home === away) {
      setError('El baloncesto no admite empates. Ajusta el marcador final.')
      return
    }
    updateGameResult(game.id, home, away)
    const winner = home > away ? homeTeamName : awayTeamName
    notify('Resultado guardado', {
      message: `${winner} gana el partido. La clasificación y las estadísticas se actualizaron.`,
      variant: 'success',
    })
    onClose()
  }

  const homeTeamName = home ? `${home.city} ${home.name}` : 'Equipo local'
  const awayTeamName = away ? `${away.city} ${away.name}` : 'Equipo visitante'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={game.status === 'final' ? 'Editar resultado' : 'Registrar resultado'}
      subtitle={
        game.status === 'final'
          ? 'Modificar el marcador recalcula la clasificación automáticamente.'
          : 'Introduce el marcador final del encuentro.'
      }
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button size="sm" type="submit" form="result-form" icon={<Save className="h-4 w-4" />}>
            Guardar resultado
          </Button>
        </>
      }
    >
      <form id="result-form" onSubmit={handleSubmit} className="space-y-5" noValidate>
        {error ? (
          <div className="rounded-lg border border-league-red/30 bg-league-red/10 px-3 py-2 text-xs text-league-redSoft">
            {error}
          </div>
        ) : null}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="text-center">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-mist-400">Local</p>
            <Input
              type="number"
              min={0}
              max={200}
              value={homeScore}
              onChange={(event) => {
                setHomeScore(event.target.value)
                setError('')
              }}
              className="h-16 text-center font-display text-4xl font-bold"
              aria-label="Puntos del equipo local"
            />
            <p className="mt-2 truncate text-xs font-semibold text-white">{homeTeamName}</p>
          </div>
          <span className="pt-6 font-display text-2xl font-bold text-mist-600">VS</span>
          <div className="text-center">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-mist-400">Visitante</p>
            <Input
              type="number"
              min={0}
              max={200}
              value={awayScore}
              onChange={(event) => {
                setAwayScore(event.target.value)
                setError('')
              }}
              className="h-16 text-center font-display text-4xl font-bold"
              aria-label="Puntos del equipo visitante"
            />
            <p className="mt-2 truncate text-xs font-semibold text-white">{awayTeamName}</p>
          </div>
        </div>
        <p className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-center text-[11px] text-mist-400">
          {game.homeScore !== undefined
            ? `Marcador actual: ${game.homeScore} - ${game.awayScore}`
            : 'Este partido aún no tiene resultado registrado.'}
        </p>
      </form>
    </Modal>
  )
}
