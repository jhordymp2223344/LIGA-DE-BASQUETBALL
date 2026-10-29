import { useEffect, useState, type FormEvent } from 'react'
import { Save, Shield } from 'lucide-react'
import type { Conference, Team, TeamFormValues } from '../../types'
import { useLeague } from '../../store/LeagueContext'
import { useToast } from '../ui/ToastProvider'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Field, FormSection, Input, Select } from '../ui/Field'
import { TeamLogo } from '../ui/TeamLogo'

interface TeamFormModalProps {
  open: boolean
  onClose: () => void
  team?: Team | null
}

const PRESETS: Array<{ label: string; primary: string; secondary: string }> = [
  { label: 'Azul / rojo', primary: '#1D4ED8', secondary: '#C8102E' },
  { label: 'Verde / dorado', primary: '#007A33', secondary: '#BA9653' },
  { label: 'Púrpura / oro', primary: '#552583', secondary: '#FDB927' },
  { label: 'Rojo / negro', primary: '#C8102E', secondary: '#111111' },
  { label: 'Teal / navy', primary: '#006D77', secondary: '#0C2340' },
  { label: 'Naranja / violeta', primary: '#E56020', secondary: '#1D1160' },
]

function emptyValues(): TeamFormValues {
  return {
    name: '',
    city: '',
    abbreviation: '',
    conference: 'East',
    coach: '',
    founded: '2000',
    arena: '',
    primaryColor: '#1D4ED8',
    secondaryColor: '#C8102E',
  }
}

