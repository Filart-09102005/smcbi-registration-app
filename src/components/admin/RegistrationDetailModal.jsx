import { useState } from 'react'
import { X } from 'lucide-react'
import StatusBadge from './StatusBadge'
import Button from '../ui/Button'
import { labelFor, GENDERS, PROGRAMS, ROLES } from '../../lib/academicOptions'

function formatDate(value) {
  if (!value) return ''
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>
        {label}
      </p>
      <p className="mt-0.5 text-sm font-bold" style={{ color: 'var(--color-text)' }}>
        {value || '-'}
      </p>
    </div>
  )
}

export default function RegistrationDetailModal({ registration, onClose, onUpdateStatus }) {
  const [working, setWorking] = useState(false)

  if (!registration) return null

  const isCollege = registration.department === 'COLLEGE'
  const isBed = registration.department === 'BED'
  const seniorHigh = registration.grade_level === 'Grade 11' || registration.grade_level === 'Grade 12'

  async function handleAction(status) {
    setWorking(true)
    try {
      await onUpdateStatus(registration.id, status)
      onClose()
    } finally {
      setWorking(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border"
        style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
              Registration Details
            </h2>
            <div className="mt-1">
              <StatusBadge status={registration.status} />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5"
            style={{ color: 'var(--color-muted)' }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-6 px-5 py-5">
          <section>
            <h3
              className="text-xs font-black uppercase tracking-wide"
              style={{ color: 'var(--color-primary)' }}
            >
              Personal Information
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <Field label="First Name" value={registration.firstname} />
              <Field label="Last Name" value={registration.lastname} />
              <Field label="School ID" value={registration.barcode} />
              <Field label="Birthday" value={formatDate(registration.birthday)} />
              <Field label="Gender" value={labelFor(GENDERS, registration.gender)} />
              <div className="col-span-2">
                <Field label="Email" value={registration.email} />
              </div>
            </div>
          </section>

          <section>
            <h3
              className="text-xs font-black uppercase tracking-wide"
              style={{ color: 'var(--color-primary)' }}
            >
              Academic Information
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <Field label="Role" value={labelFor(ROLES, registration.role)} />
              <Field label="Department" value={registration.department} />
              {isCollege && (
                <>
                  <Field label="Program" value={labelFor(PROGRAMS, registration.program)} />
                  <Field label="Year Level" value={registration.year_level} />
                </>
              )}
              {isBed && (
                <>
                  <Field label="Grade Level" value={registration.grade_level} />
                  {seniorHigh && <Field label="Strand" value={registration.strand} />}
                </>
              )}
            </div>
          </section>

          <section>
            <h3
              className="text-xs font-black uppercase tracking-wide"
              style={{ color: 'var(--color-primary)' }}
            >
              Registration
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <Field label="Submitted" value={formatDate(registration.submitted_at?.slice(0, 10))} />
              {registration.reviewed_at && (
                <Field label="Reviewed" value={formatDate(registration.reviewed_at?.slice(0, 10))} />
              )}
              {registration.imported_at && (
                <Field label="Imported" value={formatDate(registration.imported_at?.slice(0, 10))} />
              )}
            </div>
          </section>
        </div>

        <div
          className="flex flex-wrap justify-end gap-2 border-t px-5 py-4"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {registration.status === 'pending' && (
            <>
              <Button variant="secondary" onClick={() => handleAction('rejected')} disabled={working}>
                Reject
              </Button>
              <Button onClick={() => handleAction('approved')} loading={working}>
                Approve
              </Button>
            </>
          )}
          {registration.status === 'approved' && (
            <Button variant="secondary" onClick={() => handleAction('pending')} disabled={working}>
              Revert to Pending
            </Button>
          )}
          {registration.status === 'rejected' && (
            <Button variant="secondary" onClick={() => handleAction('pending')} disabled={working}>
              Revert to Pending
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
