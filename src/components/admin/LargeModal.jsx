import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

/**
 * Shared chrome for the export preview modals - large (90-95vw) but never
 * full-screen, with a fixed header/footer and a scrolling body in between so
 * a wide table or an embedded PDF viewer never pushes the action buttons
 * off-screen. Kept generic (title/body/footer as props) so Excel and PDF
 * previews reuse one implementation of the backdrop, Escape handling, and
 * scroll locking instead of each rolling their own.
 */
export default function LargeModal({ title, onClose, footer, children }) {
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[9200] flex items-center justify-center bg-black/50 p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className="flex w-[95vw] max-w-[1400px] flex-col overflow-hidden rounded-2xl border shadow-2xl"
        style={{
          height: '90vh',
          backgroundColor: 'var(--color-card)',
          borderColor: 'var(--color-border)',
        }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="flex flex-shrink-0 items-center justify-between border-b px-5 py-4"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <h2 className="text-base font-bold sm:text-lg" style={{ color: 'var(--color-text)' }}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 transition hover:-translate-y-0.5"
            style={{ color: 'var(--color-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">{children}</div>

        <div
          className="flex flex-shrink-0 flex-wrap justify-end gap-2 border-t px-5 py-4"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {footer}
        </div>
      </div>
    </div>,
    document.body,
  )
}