export function TeamFormModal({ open, onClose, team }: TeamFormModalProps) {
  const { createTeam, updateTeam } = useLeague()
  const { notify } = useToast()
  const [values, setValues] = useState<TeamFormValues>(emptyValues)
  const [errors, setErrors] = useState<Partial<Record<keyof TeamFormValues, string>>>({})
  const [formError, setFormError] = useState('')
  const isEditing = Boolean(team)

  useEffect(() => {
    if (!open) return
    setErrors({})
    setFormError('')
    if (team) {
      setValues({
        name: team.name,
        city: team.city,
        abbreviation: team.abbreviation,
        conference: team.conference,
        coach: team.coach,
        founded: String(team.founded),
        arena: team.arena,
        primaryColor: team.colors.primary,
        secondaryColor: team.colors.secondary,
      })
    } else {
      setValues(emptyValues())
    }
  }, [open, team])

  const update = <K extends keyof TeamFormValues>(key: K, value: TeamFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
    setFormError('')
  }

  const validate = (): boolean => {
    const next: Partial<Record<keyof TeamFormValues, string>> = {}
    if (!values.name.trim()) next.name = 'El nombre del equipo es obligatorio.'
    if (!values.city.trim()) next.city = 'La ciudad es obligatoria.'
    if (!/^[A-Za-zÁÉÍÓÚÑáéíóúñ]{2,4}$/.test(values.abbreviation.trim())) {
      next.abbreviation = 'Usa entre 2 y 4 letras, sin números ni espacios.'
    }
    if (!values.coach.trim()) next.coach = 'El entrenador es obligatorio.'
    const year = Number(values.founded)
    const currentYear = new Date().getFullYear()
    if (!Number.isInteger(year) || year < 1900 || year > currentYear) {
      next.founded = `Ingresa un año entre 1900 y ${currentYear}.`
    }
    if (!values.arena.trim()) next.arena = 'El pabellón es obligatorio.'
    if (!/^#[0-9a-fA-F]{6}$/.test(values.primaryColor)) next.primaryColor = 'Color hexadecimal inválido.'
    if (!/^#[0-9a-fA-F]{6}$/.test(values.secondaryColor)) next.secondaryColor = 'Color hexadecimal inválido.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!validate()) return
    try {
      if (team) {
        updateTeam(team.id, values)
        notify('Equipo actualizado', { message: `${values.city} ${values.name} se guardó correctamente.` })
      } else {
        createTeam(values)
        notify('Equipo registrado', { message: `${values.city} ${values.name} ya forma parte de la liga.` })
      }
      onClose()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'No se pudo guardar el equipo.')
    }
  }

  const previewTeam = {
    name: `${values.city} ${values.name}`.trim() || 'Nuevo equipo',
    abbreviation: values.abbreviation.trim().toUpperCase() || 'NEW',
    colors: { primary: values.primaryColor, secondary: values.secondaryColor },
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Editar equipo' : 'Registrar equipo'}
      subtitle={isEditing ? 'Actualiza la identidad y la información del equipo.' : 'Añade una nueva franquicia a la liga.'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button size="sm" type="submit" form="team-form" icon={<Save className="h-4 w-4" />}>
            {isEditing ? 'Guardar cambios' : 'Registrar equipo'}
          </Button>
        </>
      }
    >
      <form id="team-form" onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="flex items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          <TeamLogo team={previewTeam} size={54} />
          <div className="min-w-0">
            <p className="font-display text-xl font-bold uppercase leading-tight tracking-wide text-white">
              {previewTeam.name}
            </p>
            <p className="mt-0.5 text-xs text-mist-400">
              {values.abbreviation || 'ABR'} · Conferencia {values.conference === 'East' ? 'Este' : 'Oeste'}
            </p>
          </div>
          <Shield className="ml-auto hidden h-5 w-5 text-mist-600 sm:block" />
        </div>

        {formError ? (
          <div className="rounded-lg border border-league-red/30 bg-league-red/10 px-3 py-2 text-xs text-league-redSoft">
            {formError}
          </div>
        ) : null}

        <FormSection title="Identidad" description="Nombre, ciudad y abreviaturas que verá el público.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre del equipo" htmlFor="team-name" required error={errors.name}>
              <Input
                id="team-name"
                value={values.name}
                onChange={(event) => update('name', event.target.value)}
                placeholder="Ej. Empires"
                error={Boolean(errors.name)}
              />
            </Field>
            <Field label="Ciudad" htmlFor="team-city" required error={errors.city}>
              <Input
                id="team-city"
                value={values.city}
                onChange={(event) => update('city', event.target.value)}
                placeholder="Ej. New York"
                error={Boolean(errors.city)}
              />
            </Field>
            <Field
              label="Abreviatura"
              htmlFor="team-abbr"
              required
              error={errors.abbreviation}
              hint="Se usa en escudos y tablas. Máximo 4 letras."
            >
              <Input
                id="team-abbr"
                value={values.abbreviation}
                onChange={(event) => update('abbreviation', event.target.value.toUpperCase())}
                placeholder="NYE"
                maxLength={4}
                error={Boolean(errors.abbreviation)}
                className="uppercase"
              />
            </Field>
            <Field label="Conferencia" htmlFor="team-conf" required>
              <Select
                id="team-conf"
                value={values.conference}
                onChange={(event) => update('conference', event.target.value as Conference)}
              >
                <option value="East">Este</option>
                <option value="West">Oeste</option>
              </Select>
            </Field>
          </div>
        </FormSection>

        <FormSection title="Organización" description="Cuerpo técnico, historia y sede.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Entrenador principal" htmlFor="team-coach" required error={errors.coach}>
              <Input
                id="team-coach"
                value={values.coach}
                onChange={(event) => update('coach', event.target.value)}
                placeholder="Nombre del entrenador"
                error={Boolean(errors.coach)}
              />
            </Field>
            <Field label="Año de fundación" htmlFor="team-founded" required error={errors.founded}>
              <Input
                id="team-founded"
                type="number"
                min={1900}
                max={new Date().getFullYear()}
                value={values.founded}
                onChange={(event) => update('founded', event.target.value)}
                error={Boolean(errors.founded)}
              />
            </Field>
            <Field label="Pabellón" htmlFor="team-arena" required error={errors.arena} className="sm:col-span-2">
              <Input
                id="team-arena"
                value={values.arena}
                onChange={(event) => update('arena', event.target.value)}
                placeholder="Ej. Empire Arena"
                error={Boolean(errors.arena)}
              />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Colores" description="Se utilizan en el escudo, los gráficos y las tarjetas.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Color primario" htmlFor="team-color-primary" error={errors.primaryColor}>
              <div className="flex gap-2">
                <input
                  id="team-color-primary"
                  type="color"
                  value={values.primaryColor}
                  onChange={(event) => update('primaryColor', event.target.value)}
                  className="h-10 w-14 shrink-0 rounded-lg border border-white/10 bg-ink-900"
                  aria-label="Color primario"
                />
                <Input
                  value={values.primaryColor}
                  onChange={(event) => update('primaryColor', event.target.value)}
                  maxLength={7}
                  error={Boolean(errors.primaryColor)}
                />
              </div>
            </Field>
            <Field label="Color secundario" htmlFor="team-color-secondary" error={errors.secondaryColor}>
              <div className="flex gap-2">
                <input
                  id="team-color-secondary"
                  type="color"
                  value={values.secondaryColor}
                  onChange={(event) => update('secondaryColor', event.target.value)}
                  className="h-10 w-14 shrink-0 rounded-lg border border-white/10 bg-ink-900"
                  aria-label="Color secundario"
                />
                <Input
                  value={values.secondaryColor}
                  onChange={(event) => update('secondaryColor', event.target.value)}
                  maxLength={7}
                  error={Boolean(errors.secondaryColor)}
                />
              </div>
            </Field>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  update('primaryColor', preset.primary)
                  update('secondaryColor', preset.secondary)
                }}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[10px] font-medium text-mist-300 transition hover:border-white/20 hover:text-white"
              >
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: preset.primary }} />
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: preset.secondary }} />
                {preset.label}
              </button>
            ))}
          </div>
        </FormSection>
      </form>
    </Modal>
  )
}
