import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Pencil,
  Plus,
  Shield,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react'
import { useLeague } from '../store/LeagueContext'
import type { Conference, Team } from '../types'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { TeamLogo } from '../components/ui/TeamLogo'
import { Badge } from '../components/ui/Badge'
import { SearchInput, Tabs } from '../components/ui/SearchInput'
import { Select } from '../components/ui/Field'
import { EmptyState } from '../components/ui/EmptyState'
import { TeamFormModal } from '../components/teams/TeamFormModal'
import { TeamDeleteDialog } from '../components/dialogs/DeleteDialogs'
import { buildStandings } from '../lib/stats'
import { formatDecimal, formatNumber, formatPct, formatSigned, normalizeSearch, teamFullName } from '../lib/format'

type SortMode = 'name' | 'wins' | 'diff' | 'points' | 'players'

export function Teams() {
  const { db, activeSeason } = useLeague()
  const [search, setSearch] = useState('')
  const [conference, setConference] = useState<Conference | 'all'>('all')
  const [sort, setSort] = useState<SortMode>('wins')
  const [formOpen, setFormOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null)

  const standings = useMemo(
    () => buildStandings(db.teams, db.games, activeSeason.id),
    [activeSeason.id, db.games, db.teams],
  )

  const playersByTeam = useMemo(() => {
    const map = new Map<string, number>()
    for (const player of db.players) {
      map.set(player.teamId, (map.get(player.teamId) ?? 0) + 1)
    }
    return map
  }, [db.players])

  const records = useMemo(() => {
    const map = new Map(standings.map((record) => [record.team.id, record]))
    const term = normalizeSearch(search.trim())
    let list = db.teams.filter((team) => {
      if (conference !== 'all' && team.conference !== conference) return false
      if (!term) return true
      const haystack = normalizeSearch(
        `${team.city} ${team.name} ${team.abbreviation} ${team.coach} ${team.arena}`,
      )
      return haystack.includes(term)
    })
    list = [...list].sort((a, b) => {
      const recA = map.get(a.id)
      const recB = map.get(b.id)
      switch (sort) {
        case 'name':
          return teamFullName(a).localeCompare(teamFullName(b))
        case 'diff':
          return (recB?.diff ?? 0) - (recA?.diff ?? 0)
        case 'points':
          return (recB?.pointsFor ?? 0) - (recA?.pointsFor ?? 0)
        case 'players':
          return (playersByTeam.get(b.id) ?? 0) - (playersByTeam.get(a.id) ?? 0)
        default:
          return (
            (recB?.winPct ?? 0) - (recA?.winPct ?? 0) ||
            (recB?.diff ?? 0) - (recA?.diff ?? 0)
          )
      }
    })
    return list.map((team) => ({ team, record: map.get(team.id) }))
  }, [conference, db.teams, playersByTeam, search, sort, standings])

  const eastCount = db.teams.filter((team) => team.conference === 'East').length
  const westCount = db.teams.filter((team) => team.conference === 'West').length

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Franquicias"
        title="Equipos"
        description={`${db.teams.length} equipos registrados en la temporada ${activeSeason.name}. Consulta plantillas, cuerpo técnico y estadísticas.`}
        actions={
          <Button
            onClick={() => {
              setEditingTeam(null)
              setFormOpen(true)
            }}
            icon={<Plus className="h-4 w-4" />}
          >
            Nuevo equipo
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2 text-[11px] text-mist-400">
        <Badge tone="blue">{eastCount} Conferencia Este</Badge>
        <Badge tone="red">{westCount} Conferencia Oeste</Badge>
        <span className="hidden h-3 w-px bg-white/10 sm:block" />
        <span className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" /> {db.players.length} jugadores en total
        </span>
      </div>

      <Card padded={false} className="mb-5 p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por equipo, ciudad, entrenador o pabellón…"
            className="w-full lg:max-w-md"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Tabs
              options={[
                { value: 'all', label: 'Todos', count: db.teams.length },
                { value: 'East', label: 'Este', count: eastCount },
                { value: 'West', label: 'Oeste', count: westCount },
              ]}
              value={conference}
              onChange={(value) => setConference(value as Conference | 'all')}
              size="sm"
            />
            <Select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortMode)}
              className="h-9 w-auto min-w-40 text-xs"
              aria-label="Ordenar equipos"
            >
              <option value="wins">Mejor porcentaje</option>
              <option value="diff">Diferencia de puntos</option>
              <option value="points">Puntos anotados</option>
              <option value="name">Nombre A–Z</option>
              <option value="players">Más jugadores</option>
            </Select>
          </div>
        </div>
      </Card>

      {records.length === 0 ? (
        <EmptyState
          title={db.teams.length === 0 ? 'Todavía no hay equipos' : 'Sin resultados'}
          description={
            db.teams.length === 0
              ? 'Registra la primera franquicia de la liga para comenzar a construir plantillas y calendario.'
              : 'No hay equipos que coincidan con la búsqueda o el filtro seleccionado.'
          }
          icon={<Shield className="h-5 w-5" />}
          action={
            db.teams.length === 0 ? (
              <Button onClick={() => setFormOpen(true)} icon={<Plus className="h-4 w-4" />}>
                Registrar primer equipo
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch('')
                  setConference('all')
                }}
              >
                Limpiar filtros
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {records.map(({ team, record }) => {
            const playerCount = playersByTeam.get(team.id) ?? 0
            return (
              <Card key={team.id} padded={false} hover className="group relative overflow-hidden">
                <div
                  className="h-1.5 w-full"
                  style={{
                    background: `linear-gradient(90deg, ${team.colors.primary}, ${team.colors.secondary})`,
                  }}
                />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <TeamLogo team={team} size={52} />
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mist-500">
                          {team.conference === 'East' ? 'Conferencia Este' : 'Conferencia Oeste'}
                        </p>
                        <Link to={`/teams/${team.id}`} className="block">
                          <h2 className="truncate font-display text-2xl font-bold uppercase leading-tight tracking-wide text-white group-hover:text-league-redSoft">
                            {team.city}
                          </h2>
                          <p className="truncate font-display text-lg font-semibold uppercase leading-none tracking-wider text-mist-300">
                            {team.name}
                          </p>
                        </Link>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTeam(team)
                          setFormOpen(true)
                        }}
                        className="rounded-md p-1.5 text-mist-500 transition hover:bg-white/[0.06] hover:text-white"
                        aria-label={`Editar ${teamFullName(team)}`}
                        title="Editar equipo"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingTeam(team)}
                        className="rounded-md p-1.5 text-mist-500 transition hover:bg-league-red/10 hover:text-league-redSoft"
                        aria-label={`Eliminar ${teamFullName(team)}`}
                        title="Eliminar equipo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1.5 text-[11px] text-mist-400">
                    <p className="flex items-center gap-2 truncate">
                      <UserRound className="h-3.5 w-3.5 shrink-0 text-mist-500" /> {team.coach}
                    </p>
                    <p className="flex items-center gap-2 truncate">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-mist-500" /> {team.arena}
                    </p>
                    <p className="flex items-center gap-2">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0 text-mist-500" /> Fundado en {team.founded}
                      <span className="ml-auto flex items-center gap-1 font-semibold text-mist-300">
                        <Users className="h-3.5 w-3.5" /> {playerCount}
                      </span>
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-4 gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5 text-center">
                    {[
                      { label: 'PJ', value: record?.played ?? 0 },
                      { label: 'V', value: record?.wins ?? 0, tone: 'text-emerald-300' },
                      { label: 'D', value: record?.losses ?? 0, tone: 'text-league-redSoft' },
                      { label: '%', value: formatPct(record?.winPct ?? 0).replace('%', '') },
                    ].map((item) => (
                      <div key={item.label}>
                        <p className={`font-display text-lg font-bold leading-none ${item.tone ?? 'text-white'}`}>
                          {item.value}
                        </p>
                        <p className="mt-0.5 text-[8px] font-bold uppercase tracking-widest text-mist-500">{item.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-2 flex items-center justify-between rounded-lg border border-white/[0.05] px-2.5 py-2 text-[10px] text-mist-400">
                    <span>
                      PF <span className="font-semibold text-white">{formatNumber(record?.pointsFor ?? 0)}</span>
                    </span>
                    <span>
                      PC <span className="font-semibold text-white">{formatNumber(record?.pointsAgainst ?? 0)}</span>
                    </span>
                    <span>
                      DIF{' '}
                      <span
                        className={`font-semibold ${
                          (record?.diff ?? 0) >= 0 ? 'text-emerald-300' : 'text-league-redSoft'
                        }`}
                      >
                        {formatSigned(record?.diff ?? 0)}
                      </span>
                    </span>
                    <span className="hidden text-mist-500 sm:inline">{formatDecimal(record?.ppg ?? 0, 1)} PPP</span>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <Link
                      to={`/teams/${team.id}`}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-mist-200 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
                    >
                      Ver plantilla <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <TeamFormModal open={formOpen} onClose={() => setFormOpen(false)} team={editingTeam} />
      <TeamDeleteDialog
        open={Boolean(deletingTeam)}
        onClose={() => setDeletingTeam(null)}
        team={deletingTeam}
        onDeleted={() => setDeletingTeam(null)}
      />
    </div>
  )
}
