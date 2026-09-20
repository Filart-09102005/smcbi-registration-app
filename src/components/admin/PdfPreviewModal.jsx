import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Download, Loader2, RotateCcw } from 'lucide-react'
import LargeModal from './LargeModal'
import Button from '../ui/Button'
import { buildPdfBlob, downloadBlob } from '../../lib/exportRegistrations'

/**
 * Builds the PDF once and shows it in an embedded viewer, so what the admin
 * reviews here is the literal file bytes "Download PDF" saves below - not a
 * second, separately-generated copy that could drift from the preview.
 */
export default function PdfPreviewModal({ rows, truncated, onClose }) {
  const [state, setState] = useState({ status: 'loading', blob: null, url: null })
  const [retryToken, setRetryToken] = useState(0)
  const urlRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function build() {
      setState({ status: 'loading', blob: null, url: null })
      try {
        const blob = await buildPdfBlob(rows)
        if (cancelled) return
        const url = URL.createObjectURL(blob)
        urlRef.current = url
        setState({ status: 'ready', blob, url })
      } catch {
        if (!cancelled) setState({ status: 'error', blob: null, url: null })
      }
    }

    build()
    return () => {
      cancelled = true
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current)
        urlRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryToken])

  function retry() {
    setRetryToken((current) => current + 1)
  }

  function handleDownload() {
    if (!state.blob) return
    downloadBlob(state.blob, 'smcbi-students.pdf')
  }

  return (
    <LargeModal
      title="PDF Preview"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleDownload} disabled={state.status !== 'ready'}>
            <Download size={16} />
            Download PDF
          </Button>
        </>
      }
    >
      <div className="flex h-full flex-col">
        {truncated && (
          <p
            className="flex-shrink-0 border-b px-5 py-2 text-xs font-semibold"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-error)' }}
          >
            The result set was capped at this size - narrow your filters to include the rest.
          </p>
        )}

        <div className="min-h-0 flex-1 p-4">
          {state.status === 'loading' && (
            <div
              className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border text-sm font-semibold"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}
            >
              <Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
              Preparing PDF preview...
            </div>
          )}

          {state.status === 'error' && (
            <div
              className="flex h-full flex-col items-center justify-center gap-3 rounded-xl border text-center text-sm font-semibold"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}
            >
              <AlertTriangle size={24} style={{ color: 'var(--color-error)' }} />
              Could not generate the PDF preview.
              <button
                type="button"
                onClick={retry}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-white transition hover:-translate-y-0.5"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                <RotateCcw size={14} />
                Try Again
              </button>
            </div>
          )}

          {state.status === 'ready' && (
            <iframe
              src={state.url}
              title="PDF Preview"
              className="h-full w-full rounded-xl border"
              style={{ borderColor: 'var(--color-border)' }}
            />
          )}
        </div>
      </div>
    </LargeModal>
  )
}
