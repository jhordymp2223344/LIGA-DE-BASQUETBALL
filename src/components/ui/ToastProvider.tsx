import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { makeId } from '../../lib/id'

type ToastVariant = 'success' | 'error' | 'info'

interface ToastItem {
  id: string
  title: string
  message?: string
  variant: ToastVariant
}

interface ToastContextValue {
  notify: (title: string, options?: { message?: string; variant?: ToastVariant }) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const notify = useCallback<ToastContextValue['notify']>(
    (title, options) => {
      const id = makeId('toast')
      const item: ToastItem = {
        id,
        title,
        message: options?.message,
        variant: options?.variant ?? 'success',
      }
      setToasts((current) => [...current.slice(-3), item])
      const timer = setTimeout(() => dismiss(id), 4600)
      timers.current.set(id, timer)
    },
    [dismiss],
  )

  useEffect(() => {
    const map = timers.current
    return () => {
      map.forEach((timer) => clearTimeout(timer))
      map.clear()
    }
  }, [])

  const icons: Record<ToastVariant, ReactNode> = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-400" />,
    error: <AlertTriangle className="h-5 w-5 text-league-redSoft" />,
    info: <Info className="h-5 w-5 text-league-blueSoft" />,
  }

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[120] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex w-full max-w-sm animate-slide-in items-start gap-3 rounded-xl border border-white/10 bg-ink-750/95 p-4 shadow-lift backdrop-blur-md"
          >
            <div className="mt-0.5 shrink-0">{icons[toast.variant]}</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">{toast.title}</p>
              {toast.message ? (
                <p className="mt-0.5 text-xs leading-relaxed text-mist-400">{toast.message}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="rounded-md p-1 text-mist-500 transition hover:bg-white/5 hover:text-white"
              aria-label="Cerrar notificación"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast debe usarse dentro de ToastProvider')
  return context
}
