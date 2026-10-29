import { useMemo } from 'react'
import { AlertTriangle, Trash2, Users } from 'lucide-react'
import type { Player, Team } from '../../types'
import { useLeague } from '../../store/LeagueContext'
import { useToast } from '../ui/ToastProvider'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { teamFullName } from '../../lib/format'

interface TeamDeleteDialogProps {
  open: boolean
  onClose: () => void
  team: Team | null
  onDeleted?: () => void
}

export function TeamDeleteDialog({ open, onClose, team, onDeleted }: TeamDeleteDialogProps) {
  const { db, deleteTeam } = useLeague()
  const { notify } = useToast()

  const playerCount = useMemo(
    () => (team ? db.players.filter((player) => player.teamId === team.id).length : 0),
    [db.players, team],
  )
  const gameCount = useMemo(
    () =>
      team
        ? db.games.filter((game) => game.homeTeamId === team.id || game.awayTeamId === team.id).length
        : 0,
    [db.games, team],
  )

  if (!team) return null

  const handleDelete = () => {
    const result = deleteTeam(team.id)
    notify('Equipo eliminado', {
      message: `${teamFullName(team)} y ${result.deletedPlayers} jugadores fueron eliminados. Se quitaron ${result.deletedGames} partidos del calendario.`,
      variant: 'success',
    })
    onClose()
    onDeleted?.()
  }

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={handleDelete}
      title="Eliminar equipo"
      description={`¿Seguro que deseas eliminar a ${teamFullName(team)}? Esta acción no se puede deshacer.`}
      confirmLabel="Eliminar equipo"
      details={
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-ink-900/60 px-3 py-2">
            <span className="flex items-center gap-2 text-xs text-mist-300">
              <Users className="h-4 w-4 text-league-redSoft" /> Jugadores en plantilla
            </span>
            <span className="font-display text-lg font-bold text-white">{playerCount}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-ink-900/60 px-3 py-2">
            <span className="flex items-center gap-2 text-xs text-mist-300">
              <Trash2 className="h-4 w-4 text-league-redSoft" /> Partidos vinculados
            </span>
            <span className="font-display text-lg font-bold text-white">{gameCount}</span>
          </div>
          {(playerCount > 0 || gameCount > 0) && (
            <div className="flex items-start gap-2 rounded-lg border border-league-red/25 bg-league-red/[0.08] px-3 py-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-league-redSoft" />
              <p className="text-[11px] leading-relaxed text-mist-300">
                Se eliminarán en cascada los jugadores, sus estadísticas y todos los partidos del equipo para conservar
                la integridad de la base de datos.
              </p>
            </div>
          )}
        </div>
      }
    />
  )
}

interface PlayerDeleteDialogProps {
  open: boolean
  onClose: () => void
  player: Player | null
  onDeleted?: (info: { name: string; statsRemoved: number }) => void
}

export function PlayerDeleteDialog({ open, onClose, player, onDeleted }: PlayerDeleteDialogProps) {
  const { db, seasons, deletePlayer } = useLeague()
  const { notify } = useToast()

  const team = player ? db.teams.find((item) => item.id === player.teamId) : undefined
  const stats = player ? db.playerStats.filter((stat) => stat.playerId === player.id) : []

  if (!player) return null
  const fullName = `${player.firstName} ${player.lastName}`

  const handleDelete = () => {
    const removedStats = deletePlayer(player.id)
    notify('Jugador eliminado', {
      message: `${fullName} fue eliminado junto con ${removedStats} registro(s) de estadísticas. La tabla se actualizó.`,
      variant: 'success',
    })
    onClose()
    onDeleted?.({ name: fullName, statsRemoved: removedStats })
  }

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={handleDelete}
      title="Eliminar jugador"
      description={`¿Seguro que deseas eliminar a ${fullName}? Esta acción no se puede deshacer.`}
      confirmLabel="Eliminar jugador"
      details={
        <div className="space-y-2">
          <div className="rounded-lg border border-white/10 bg-ink-900/60 px-3 py-2 text-xs">
            <p className="font-semibold text-white">{fullName}</p>
            <p className="mt-0.5 text-mist-400">
              {team ? teamFullName(team) : 'Sin equipo'} · Dorsal #{player.jerseyNumber} · {player.position}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-ink-900/60 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-mist-400">
              {stats.length} registro(s) de estadísticas vinculados
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-mist-400">
              {stats.length > 0
                ? `Se eliminarán los totales de ${stats
                    .map((stat) => seasons.find((season) => season.id === stat.seasonId)?.name)
                    .filter(Boolean)
                    .join(', ')}. Ningún otro jugador se verá afectado.`
                : 'No hay estadísticas vinculadas a este jugador.'}
            </p>
          </div>
          <p className="flex items-start gap-2 rounded-lg border border-league-red/20 bg-league-red/[0.06] px-3 py-2 text-[11px] leading-relaxed text-mist-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-league-redSoft" />
            La eliminación es permanente dentro de este navegador.
          </p>
        </div>
      }
    />
  )
}
