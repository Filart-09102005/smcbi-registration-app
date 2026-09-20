import { AlertTriangle } from 'lucide-react'
import Button from '../ui/Button'

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl border p-6"
        style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
            style={{
              backgroundColor: `color-mix(in srgb, ${danger ? 'var(--color-error)' : 'var(--color-primary)'}, transparent 85%)`,
              color: danger ? 'var(--color-error)' : 'var(--color-primary)',
            }}
          >
            <AlertTriangle size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
              {title}
            </h3>
            <p className="mt-1.5 text-sm font-semibold leading-6" style={{ color: 'var(--color-muted)' }}>
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: danger ? 'var(--color-error)' : 'var(--color-primary)' }}
          >
            {loading && (
              <span
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
                aria-hidden="true"
              />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
