import type { Conference, Player, Position, Team } from '../types'

export const CONFERENCE_LABEL: Record<Conference, string> = {
  East: 'Este',
  West: 'Oeste',
}

export const POSITION_LABEL: Record<Position, string> = {
  PG: 'Base',
  SG: 'Escolta',
  SF: 'Alero',
  PF: 'Ala-pívot',
  C: 'Pívot',
}

export const POSITION_ORDER: Record<Position, number> = {
  PG: 0,
  SG: 1,
  SF: 2,
  PF: 3,
  C: 4,
}

export const POSITIONS: Position[] = ['PG', 'SG', 'SF', 'PF', 'C']

export function fullName(player: Pick<Player, 'firstName' | 'lastName'>): string {
  return `${player.firstName} ${player.lastName}`
}

export function teamFullName(team: Pick<Team, 'city' | 'name'>): string {
  return `${team.city} ${team.name}`
}

export function initials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
}

export function ageFromBirthDate(birthDate: string, reference = new Date()): number {
  const birth = new Date(`${birthDate}T12:00:00`)
  if (Number.isNaN(birth.getTime())) return 0
  let age = reference.getFullYear() - birth.getFullYear()
  const month = reference.getMonth() - birth.getMonth()
  if (month < 0 || (month === 0 && reference.getDate() < birth.getDate())) age -= 1
  return Math.max(0, age)
}

export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

export function formatDecimal(value: number, decimals = 1): string {
  return value.toFixed(decimals).replace('.', ',')
}

export function formatSigned(value: number): string {
  return `${value > 0 ? '+' : ''}${formatNumber(value)}`
}

export function formatHeight(cm: number): string {
  const totalInches = cm / 2.54
  const feet = Math.floor(totalInches / 12)
  const inches = Math.round(totalInches % 12)
  return `${cm} cm · ${feet}'${inches}"`
}

export function parseLocalDate(dateStr: string): Date {
  return new Date(dateStr.length <= 10 ? `${dateStr}T12:00:00` : dateStr)
}

export function formatDate(dateStr: string, opts?: Intl.DateTimeFormatOptions): string {
  const date = parseLocalDate(dateStr)
  return new Intl.DateTimeFormat('es-ES', opts ?? { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

export function formatShortDate(dateStr: string): string {
  return formatDate(dateStr, { day: '2-digit', month: 'short' })
}

export function formatLongDate(dateStr: string): string {
  return formatDate(dateStr, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export function formatTime(dateStr: string): string {
  if (dateStr.length <= 10) return '19:30'
  return new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr))
}

export function formatDateTime(dateStr: string): string {
  return `${formatDate(dateStr, { day: '2-digit', month: 'short', year: 'numeric' })} · ${formatTime(dateStr)}`
}

export function toDateTimeInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function streakLabel(streak: Array<'W' | 'L'>): string {
  if (streak.length === 0) return '—'
  const first = streak[0]
  let count = 0
  for (const item of streak) {
    if (item === first) count += 1
    else break
  }
  return `${first === 'W' ? 'V' : 'D'}${count}`
}

export function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function titleCase(value: string): string {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function normalizeSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}
