import { useMemo, useRef, useState, type DragEvent, type ReactNode } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  CloudOff,
  Database,
  Download,
  FileJson,
  HardDrive,
  Layers,
  Link2,
  ListOrdered,
  Lock,
  RefreshCw,
  RotateCcw,
  Server,
  Shield,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
} from 'lucide-react'
import { useLeague } from '../store/LeagueContext'
import type { LeagueDB } from '../types'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, SectionTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { StatTile } from '../components/ui/StatTile'
import { useToast } from '../components/ui/ToastProvider'
import {
  STORAGE_KEY,
  canUseStorage,
  formatStorageSize,
  parseImportedDB,
} from '../lib/storage'
import { formatDateTime, formatNumber, pluralize } from '../lib/format'

const STORAGE_BUDGET_BYTES = 5 * 1024 * 1024
const MAX_IMPORT_BYTES = 5 * 1024 * 1024

interface PendingImport {
  db: LeagueDB
  fileName: string
}

function downloadBackup(db: LeagueDB) {
  const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `usblm-respaldo-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function DataCount({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string | number
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2.5">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-mist-300">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-mist-500">{label}</p>
        <p className="font-display text-lg font-bold leading-tight text-white">{value}</p>
      </div>
    </div>
  )
}

function RelationRow({
  from,
  relation,
  to,
  detail,
}: {
  from: string
  relation: string
  to: string
  detail: string
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-white/[0.05] py-2.5 text-[11px] last:border-b-0">
      <code className="rounded bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10px] text-mist-200">{from}</code>
      <ArrowRight className="h-3 w-3 text-mist-600" />
      <span className="font-semibold text-mist-300">{relation}</span>
      <ArrowRight className="h-3 w-3 text-mist-600" />
      <code className="rounded bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10px] text-mist-200">{to}</code>
      <span className="w-full text-[10px] leading-relaxed text-mist-500 sm:ml-auto sm:w-auto">{detail}</span>
    </div>
  )
}

export function Data() {
  const { db, activeSeason, seasons, replaceDatabase, resetDemoData, toastStorageIssue } = useLeague()
  const { notify } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null)
  const [importError, setImportError] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [reading, setReading] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)

  const storageAvailable = useMemo(() => canUseStorage(), [])
  const storageSize = useMemo(() => new Blob([JSON.stringify(db)]).size, [db])
  const storageSizeLabel = useMemo(() => formatStorageSize(db), [db])
  const usagePct = Math.min(100, (storageSize / STORAGE_BUDGET_BYTES) * 100)
  const finalGames = db.games.filter((game) => game.status === 'final').length
  const scheduledGames = db.games.length - finalGames

  const handleFile = async (file: File) => {
    setImportError('')
    if (!file.name.toLowerCase().endsWith('.json') && file.type !== 'application/json') {
      setImportError('Selecciona un archivo con extensión .json exportado por esta aplicación.')
      return
    }
    if (file.size > MAX_IMPORT_BYTES) {
      setImportError(
        `El archivo pesa ${(file.size / (1024 * 1024)).toFixed(2)} MB y supera el máximo de 5 MB.`,
      )
      return
    }
    setReading(true)
    try {
      const raw = await file.text()
      const result = parseImportedDB(raw)
      if (!result.db) {
        setImportError(result.error ?? 'El archivo no contiene un respaldo válido.')
        return
      }
      setPendingImport({ db: result.db, fileName: file.name })
    } catch {
      setImportError('No se pudo leer el archivo. Comprueba que sea accesible e inténtalo de nuevo.')
    } finally {
      setReading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragActive(false)
    const file = event.dataTransfer.files?.[0]
    if (file) void handleFile(file)
  }

  const confirmImport = () => {
    if (!pendingImport) return
    replaceDatabase(pendingImport.db)
    notify('Respaldo importado', {
      message: `${pendingImport.fileName} reemplazó los datos anteriores. Los cambios ya están guardados en este navegador.`,
    })
    setPendingImport(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const confirmReset = () => {
    resetDemoData()
    setResetOpen(false)
    notify('Datos de demostración restaurados', {
      message: 'La liga volvió a su estado inicial con 12 equipos y dos temporadas.',
    })
  }

  return (
    <div className="animate-fade-up">
      <PageHeader
        eyebrow="Administración"
        title="Datos y respaldo"
        description="Todo el contenido de la liga vive en este navegador. Exporta una copia antes de limpiar el almacenamiento o cambiar de dispositivo, e importa un respaldo validado para restaurar la liga completa."
        actions={
          <>
            <Button variant="secondary" onClick={() => downloadBackup(db)} icon={<Download className="h-4 w-4" />}>
              Exportar respaldo
            </Button>
            <Badge tone="gold" dot>
              Solo navegador
            </Badge>
          </>
        }
      />

      <section className="relative mb-5 overflow-hidden rounded-2xl border border-white/[0.08] bg-hero-glow p-5 shadow-panel sm:p-6">
        <div className="court-lines absolute inset-0 opacity-60" aria-hidden="true" />
        <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-px w-6 bg-league-red" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-league-redSoft">
                Persistencia local · sin servidor
              </span>
            </div>
            <h2 className="font-display text-3xl font-extrabold uppercase leading-none tracking-tight text-white sm:text-4xl">
              Tu liga, bajo tu control.
            </h2>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-mist-300">
              La aplicación guarda automáticamente cada cambio en <code className="text-mist-100">localStorage</code>.
              No hay una base de datos remota ni cuentas de usuario: el respaldo JSON es el mecanismo para mover la liga
              entre navegadores o conservarla a salvo.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[10px] font-semibold ${
                  storageAvailable
                    ? 'border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-300'
                    : 'border-league-red/30 bg-league-red/[0.08] text-league-redSoft'
                }`}
              >
                {storageAvailable ? <CheckCircle2 className="h-3.5 w-3.5" /> : <CloudOff className="h-3.5 w-3.5" />}
                {storageAvailable ? 'Almacenamiento disponible' : 'Almacenamiento no disponible'}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-ink-950/50 px-3 py-2 text-[10px] text-mist-300">
                <Clock className="h-3.5 w-3.5 text-mist-500" />
                Actualizado: {formatDateTime(db.updatedAt)}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-ink-950/55 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-mist-500">Espacio utilizado</p>
                <p className="mt-1 font-display text-3xl font-extrabold leading-none text-white">{storageSizeLabel}</p>
              </div>
              <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 font-mono text-[10px] text-mist-400">
                {STORAGE_KEY}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.07]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  usagePct > 85 ? 'bg-league-red' : usagePct > 60 ? 'bg-league-gold' : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.max(2, usagePct)}%` }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-mist-500">
              <span>{usagePct.toFixed(1)}% de ~5 MB típicos</span>
              <span>por navegador y perfil</span>
            </div>
            {toastStorageIssue || !storageAvailable ? (
              <p className="mt-3 flex items-start gap-2 rounded-lg border border-league-red/25 bg-league-red/[0.08] px-2.5 py-2 text-[10px] leading-relaxed text-league-redSoft">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Los cambios no se están guardando. Revisa el modo privado, los permisos del navegador o el espacio libre.
              </p>
            ) : (
              <p className="mt-3 flex items-start gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.06] px-2.5 py-2 text-[10px] leading-relaxed text-emerald-300">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Guardado automático activo. Exporta un respaldo periódicamente.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Equipos"
          value={db.teams.length}
          icon={<Shield className="h-5 w-5" />}
          hint="Franquicias ficticias de la liga"
          tone="blue"
        />
        <StatTile
          label="Jugadores"
          value={db.players.length}
          icon={<Users className="h-5 w-5" />}
          hint={`${formatNumber(db.playerStats.length)} registros de estadísticas`}
          tone="red"
        />
        <StatTile
          label="Partidos"
          value={db.games.length}
          icon={<CalendarDays className="h-5 w-5" />}
          hint={`${finalGames} finalizados · ${scheduledGames} programados`}
          tone="gold"
        />
        <StatTile
          label="Temporadas"
          value={db.seasons.length}
          icon={<Layers className="h-5 w-5" />}
          hint={`Activa: ${activeSeason.name}`}
          tone="green"
        />
      </section>

      <div className="mb-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle
            title="Exportar respaldo"
            subtitle="Copia completa y legible de toda la liga"
            icon={<Download className="h-4 w-4" />}
          />
          <p className="mt-4 text-xs leading-relaxed text-mist-400">
            Descarga un archivo JSON con equipos, jugadores, estadísticas, partidos y temporadas. Incluye las relaciones
            y la temporada activa, por lo que puede importarse en otro navegador sin pérdida de información.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <DataCount icon={<Shield className="h-4 w-4" />} label="Equipos" value={db.teams.length} />
            <DataCount icon={<Users className="h-4 w-4" />} label="Jugadores" value={db.players.length} />
            <DataCount icon={<ListOrdered className="h-4 w-4" />} label="Estadísticas" value={db.playerStats.length} />
            <DataCount icon={<CalendarDays className="h-4 w-4" />} label="Partidos" value={db.games.length} />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button onClick={() => downloadBackup(db)} icon={<Download className="h-4 w-4" />}>
              Descargar JSON
            </Button>
            <span className="text-[10px] text-mist-500">
              Archivo: usblm-respaldo-AAAA-MM-DD.json
            </span>
          </div>
        </Card>

        <Card>
          <SectionTitle
            title="Importar respaldo"
            subtitle="Restauración con validación de estructura y referencias"
            icon={<Upload className="h-4 w-4" />}
          />
          <div
            onDragOver={(event) => {
              event.preventDefault()
              setDragActive(true)
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed px-5 py-7 text-center transition ${
              dragActive
                ? 'border-league-red/60 bg-league-red/[0.08]'
                : 'border-white/15 bg-white/[0.02] hover:border-white/25'
            }`}
          >
            <span className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-mist-300">
              <FileJson className="h-5 w-5" />
            </span>
            <p className="mt-3 text-xs font-semibold text-white">Arrastra el archivo .json aquí</p>
            <p className="mt-1 text-[10px] leading-relaxed text-mist-500">
              o selecciónalo desde tu equipo. Máximo 5 MB.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void handleFile(file)
              }}
            />
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              loading={reading}
              onClick={() => fileInputRef.current?.click()}
              icon={<Upload className="h-4 w-4" />}
            >
              Seleccionar archivo
            </Button>
          </div>
          {importError ? (
            <p className="mt-3 flex items-start gap-2 rounded-lg border border-league-red/25 bg-league-red/[0.08] px-3 py-2 text-[11px] leading-relaxed text-league-redSoft">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {importError}
            </p>
          ) : (
            <p className="mt-3 text-[10px] leading-relaxed text-mist-500">
              La importación reemplaza todos los datos actuales. Si el archivo tiene referencias rotas o IDs duplicados,
              se rechaza antes de tocar la liga.
            </p>
          )}
        </Card>
      </div>

      <div className="mb-5 grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card>
          <SectionTitle
            title="Modelo de datos"
            subtitle={`Versión ${db.version} · relaciones verificadas al importar`}
            icon={<Link2 className="h-4 w-4" />}
          />
          <div className="mt-3">
            <RelationRow
              from="teams"
              relation="1 → N"
              to="players"
              detail="Cada jugador pertenece a un equipo mediante teamId."
            />
            <RelationRow
              from="players"
              relation="1 → N"
              to="playerStats"
              detail="Totales por jugador y temporada; se eliminan en cascada."
            />
            <RelationRow
              from="seasons"
              relation="1 → N"
              to="playerStats"
              detail="Cada fila de estadísticas apunta a una temporada."
            />
            <RelationRow
              from="seasons"
              relation="1 → N"
              to="games"
              detail="La temporada activa alimenta clasificación y análisis."
            />
            <RelationRow
              from="games"
              relation="N ↔ 1"
              to="teams"
              detail="homeTeamId y awayTeamId deben existir y ser distintos."
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-[10px] text-mist-500">
            <span className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1">
              Clave principal: <code className="text-mist-300">id</code>
            </span>
            <span className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1">
              Temporadas: {seasons.map((season) => season.name).join(' · ')}
            </span>
            <span className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1">
              Integridad: equipos, jugadores, partidos y estadísticas
            </span>
          </div>
        </Card>

        <Card className="border-league-red/25">
          <SectionTitle
            title="Zona de riesgo"
            subtitle="Restablecer la liga de demostración"
            icon={<RotateCcw className="h-4 w-4" />}
          />
          <p className="mt-4 text-xs leading-relaxed text-mist-400">
            Sustituye todo el contenido actual por el conjunto de demostración original: 12 equipos ficticios, 120
            jugadores, dos temporadas y el calendario completo. Esta acción no se puede deshacer.
          </p>
          <ul className="mt-3 space-y-1.5 text-[10px] leading-relaxed text-mist-500">
            <li className="flex items-start gap-2">
              <Trash2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-league-redSoft" />
              Se eliminan los equipos, jugadores y partidos creados por ti.
            </li>
            <li className="flex items-start gap-2">
              <RefreshCw className="mt-0.5 h-3.5 w-3.5 shrink-0 text-league-redSoft" />
              La temporada activa vuelve a ser la del conjunto demo.
            </li>
          </ul>
          <Button variant="danger" className="mt-4" onClick={() => setResetOpen(true)} icon={<RotateCcw className="h-4 w-4" />}>
            Restaurar datos demo
          </Button>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle
            title="Limitaciones del almacenamiento local"
            subtitle="Qué puedes esperar y qué no"
            icon={<Lock className="h-4 w-4" />}
          />
          <ul className="mt-4 space-y-2.5 text-[11px] leading-relaxed text-mist-400">
            <li className="flex gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-league-gold" />
              Los datos pertenecen a este navegador y perfil. Otro equipo, navegador o perfil no los verá.
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-league-gold" />
              El límite típico de <code className="text-mist-200">localStorage</code> ronda los 5 MB. Si se supera, los
              cambios dejarán de guardarse y la interfaz lo advertirá.
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-league-gold" />
              Borrar los datos del sitio, usar modo privado o limpiar el navegador elimina la liga. Mantén un respaldo.
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-league-gold" />
              No hay autenticación, permisos, sincronización ni acceso multiusuario. Es una aplicación de escritorio
              local disfrazada de web.
            </li>
          </ul>
        </Card>

        <Card>
          <SectionTitle
            title="Integración futura"
            subtitle="Preparado para conectar un backend real"
            icon={<Server className="h-4 w-4" />}
          />
          <p className="mt-4 text-xs leading-relaxed text-mist-400">
            El estado de la liga está aislado en <code className="text-mist-200">LeagueContext</code> y el adaptador de
            almacenamiento en <code className="text-mist-200">lib/storage.ts</code>. Ese límite permite sustituir
            <code className="text-mist-200"> localStorage</code> por una API REST, Supabase o cualquier base de datos
            relacional sin reescribir las páginas.
          </p>
          <div className="mt-4 space-y-2 text-[11px] leading-relaxed text-mist-400">
            <p className="flex items-start gap-2">
              <Database className="mt-0.5 h-4 w-4 shrink-0 text-league-blueSoft" />
              Tablas equivalentes: teams, players, player_season_stats, seasons y games.
            </p>
            <p className="flex items-start gap-2">
              <HardDrive className="mt-0.5 h-4 w-4 shrink-0 text-league-blueSoft" />
              El respaldo JSON ya respeta claves primarias y foráneas, por lo que sirve como formato de migración.
            </p>
            <p className="flex items-start gap-2">
              <CloudOff className="mt-0.5 h-4 w-4 shrink-0 text-league-blueSoft" />
              No se simula ninguna conexión remota: esta versión funciona al 100% sin internet.
            </p>
          </div>
          <div className="mt-5 rounded-lg border border-league-gold/20 bg-league-gold/[0.06] px-3 py-2.5 text-[10px] leading-relaxed text-league-gold">
            <span className="font-semibold">Aviso:</span> las cuotas y probabilidades de la sección Favoritos son
            simuladas. No provienen de una casa de apuestas ni de una API deportiva.
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={Boolean(pendingImport)}
        onClose={() => setPendingImport(null)}
        onConfirm={confirmImport}
        title="Reemplazar los datos actuales"
        description={`Vas a importar "${pendingImport?.fileName ?? ''}". Todos los equipos, jugadores, estadísticas, partidos y temporadas actuales se reemplazarán por el contenido del respaldo.`}
        confirmLabel="Importar y reemplazar"
        tone="danger"
        details={
          pendingImport ? (
            <div className="space-y-2 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-[11px] text-mist-300">
              <p className="flex items-center gap-2 font-semibold text-white">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                Archivo validado correctamente
              </p>
              <p>
                {pendingImport.db.teams.length} equipos · {pendingImport.db.players.length} jugadores ·{' '}
                {pendingImport.db.games.length} partidos · {pendingImport.db.seasons.length} temporadas
              </p>
              <p className="text-[10px] text-mist-500">
                Actualizado originalmente: {formatDateTime(pendingImport.db.updatedAt)}
              </p>
              <p className="text-[10px] text-league-gold">
                Recomendación: exporta primero un respaldo de la liga actual.
              </p>
            </div>
          ) : null
        }
      />

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={confirmReset}
        title="Restaurar datos de demostración"
        description="Se borrará el contenido actual de la liga y se cargará el conjunto demo original. Exporta un respaldo antes de continuar si quieres conservar tus cambios."
        confirmLabel="Restaurar demo"
        tone="danger"
        details={
          <p className="rounded-lg border border-league-red/25 bg-league-red/[0.08] px-3 py-2 text-[11px] leading-relaxed text-league-redSoft">
            Esta acción afecta a {db.teams.length} {pluralize(db.teams.length, 'equipo', 'equipos')},{' '}
            {db.players.length} {pluralize(db.players.length, 'jugador', 'jugadores')} y {db.games.length}{' '}
            {pluralize(db.games.length, 'partido', 'partidos')}.
          </p>
        }
      />
    </div>
  )
}
