import { useState } from 'react'
import { Download, FileSpreadsheet } from 'lucide-react'
import LargeModal from './LargeModal'
import Button from '../ui/Button'
import { EXPORT_COLUMNS, buildExcelBlob, downloadBlob } from '../../lib/exportRegistrations'

/**
 * Shows exactly what "Download Excel" is about to produce - same rows, same
 * column order - before the admin commits to it. The download button below
 * builds the workbook from this same `rows` array, so the preview can never
 * drift from the file that actually gets saved.
 */
export default function ExcelPreviewModal({ rows, truncated, onClose }) {
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')

  async function handleDownload() {
    setDownloading(true)
    setError('')
    try {
      const blob = await buildExcelBlob(rows)
      downloadBlob(blob, 'smcbi-students.xlsx')
    } catch {
      setError('Could not build the Excel file. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <LargeModal
      title="Excel Preview"
      onClose={onClose}
      footer={
        <>
          {error && (
            <p className="mr-auto self-center text-xs font-semibold" style={{ color: 'var(--color-error)' }}>
              {error}
            </p>
          )}
          <Button variant="secondary" onClick={onClose} disabled={downloading}>
            Close
          </Button>
          <Button onClick={handleDownload} loading={downloading}>
            <Download size={16} />
            Download Excel
          </Button>
        </>
      }
    >
      <div className="border-b px-5 py-3" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-2">
          <FileSpreadsheet size={16} style={{ color: 'var(--color-primary)' }} />
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            {rows.length.toLocaleString()} {rows.length === 1 ? 'record' : 'records'} - columns match the Health
            Kiosk bulk-import format.
          </p>
        </div>
        {truncated && (
          <p className="mt-1 text-xs font-semibold" style={{ color: 'var(--color-error)' }}>
            The result set was capped at this size - narrow your filters to include the rest.
          </p>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              {EXPORT_COLUMNS.map((column) => (
                <th
                  key={column}
                  className="sticky top-0 whitespace-nowrap border-b px-4 py-2.5 text-xs font-bold uppercase tracking-wide"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-muted)',
                  }}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-b" style={{ borderColor: 'var(--color-border)' }}>
                {EXPORT_COLUMNS.map((column) => (
                  <td key={column} className="whitespace-nowrap px-4 py-2.5" style={{ color: 'var(--color-text)' }}>
                    {row[column] || <span style={{ color: 'var(--color-muted)' }}>-</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </LargeModal>
  )
}
