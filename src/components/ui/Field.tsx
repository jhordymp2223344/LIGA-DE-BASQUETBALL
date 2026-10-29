import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { AlertCircle } from 'lucide-react'

export const inputClass =
  'h-10 w-full rounded-lg border border-white/10 bg-ink-900/80 px-3 text-sm text-white placeholder:text-mist-500 transition focus:border-league-red/60 focus:outline-none focus:ring-2 focus:ring-league-red/20 disabled:cursor-not-allowed disabled:opacity-60'

const textareaClass =
  'min-h-24 w-full rounded-lg border border-white/10 bg-ink-900/80 px-3 py-2 text-sm text-white placeholder:text-mist-500 transition focus:border-league-red/60 focus:outline-none focus:ring-2 focus:ring-league-red/20'

interface FieldProps {
  label: string
  htmlFor?: string
  required?: boolean
  error?: string
  hint?: string
  children: ReactNode
  className?: string
}

export function Field({ label, htmlFor, required, error, hint, children, className = '' }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-mist-300">
        {label}
        {required ? <span className="ml-1 text-league-redSoft">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-league-redSoft">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-[11px] leading-relaxed text-mist-500">{hint}</p>
      ) : null}
    </div>
  )
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export function Input({ error, className = '', ...rest }: InputProps) {
  return (
    <input
      className={`${inputClass} ${error ? 'border-league-red/70 focus:border-league-red' : ''} ${className}`}
      aria-invalid={error || undefined}
      {...rest}
    />
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
}

export function Select({ error, className = '', children, ...rest }: SelectProps) {
  return (
    <select
      className={`${inputClass} appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238e9db5' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")] bg-[right_0.75rem_center] bg-no-repeat pr-9 ${error ? 'border-league-red/70' : ''} ${className}`}
      {...rest}
    >
      {children}
    </select>
  )
}

export function Textarea({ className = '', ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${textareaClass} ${className}`} {...rest} />
}

interface FormSectionProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function FormSection({ title, description, children, className = '' }: FormSectionProps) {
  return (
    <fieldset className={className}>
      <legend className="mb-3 w-full border-b border-white/[0.07] pb-2">
        <span className="font-display text-sm font-bold uppercase tracking-[0.12em] text-white">{title}</span>
        {description ? <span className="mt-0.5 block text-[11px] text-mist-500">{description}</span> : null}
      </legend>
      {children}
    </fieldset>
  )
}
