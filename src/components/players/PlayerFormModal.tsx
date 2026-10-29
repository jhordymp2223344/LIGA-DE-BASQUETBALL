import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Save, UserPlus } from 'lucide-react'
import type { Player, PlayerFormValues, Position } from '../../types'
import { useLeague } from '../../store/LeagueContext'
import { useToast } from '../ui/ToastProvider'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Field, FormSection, Input, Select } from '../ui/Field'
import { PlayerAvatar } from '../ui/TeamLogo'
import { buildTeamRecord } from '../../lib/stats'
import { POSITION_LABEL, POSITIONS, formatDecimal, teamFullName } from '../../lib/format'

interface PlayerFormModalProps {
  open: boolean
  onClose: () => void
  player?: Player | null
  defaultTeamId?: string
}

function todayMinusYears(years: number): string {
  const date = new Date()
  date.setFullYear(date.getFullYear() - years)
  return date.toISOString().slice(0, 10)
}

function emptyValues(teamId = ''): PlayerFormValues {
  return {
    firstName: '',
    lastName: '',
    teamId,
    position: 'PG',
    jerseyNumber: '',
    heightCm: '190',
    weightKg: '88',
    birthDate: '',
    nationality: 'Estados Unidos',
    gamesPlayed: '0',
    points: '0',
    rebounds: '0',
    assists: '0',
    steals: '0',
    blocks: '0',
  }
}

