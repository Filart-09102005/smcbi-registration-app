import { useState } from 'react'
import { X } from 'lucide-react'
import AdminSelect from './AdminSelect'
import Alert from '../ui/Alert'
import Button from '../ui/Button'
import { updateRegistration } from '../../lib/adminApi'
import {
  GENDERS,
  GRADE_LEVELS,
  PROGRAMS,
  ROLES,
  STRANDS,
  YEAR_LEVELS,
  departmentsForRole,
  isSeniorHigh,
} from '../../lib/academicOptions'

const UNIQUE_VIOLATION = '23505'

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>
        {label}
      </span>
      {children}
    </label>
  )
}

function inputStyle() {
  return {
    borderColor: 'var(--color-border)',
    backgroundColor: 'var(--color-bg)',
    color: 'var(--color-text)',
  }
}

export default function RegistrationEditModal({ registration, onClose, onSaved }) {
  const [form, setForm] = useState({
    firstname: registration.firstname ?? '',
    lastname: registration.lastname ?? '',
    barcode: registration.barcode ?? '',
    email: registration.email ?? '',
    birthday: registration.birthday ?? '',
    gender: registration.gender ?? '',
    role: registration.role ?? 'student',
    department: registration.department ?? '',
    program: registration.program ?? '',
    year_level: registration.year_level ?? '',
    grade_level: registration.grade_level ?? '',
    strand: registration.strand ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(name, value) {
    setForm((current) => {
      const next = { ...current, [name]: value }
      if (name === 'role') {
        next.department = ''
        next.program = ''
        next.year_level = ''
        next.grade_level = ''
        next.strand = ''
      }
      if (name === 'department') {
        next.program = ''
        next.year_level = ''
        next.grade_level = ''
        next.strand = ''
      }
      if (name === 'grade_level' && !isSeniorHigh(value)) {
        next.strand = ''
      }
      return next
    })
  }

  const isStudent = form.role !== 'personnel'
  const isCollege = isStudent && form.department === 'COLLEGE'
  const isBed = isStudent && form.department === 'BED'
  const needsStrand = isBed && isSeniorHigh(form.grade_level)

  async function handleSave() {
    setError('')

    if (!form.firstname.trim() || !form.lastname.trim() || !form.barcode.trim() || !form.email.trim()) {
      setError('First name, last name, School ID, and email are all required.')
      return
    }
    if (!form.email.trim().toLowerCase().endsWith('@smcbi.edu.ph')) {
      setError('Email must end with @smcbi.edu.ph.')
      return
    }
    if (!form.department) {
      setError('Please choose a department.')
      return
    }
    if (isCollege && (!form.program || !form.year_level)) {
      setError('Please choose a program and year level.')
      return
    }
    if (isBed && (!form.grade_level || (needsStrand && !form.strand))) {
      setError('Please choose a grade level (and strand for Grade 11/12).')
      return
    }

    setSaving(true)
    try {
      await updateRegistration(registration.id, {
        firstname: form.firstname.trim(),
        lastname: form.lastname.trim(),
        barcode: form.barcode.trim(),
        email: form.email.trim().toLowerCase(),
        birthday: form.birthday,
        gender: form.gender,
        role: form.role,
        department: form.department,
        program: isCollege ? form.program : null,
        year_level: isCollege ? form.year_level : null,
        grade_level: isBed ? form.grade_level : null,
        strand: isBed && needsStrand ? form.strand : null,
      })
      onSaved()
      onClose()
    } catch (err) {
      if (err?.code === UNIQUE_VIOLATION) {
        setError(
          err.message?.includes('barcode')
            ? 'This School ID is already used by another registration.'
            : 'This email is already used by another registration.',
        )
      } else {
        setError('Could not save changes. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border"
        style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <h2 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
            Edit Registration
          </h2>
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

        <div className="space-y-4 px-5 py-5">
          {error && <Alert variant="error">{error}</Alert>}

          <div className="grid grid-cols-2 gap-4">
            <Field label="First Name">
              <input
                value={form.firstname}
                onChange={(event) => set('firstname', event.target.value)}
                className="h-10 w-full rounded-lg border px-3 text-sm outline-none"
                style={inputStyle()}
              />
            </Field>
            <Field label="Last Name">
              <input
                value={form.lastname}
                onChange={(event) => set('lastname', event.target.value)}
                className="h-10 w-full rounded-lg border px-3 text-sm outline-none"
                style={inputStyle()}
              />
            </Field>
          </div>

          <Field label="School ID">
            <input
              value={form.barcode}
              onChange={(event) => set('barcode', event.target.value)}
              className="h-10 w-full rounded-lg border px-3 text-sm outline-none"
              style={inputStyle()}
            />
          </Field>

          <Field label="Email">
            <input
              type="email"
              value={form.email}
              onChange={(event) => set('email', event.target.value)}
              className="h-10 w-full rounded-lg border px-3 text-sm outline-none"
              style={inputStyle()}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Birthday">
              <input
                type="date"
                value={form.birthday}
                onChange={(event) => set('birthday', event.target.value)}
                className="h-10 w-full rounded-lg border px-3 text-sm outline-none"
                style={inputStyle()}
              />
            </Field>
            <Field label="Gender">
              <AdminSelect value={form.gender} onChange={(v) => set('gender', v)} options={GENDERS} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Role">
              <AdminSelect value={form.role} onChange={(v) => set('role', v)} options={ROLES} />
            </Field>
            <Field label="Department">
              <AdminSelect
                value={form.department}
                onChange={(v) => set('department', v)}
                options={departmentsForRole(form.role)}
              />
            </Field>
          </div>

          {isCollege && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Program">
                <AdminSelect value={form.program} onChange={(v) => set('program', v)} options={PROGRAMS} />
              </Field>
              <Field label="Year Level">
                <AdminSelect
                  value={form.year_level}
                  onChange={(v) => set('year_level', v)}
                  options={YEAR_LEVELS}
                />
              </Field>
            </div>
          )}

          {isBed && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Grade Level">
                <AdminSelect
                  value={form.grade_level}
                  onChange={(v) => set('grade_level', v)}
                  options={GRADE_LEVELS}
                />
              </Field>
              {needsStrand && (
                <Field label="Strand">
                  <AdminSelect value={form.strand} onChange={(v) => set('strand', v)} options={STRANDS} />
                </Field>
              )}
            </div>
          )}
        </div>

        <div
          className="flex justify-end gap-2 border-t px-5 py-4"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
