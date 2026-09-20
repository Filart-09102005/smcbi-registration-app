import { useEffect, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  FileSpreadsheet,
  FileText,
  Pencil,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react'
import AdminSelect from './AdminSelect'
import RegistrationEditModal from './RegistrationEditModal'
import ConfirmDialog from './ConfirmDialog'
import ExportOverlay from './ExportOverlay'
import { deleteRegistration, fetchAllMatching, fetchRegistrations } from '../../lib/adminApi'
import {
  GENDERS,
  GRADE_LEVELS,
  PROGRAMS,
  ROLES,
  STRANDS,
  YEAR_LEVELS,
  departmentsForRole,
  isSeniorHigh,
  labelFor,
  STUDENT_DEPARTMENTS,
  STAFF_DEPARTMENTS,
} from '../../lib/academicOptions'
import { calculateAge } from '../../lib/validation'
import { exportExcel, exportPDF } from '../../lib/exportRegistrations'

const ALL_DEPARTMENTS = [...STUDENT_DEPARTMENTS, ...STAFF_DEPARTMENTS]

const PAGE_SIZE_OPTIONS = [
  { value: 20, label: '20 rows' },
  { value: 30, label: '30 rows' },
]

const SORT_OPTIONS = [
  { value: 'lastname-asc', label: 'Name (A-Z)' },
  { value: 'lastname-desc', label: 'Name (Z-A)' },
  { value: 'submitted_at-desc', label: 'Newest first' },
  { value: 'submitted_at-asc', label: 'Oldest first' },
]

function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const EMPTY_EXPORT = { open: false, format: null, status: 'running', count: 0 }

export default function RegistrationSection({ onOpenDetail, refreshToken }) {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [department, setDepartment] = useState('')
  const [program, setProgram] = useState('')
  const [yearLevel, setYearLevel] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [strand, setStrand] = useState('')
  const [gender, setGender] = useState('')
  const [sortValue, setSortValue] = useState('lastname-asc')
  const [pageSize, setPageSize] = useState(20)
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [localRefresh, setLocalRefresh] = useState(0)
  const [editing, setEditing] = useState(null)
  const [confirmingDelete, setConfirmingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [exportState, setExportState] = useState(EMPTY_EXPORT)

  const isCollege = department === 'COLLEGE'
  const isBed = department === 'BED'
  const showStrand = isBed && isSeniorHigh(gradeLevel)
  const departmentOptions = role ? departmentsForRole(role) : ALL_DEPARTMENTS

  function handleRoleChange(next) {
    setRole(next)
    setDepartment('')
    setProgram('')
    setYearLevel('')
    setGradeLevel('')
    setStrand('')
  }

  function handleDepartmentChange(next) {
    setDepartment(next)
    setProgram('')
    setYearLevel('')
    setGradeLevel('')
    setStrand('')
  }

  function handleGradeLevelChange(next) {
    setGradeLevel(next)
    if (!isSeniorHigh(next)) setStrand('')
  }

  function resetFilters() {
    setSearch('')
    setRole('')
    setDepartment('')
    setProgram('')
    setYearLevel('')
    setGradeLevel('')
    setStrand('')
    setGender('')
  }

  const activeFilters = { role, department, program, yearLevel, gradeLevel, strand, gender }

  // Reset to page 1 whenever the query itself changes, so a new search or
  // filter never leaves the view stranded on a page past the new result
  // set. Done during render (React's documented pattern for "adjust state
  // when an input changes") rather than in an effect, which would cost an
  // extra render on every filter change.
  const querySignature = `${search}|${role}|${department}|${program}|${yearLevel}|${gradeLevel}|${strand}|${gender}|${sortValue}|${pageSize}`
  const [lastQuerySignature, setLastQuerySignature] = useState(querySignature)
  if (querySignature !== lastQuerySignature) {
    setLastQuerySignature(querySignature)
    if (page !== 1) setPage(1)
  }

  useEffect(() => {
    let cancelled = false
    const [column, direction] = sortValue.split('-')

    async function load() {
      setLoading(true)
      setError('')
      try {
        const { rows: data, total: count } = await fetchRegistrations({
          search,
          filters: activeFilters,
          sort: { column, ascending: direction === 'asc' },
          page,
          pageSize,
        })
        if (cancelled) return
        setRows(data)
        setTotal(count)
      } catch {
        if (!cancelled) setError('Unable to load student registrations. Please try again.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, role, department, program, yearLevel, gradeLevel, strand, gender, sortValue, pageSize, page, refreshToken, localRefresh])

  async function handleDelete() {
    if (!confirmingDelete) return
    setDeleting(true)
    try {
      await deleteRegistration(confirmingDelete.id)
      setConfirmingDelete(null)
      setLocalRefresh((current) => current + 1)
    } catch {
      setError('Could not delete this registration. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  // Exports always run against fetchAllMatching with the SAME filters
  // currently applied on screen - never the full table - so a download only
  // ever contains what's actually being viewed/filtered at that moment.
  async function runExport(format) {
    const pdfWindow = format === 'pdf' ? window.open('', '_blank') : null

    setExportState({ open: true, format, status: 'running', count: 0 })
    try {
      const matching = await fetchAllMatching({ search, filters: activeFilters })
      const filename = 'smcbi-students'
      if (format === 'pdf') await exportPDF(matching, `${filename}.pdf`, pdfWindow)
      else await exportExcel(matching, `${filename}.xlsx`)
      setExportState({ open: true, format, status: 'success', count: matching.length })
    } catch {
      pdfWindow?.close()
      setExportState({ open: true, format, status: 'error', count: 0 })
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const activeChips = [
    search.trim() && { key: 'search', label: `"${search.trim()}"` },
    role && { key: 'role', label: labelFor(ROLES, role) },
    department && { key: 'department', label: department },
    program && { key: 'program', label: labelFor(PROGRAMS, program) },
    yearLevel && { key: 'yearLevel', label: yearLevel },
    gradeLevel && { key: 'gradeLevel', label: gradeLevel },
    strand && { key: 'strand', label: strand },
    gender && { key: 'gender', label: labelFor(GENDERS, gender) },
  ].filter(Boolean)

  return (
    <div
      className="rounded-xl border"
      style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
    >
      <div className="border-b p-4" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex h-9 items-center gap-1.5 rounded-lg border px-2.5"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)' }}
          >
            <Search size={14} style={{ color: 'var(--color-muted)' }} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, or School ID"
              className="w-44 bg-transparent text-xs font-semibold outline-none sm:w-56"
              style={{ color: 'var(--color-text)' }}
            />
          </div>

          <AdminSelect className="w-28" value={role} onChange={handleRoleChange} placeholder="Role" options={ROLES} />
          <AdminSelect
            className="w-40"
            value={department}
            onChange={handleDepartmentChange}
            placeholder="Department"
            options={departmentOptions}
          />
          {isCollege && (
            <>
              <AdminSelect
                className="w-32"
                value={program}
                onChange={setProgram}
                placeholder="Program"
                options={PROGRAMS}
              />
              <AdminSelect
                className="w-32"
                value={yearLevel}
                onChange={setYearLevel}
                placeholder="Year Level"
                options={YEAR_LEVELS}
              />
            </>
          )}
          {isBed && (
            <AdminSelect
              className="w-32"
              value={gradeLevel}
              onChange={handleGradeLevelChange}
              placeholder="Grade Level"
              options={GRADE_LEVELS}
            />
          )}
          {showStrand && (
            <AdminSelect className="w-28" value={strand} onChange={setStrand} placeholder="Strand" options={STRANDS} />
          )}
          <AdminSelect className="w-28" value={gender} onChange={setGender} placeholder="Gender" options={GENDERS} />
          <AdminSelect className="w-36" value={sortValue} onChange={setSortValue} placeholder="Sort" options={SORT_OPTIONS} />
          <AdminSelect
            className="w-28"
            value={pageSize}
            onChange={(value) => setPageSize(Number(value))}
            placeholder="Rows"
            options={PAGE_SIZE_OPTIONS}
          />

          <button
            type="button"
            onClick={resetFilters}
            title="Reset filters"
            className="flex h-9 w-9 items-center justify-center rounded-lg border transition hover:-translate-y-0.5"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}
          >
            <RotateCcw size={14} />
          </button>

          <div className="ml-1 flex items-center gap-2 border-l pl-2" style={{ borderColor: 'var(--color-border)' }}>
            <button
              type="button"
              onClick={() => runExport('pdf')}
              disabled={exportState.open || total === 0}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <FileText size={14} />
              PDF
            </button>
            <button
              type="button"
              onClick={() => runExport('excel')}
              disabled={exportState.open || total === 0}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)', backgroundColor: 'var(--color-card)' }}
            >
              <FileSpreadsheet size={14} />
              Excel
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[0.68rem] font-black uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
            Showing
          </span>
          <span
            className="rounded-full border px-2.5 py-0.5 text-xs font-black"
            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)' }}
          >
            {loading ? '...' : `${total.toLocaleString()} ${total === 1 ? 'registration' : 'registrations'}`}
          </span>
          {activeChips.length ? (
            activeChips.map((chip) => (
              <span
                key={chip.key}
                className="rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-muted)' }}
              >
                {chip.label}
              </span>
            ))
          ) : (
            <span className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>
              No filters applied
            </span>
          )}
          <span className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>
            &middot; PDF/Excel export only the registrations matching these filters.
          </span>
        </div>
      </div>

      {error ? (
        <p className="p-5 text-sm font-semibold" style={{ color: 'var(--color-error)' }}>
          {error}
        </p>
      ) : loading ? (
        <p className="p-5 text-sm font-semibold" style={{ color: 'var(--color-muted)' }}>
          Loading student registrations...
        </p>
      ) : rows.length === 0 ? (
        <p className="p-5 text-sm font-semibold" style={{ color: 'var(--color-muted)' }}>
          No students registered yet.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr style={{ color: 'var(--color-muted)' }}>
                  {[
                    'Name',
                    'School ID',
                    'Email',
                    'Age',
                    'Birthday',
                    'Gender',
                    'Role',
                    'Department',
                    'Program',
                    'Year Level',
                    'Grade Level',
                    'Strand',
                    'Submitted',
                    'Actions',
                  ].map((label) => (
                    <th key={label} className="whitespace-nowrap px-4 py-2.5 text-xs font-bold uppercase">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <td className="whitespace-nowrap px-4 py-2.5 font-semibold" style={{ color: 'var(--color-text)' }}>
                      {row.lastname}, {row.firstname}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 font-semibold" style={{ color: 'var(--color-text)' }}>
                      {row.barcode || '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5" style={{ color: 'var(--color-muted)' }}>
                      {row.email}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5" style={{ color: 'var(--color-muted)' }}>
                      {calculateAge(row.birthday) ?? '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5" style={{ color: 'var(--color-muted)' }}>
                      {formatDate(row.birthday)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 capitalize" style={{ color: 'var(--color-muted)' }}>
                      {row.gender}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5" style={{ color: 'var(--color-muted)' }}>
                      {labelFor(ROLES, row.role)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5" style={{ color: 'var(--color-muted)' }}>
                      {row.department}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5" style={{ color: 'var(--color-muted)' }}>
                      {row.program ? labelFor(PROGRAMS, row.program) : '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5" style={{ color: 'var(--color-muted)' }}>
                      {row.year_level || '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5" style={{ color: 'var(--color-muted)' }}>
                      {row.grade_level || '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5" style={{ color: 'var(--color-muted)' }}>
                      {row.strand || '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5" style={{ color: 'var(--color-muted)' }}>
                      {formatDate(row.submitted_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onOpenDetail(row)}
                          title="View"
                          aria-label="View"
                          className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:-translate-y-0.5"
                          style={{ color: 'var(--color-primary)' }}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditing(row)}
                          title="Edit"
                          aria-label="Edit"
                          className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:-translate-y-0.5"
                          style={{ color: 'var(--color-text)' }}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingDelete(row)}
                          title="Delete"
                          aria-label="Delete"
                          className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:-translate-y-0.5"
                          style={{ color: 'var(--color-error)' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            className="flex items-center justify-between gap-3 border-t px-4 py-3"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <p className="text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="flex h-7 w-7 items-center justify-center rounded-md border disabled:opacity-40"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                aria-label="Previous page"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                className="flex h-7 w-7 items-center justify-center rounded-md border disabled:opacity-40"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                aria-label="Next page"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      )}

      {editing && (
        <RegistrationEditModal
          registration={editing}
          onClose={() => setEditing(null)}
          onSaved={() => setLocalRefresh((current) => current + 1)}
        />
      )}

      {confirmingDelete && (
        <ConfirmDialog
          title="Delete this registration?"
          message={`Permanently delete ${confirmingDelete.firstname} ${confirmingDelete.lastname}'s registration? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(null)}
        />
      )}

      <ExportOverlay
        open={exportState.open}
        format={exportState.format}
        status={exportState.status}
        count={exportState.count}
        resultAction={exportState.format === 'pdf' ? 'opened in a new tab' : 'downloaded'}
        onDone={() => setExportState(EMPTY_EXPORT)}
        onRetry={() => runExport(exportState.format)}
      />
    </div>
  )
}
