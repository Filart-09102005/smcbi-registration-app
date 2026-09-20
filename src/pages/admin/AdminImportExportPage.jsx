import { useEffect, useState } from 'react'
import { CheckCircle2, FileSpreadsheet, FileText, Sheet, UploadCloud } from 'lucide-react'
import AdminShell from '../../components/admin/AdminShell'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import ExportOverlay from '../../components/admin/ExportOverlay'
import { fetchApprovedForExport, markManyImported } from '../../lib/adminApi'
import { exportCSV, exportDocx, exportExcel, exportPDF } from '../../lib/exportRegistrations'

const FORMATS = [
  { key: 'csv', label: 'CSV', description: 'For kiosk data transfer', icon: Sheet, run: exportCSV, overlayFormat: 'excel' },
  { key: 'xlsx', label: 'Excel (.xlsx)', description: 'For kiosk data transfer', icon: FileSpreadsheet, run: exportExcel, overlayFormat: 'excel' },
  { key: 'pdf', label: 'PDF', description: 'For printing / records', icon: FileText, run: exportPDF, overlayFormat: 'pdf' },
  { key: 'docx', label: 'Word (.docx)', description: 'For printing / records', icon: FileText, run: exportDocx, overlayFormat: 'pdf' },
]

const EMPTY_EXPORT = { open: false, format: null, status: 'running', count: 0, key: null }

export default function AdminImportExportPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exportState, setExportState] = useState(EMPTY_EXPORT)
  const [marking, setMarking] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadApproved() {
      setLoading(true)
      setError('')
      try {
        const data = await fetchApprovedForExport()
        if (!cancelled) setRows(data)
      } catch {
        if (!cancelled) setError('Unable to load approved registrations. Please try again.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadApproved()
    return () => {
      cancelled = true
    }
  }, [])

  async function reloadApproved() {
    try {
      setRows(await fetchApprovedForExport())
    } catch {
      setError('Unable to update registration status. Please try again.')
    }
  }

  async function handleExport(format) {
    // Opened synchronously, before any await below, so the browser still
    // attributes it to this click and doesn't block it as a popup.
    const pdfWindow = format.key === 'pdf' ? window.open('', '_blank') : null

    setNotice('')
    setExportState({ open: true, format: format.overlayFormat, status: 'running', count: 0, key: format.key })
    try {
      if (format.key === 'pdf') await format.run(rows, undefined, pdfWindow)
      else await format.run(rows)
      setExportState({ open: true, format: format.overlayFormat, status: 'success', count: rows.length, key: format.key })
    } catch {
      pdfWindow?.close()
      setExportState({ open: true, format: format.overlayFormat, status: 'error', count: 0, key: format.key })
    }
  }

  async function handleMarkImported() {
    setMarking(true)
    setNotice('')
    try {
      await markManyImported(rows.map((row) => row.id))
      setNotice(`Marked ${rows.length} record(s) as imported.`)
      await reloadApproved()
    } catch {
      setError('Unable to update registration status. Please try again.')
    } finally {
      setMarking(false)
    }
  }

  return (
    <AdminShell>
      <div className="mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
          Import / Export
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
          Prepare approved registrations for the Health Kiosk's bulk import.
        </p>
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}
      {notice && (
        <div className="mb-4">
          <Alert variant="success">{notice}</Alert>
        </div>
      )}

      <div
        className="rounded-xl border p-5 sm:p-6"
        style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
              Export Approved Students
            </h2>
            <p className="mt-1 text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>
              Only registrations that are approved and not already imported are included.
            </p>
          </div>
          <span
            className="flex-shrink-0 rounded-full px-3 py-1 text-sm font-black"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-primary) 12%, transparent)',
              color: 'var(--color-primary)',
            }}
          >
            {rows.length}
          </span>
        </div>

        {loading ? (
          <p className="mt-5 text-sm font-semibold" style={{ color: 'var(--color-muted)' }}>
            Loading approved registrations...
          </p>
        ) : rows.length === 0 ? (
          <p className="mt-5 text-sm font-semibold" style={{ color: 'var(--color-muted)' }}>
            No approved students are waiting to be exported.
          </p>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {FORMATS.map((format) => {
              const Icon = format.icon
              return (
                <button
                  key={format.key}
                  type="button"
                  onClick={() => handleExport(format)}
                  disabled={exportState.open}
                  className="flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <Icon size={18} style={{ color: 'var(--color-primary)' }} />
                  <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                    {format.label}
                  </span>
                  <span className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>
                    {format.description}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div
        className="mt-6 rounded-xl border p-5 sm:p-6"
        style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-3">
          <UploadCloud size={20} style={{ color: 'var(--color-primary)' }} />
          <div>
            <h2 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
              Confirm Kiosk Import
            </h2>
            <p className="mt-1 text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>
              Once the exported file has been bulk-imported into the Health Kiosk, mark these
              records as imported so they are never exported again.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <Button
            variant="secondary"
            onClick={handleMarkImported}
            disabled={rows.length === 0}
            loading={marking}
          >
            <CheckCircle2 size={16} />
            Mark {rows.length || ''} Approved as Imported
          </Button>
        </div>
      </div>

      <ExportOverlay
        open={exportState.open}
        format={exportState.format}
        status={exportState.status}
        count={exportState.count}
        resultAction={exportState.key === 'pdf' ? 'opened in a new tab' : 'downloaded'}
        onDone={() => setExportState(EMPTY_EXPORT)}
        onRetry={() => {
          const format = FORMATS.find((item) => item.key === exportState.key)
          if (format) handleExport(format)
        }}
      />
    </AdminShell>
  )
}
