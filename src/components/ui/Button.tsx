import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'gold'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

export function buttonStyles(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  fullWidth = false,
): string {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg font-semibold tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-league-red/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 disabled:pointer-events-none disabled:opacity-50'
  const variants: Record<ButtonVariant, string> = {
    primary:
      'bg-league-red text-white shadow-[0_10px_25px_-12px_rgba(225,29,46,0.9)] hover:bg-league-redDark active:translate-y-px',
    secondary:
      'border border-white/10 bg-white/[0.06] text-white hover:border-white/20 hover:bg-white/[0.1] active:translate-y-px',
    danger:
      'bg-league-redDark text-white hover:bg-league-red active:translate-y-px shadow-[0_10px_25px_-12px_rgba(225,29,46,0.8)]',
    ghost: 'text-mist-300 hover:bg-white/[0.07] hover:text-white',
    outline:
      'border border-league-red/50 bg-transparent text-league-redSoft hover:border-league-red hover:bg-league-red/10',
    gold: 'bg-league-gold text-ink-950 hover:bg-[#ffc94d] active:translate-y-px',
  }
  const sizes: Record<ButtonSize, string> = {
    xs: 'h-8 px-2.5 text-[11px] uppercase',
    sm: 'h-9 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-5 text-sm uppercase',
  }
  return [base, variants[variant], sizes[size], fullWidth ? 'w-full' : ''].join(' ')
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  loading?: boolean
  icon?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', fullWidth, loading, icon, className = '', children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`${buttonStyles(variant, size, fullWidth)} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  )
})