export function PlayerFormModal({ open, onClose, player, defaultTeamId }: PlayerFormModalProps) {
  const { db, activeSeason, createPlayer, updatePlayer, playerStatsFor } = useLeague()
  const { notify } = useToast()
  const [values, setValues] = useState<PlayerFormValues>(() => emptyValues(defaultTeamId))
  const [errors, setErrors] = useState<Partial<Record<keyof PlayerFormValues, string>>>({})
  const [formError, setFormError] = useState('')
  const isEditing = Boolean(player)

  const sortedTeams = useMemo(
    () => [...db.teams].sort((a, b) => teamFullName(a).localeCompare(teamFullName(b))),
    [db.teams],
  )

  const teamRecord = useMemo(() => {
    const team = db.teams.find((item) => item.id === values.teamId)
    return team ? buildTeamRecord(team, db.games, activeSeason.id) : null
  }, [activeSeason.id, db.games, db.teams, values.teamId])

  useEffect(() => {
    if (!open) return
    setErrors({})
    setFormError('')
    if (player) {
      const stat = playerStatsFor(player.id, activeSeason.id)
      setValues({
        firstName: player.firstName,
        lastName: player.lastName,
        teamId: player.teamId,
        position: player.position,
        jerseyNumber: String(player.jerseyNumber),
        heightCm: String(player.heightCm),
        weightKg: String(player.weightKg),
        birthDate: player.birthDate,
        nationality: player.nationality,
        gamesPlayed: String(stat?.gamesPlayed ?? 0),
        points: String(stat?.points ?? 0),
        rebounds: String(stat?.rebounds ?? 0),
        assists: String(stat?.assists ?? 0),
        steals: String(stat?.steals ?? 0),
        blocks: String(stat?.blocks ?? 0),
      })
    } else {
      const fallbackTeam = defaultTeamId || sortedTeams[0]?.id || ''
      setValues(emptyValues(fallbackTeam))
    }
  }, [open, player, defaultTeamId, playerStatsFor, activeSeason.id, sortedTeams])

  const update = <K extends keyof PlayerFormValues>(key: K, value: PlayerFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
    setFormError('')
  }

  const validate = (): boolean => {
    const next: Partial<Record<keyof PlayerFormValues, string>> = {}
    if (!values.firstName.trim()) next.firstName = 'El nombre es obligatorio.'
    if (!values.lastName.trim()) next.lastName = 'El apellido es obligatorio.'
    if (!values.teamId) next.teamId = 'Selecciona un equipo.'
    if (!values.birthDate) {
      next.birthDate = 'La fecha de nacimiento es obligatoria.'
    } else {
      const birth = new Date(`${values.birthDate}T12:00:00`)
      if (Number.isNaN(birth.getTime())) {
        next.birthDate = 'La fecha no es válida.'
      } else {
        const now = new Date()
        let age = now.getFullYear() - birth.getFullYear()
        const month = now.getMonth() - birth.getMonth()
        if (month < 0 || (month === 0 && now.getDate() < birth.getDate())) age -= 1
        if (age < 16 || age > 55) next.birthDate = 'La edad debe estar entre 16 y 55 años.'
      }
    }
    if (!values.nationality.trim()) next.nationality = 'La nacionalidad es obligatoria.'
    const jersey = Number(values.jerseyNumber)
    if (values.jerseyNumber === '' || !Number.isInteger(jersey) || jersey < 0 || jersey > 99) {
      next.jerseyNumber = 'El dorsal debe ser un entero entre 0 y 99.'
    }
    const height = Number(values.heightCm)
    if (!Number.isFinite(height) || height < 150 || height > 230) {
      next.heightCm = 'La estatura debe estar entre 150 y 230 cm.'
    }
    const weight = Number(values.weightKg)
    if (!Number.isFinite(weight) || weight < 60 || weight > 160) {
      next.weightKg = 'El peso debe estar entre 60 y 160 kg.'
    }

    const statKeys: Array<keyof PlayerFormValues> = ['gamesPlayed', 'points', 'rebounds', 'assists', 'steals', 'blocks']
    for (const key of statKeys) {
      const value = values[key]
      if (value === '' || !Number.isFinite(Number(value)) || Number(value) < 0) {
        next[key] = 'Debe ser un número igual o mayor que 0.'
      }
    }
    const gp = Number(values.gamesPlayed)
    if (Number.isFinite(gp) && gp > 0) {
      if (gp > 82) next.gamesPlayed = 'El máximo de partidos por temporada es 82.'
      if (Number(values.points) === 0 && Number(values.rebounds) === 0 && Number(values.assists) === 0) {
        next.points = 'Si hay partidos jugados, registra al menos una estadística.'
      }
    }
    if (Number(values.gamesPlayed) === 0) {
      const hasStats = ['points', 'rebounds', 'assists', 'steals', 'blocks'].some(
        (key) => Number(values[key as keyof PlayerFormValues]) > 0,
      )
      if (hasStats) next.gamesPlayed = 'Registra al menos un partido jugado para tener estadísticas.'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!validate()) return
    try {
      if (player) {
        updatePlayer(player.id, values)
        notify('Jugador actualizado', {
          message: `${values.firstName} ${values.lastName} se guardó correctamente.`,
        })
      } else {
        createPlayer(values)
        notify('Jugador registrado', {
          message: `${values.firstName} ${values.lastName} fue añadido a la plantilla.`,
        })
      }
      onClose()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'No se pudo guardar el jugador.')
    }
  }

  const selectedTeam = db.teams.find((team) => team.id === values.teamId)
  const gp = Number(values.gamesPlayed) || 0
  const initials = `${values.firstName.charAt(0)}${values.lastName.charAt(0)}`.toUpperCase() || 'NB'
  const avg = (total: string) => (gp > 0 ? formatDecimal(Number(total) / gp, 1) : '0,0')

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Editar jugador' : 'Registrar jugador'}
      subtitle={
        isEditing
          ? `Los totales de estadísticas corresponden a la temporada ${activeSeason.name}.`
          : 'Completa la ficha y asigna el jugador a un equipo.'
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button size="sm" type="submit" form="player-form" icon={<Save className="h-4 w-4" />}>
            {isEditing ? 'Guardar cambios' : 'Registrar jugador'}
          </Button>
        </>
      }
    >
      <form id="player-form" onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="flex items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          <PlayerAvatar
            firstName={values.firstName || initials.charAt(0)}
            lastName={values.lastName || initials.charAt(1) || 'B'}
            team={selectedTeam}
            size={58}
            jerseyNumber={values.jerseyNumber ? Number(values.jerseyNumber) : undefined}
          />
          <div className="min-w-0">
            <p className="truncate font-display text-xl font-bold uppercase leading-tight tracking-wide text-white">
              {`${values.firstName} ${values.lastName}`.trim() || 'Nuevo jugador'}
            </p>
            <p className="mt-0.5 truncate text-xs text-mist-400">
              {selectedTeam ? teamFullName(selectedTeam) : 'Sin equipo asignado'} ·{' '}
              {POSITION_LABEL[values.position]}
            </p>
          </div>
          <UserPlus className="ml-auto hidden h-5 w-5 text-mist-600 sm:block" />
        </div>

        {db.teams.length === 0 ? (
          <div className="rounded-lg border border-league-gold/30 bg-league-gold/10 px-3 py-2 text-xs text-league-gold">
            No hay equipos registrados. Primero debes crear un equipo para poder asignar jugadores.
          </div>
        ) : null}

        {formError ? (
          <div className="rounded-lg border border-league-red/30 bg-league-red/10 px-3 py-2 text-xs text-league-redSoft">
            {formError}
          </div>
        ) : null}

        <FormSection title="Datos personales" description="Información básica de la ficha del jugador.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre" htmlFor="player-first" required error={errors.firstName}>
              <Input
                id="player-first"
                value={values.firstName}
                onChange={(event) => update('firstName', event.target.value)}
                placeholder="Ej. Jalen"
                error={Boolean(errors.firstName)}
              />
            </Field>
            <Field label="Apellido" htmlFor="player-last" required error={errors.lastName}>
              <Input
                id="player-last"
                value={values.lastName}
                onChange={(event) => update('lastName', event.target.value)}
                placeholder="Ej. Hart"
                error={Boolean(errors.lastName)}
              />
            </Field>
            <Field label="Fecha de nacimiento" htmlFor="player-birth" required error={errors.birthDate}>
              <Input
                id="player-birth"
                type="date"
                min={todayMinusYears(55)}
                max={todayMinusYears(16)}
                value={values.birthDate}
                onChange={(event) => update('birthDate', event.target.value)}
                error={Boolean(errors.birthDate)}
              />
            </Field>
            <Field label="Nacionalidad" htmlFor="player-nationality" required error={errors.nationality}>
              <Input
                id="player-nationality"
                list="nationality-options"
                value={values.nationality}
                onChange={(event) => update('nationality', event.target.value)}
                placeholder="Ej. Estados Unidos"
                error={Boolean(errors.nationality)}
              />
              <datalist id="nationality-options">
                {['Estados Unidos', 'Canadá', 'España', 'Francia', 'Serbia', 'Australia', 'Brasil', 'Argentina', 'Nigeria', 'Alemania'].map(
                  (country) => (
                    <option key={country} value={country} />
                  ),
                )}
              </datalist>
            </Field>
          </div>
        </FormSection>

        <FormSection title="Perfil deportivo" description="Equipo, posición, dorsal y medidas físicas.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Equipo" htmlFor="player-team" required error={errors.teamId} className="sm:col-span-2 lg:col-span-1">
              <Select
                id="player-team"
                value={values.teamId}
                onChange={(event) => update('teamId', event.target.value)}
                error={Boolean(errors.teamId)}
              >
                <option value="">Selecciona un equipo</option>
                {sortedTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {teamFullName(team)} ({team.abbreviation})
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Posición" htmlFor="player-position" required>
              <Select
                id="player-position"
                value={values.position}
                onChange={(event) => update('position', event.target.value as Position)}
              >
                {POSITIONS.map((position) => (
                  <option key={position} value={position}>
                    {POSITION_LABEL[position]} ({position})
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Dorsal" htmlFor="player-jersey" required error={errors.jerseyNumber} hint="Único dentro del equipo.">
              <Input
                id="player-jersey"
                type="number"
                min={0}
                max={99}
                value={values.jerseyNumber}
                onChange={(event) => update('jerseyNumber', event.target.value)}
                placeholder="23"
                error={Boolean(errors.jerseyNumber)}
              />
            </Field>
            <Field label="Estatura (cm)" htmlFor="player-height" required error={errors.heightCm}>
              <Input
                id="player-height"
                type="number"
                min={150}
                max={230}
                value={values.heightCm}
                onChange={(event) => update('heightCm', event.target.value)}
                error={Boolean(errors.heightCm)}
              />
            </Field>
            <Field label="Peso (kg)" htmlFor="player-weight" required error={errors.weightKg}>
              <Input
                id="player-weight"
                type="number"
                min={60}
                max={160}
                value={values.weightKg}
                onChange={(event) => update('weightKg', event.target.value)}
                error={Boolean(errors.weightKg)}
              />
            </Field>
            <div className="flex items-end">
              <p className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-[11px] leading-relaxed text-mist-400">
                {teamRecord
                  ? `${teamRecord.team.abbreviation} lleva ${teamRecord.played} partidos finalizados en ${activeSeason.name}.`
                  : 'Selecciona un equipo para ver su actividad.'}
              </p>
            </div>
          </div>
        </FormSection>

        <FormSection
          title={`Estadísticas · ${activeSeason.name}`}
          description="Introduce totales de temporada. La aplicación calcula los promedios por partido."
        >
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <Field label="Partidos" htmlFor="stat-gp" error={errors.gamesPlayed}>
              <Input
                id="stat-gp"
                type="number"
                min={0}
                max={82}
                value={values.gamesPlayed}
                onChange={(event) => update('gamesPlayed', event.target.value)}
                error={Boolean(errors.gamesPlayed)}
              />
            </Field>
            <Field label="Puntos" htmlFor="stat-pts" error={errors.points}>
              <Input
                id="stat-pts"
                type="number"
                min={0}
                value={values.points}
                onChange={(event) => update('points', event.target.value)}
                error={Boolean(errors.points)}
              />
            </Field>
            <Field label="Rebotes" htmlFor="stat-reb" error={errors.rebounds}>
              <Input
                id="stat-reb"
                type="number"
                min={0}
                value={values.rebounds}
                onChange={(event) => update('rebounds', event.target.value)}
                error={Boolean(errors.rebounds)}
              />
            </Field>
            <Field label="Asistencias" htmlFor="stat-ast" error={errors.assists}>
              <Input
                id="stat-ast"
                type="number"
                min={0}
                value={values.assists}
                onChange={(event) => update('assists', event.target.value)}
                error={Boolean(errors.assists)}
              />
            </Field>
            <Field label="Robos" htmlFor="stat-stl" error={errors.steals}>
              <Input
                id="stat-stl"
                type="number"
                min={0}
                value={values.steals}
                onChange={(event) => update('steals', event.target.value)}
                error={Boolean(errors.steals)}
              />
            </Field>
            <Field label="Bloqueos" htmlFor="stat-blk" error={errors.blocks}>
              <Input
                id="stat-blk"
                type="number"
                min={0}
                value={values.blocks}
                onChange={(event) => update('blocks', event.target.value)}
                error={Boolean(errors.blocks)}
              />
            </Field>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg border border-white/[0.07] bg-white/[0.02] p-3 sm:grid-cols-5">
            {[
              ['PTS', avg(values.points)],
              ['REB', avg(values.rebounds)],
              ['AST', avg(values.assists)],
              ['ROB', avg(values.steals)],
              ['BLQ', avg(values.blocks)],
            ].map(([label, value]) => (
              <div key={label} className="text-center">
                <p className="text-[9px] font-bold uppercase tracking-widest text-mist-500">{label}/partido</p>
                <p className="font-display text-lg font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
        </FormSection>
      </form>
    </Modal>
  )
}
