import Alert from '../ui/Alert'
import {
  labelFor,
  GENDERS,
  PROGRAMS,
  ROLES,
  STAFF_DEPARTMENTS,
  isSeniorHigh,
} from '../../lib/academicOptions'

function formatDate(value) {
  if (!value) return ''
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function Row({ label, value }) {
  return (
    <div
      className="flex flex-col gap-0.5 border-b py-2.5 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between"
      style={{ borderColor: 'var(--auth-border)' }}
    >
      <dt className="text-sm font-semibold auth-muted-text">{label}</dt>
      <dd className="text-sm font-black auth-strong-text">{value}</dd>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="rounded-xl border p-5 auth-panel">
      <h3
        className="text-xs font-black uppercase tracking-wide"
        style={{ color: 'var(--color-primary)' }}
      >
        {title}
      </h3>
      <dl className="mt-2">{children}</dl>
    </div>
  )
}

export default function StepReview({ formData, submitError }) {
  const seniorHigh = isSeniorHigh(formData.gradeLevel)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-black auth-strong-text">Review Your Information</h2>
        <p className="mt-1 text-sm font-semibold auth-muted-text">
          Please check your details before submitting. You can go back to make changes.
        </p>
      </div>

      {submitError && <Alert variant="error">{submitError}</Alert>}

      <Section title="Personal Information">
        <Row label="Name" value={`${formData.firstName} ${formData.lastName}`} />
        <Row label="School ID" value={formData.schoolId} />
        <Row label="Birthday" value={formatDate(formData.birthday)} />
        <Row label="Gender" value={labelFor(GENDERS, formData.gender)} />
        <Row label="School Email" value={formData.email} />
      </Section>

      <Section title="Role">
        <Row label="Role" value={labelFor(ROLES, formData.role)} />
      </Section>

      <Section title="Academic Information">
        {formData.role === 'personnel' ? (
          <Row label="Department" value={labelFor(STAFF_DEPARTMENTS, formData.department)} />
        ) : formData.department === 'COLLEGE' ? (
          <>
            <Row label="Department" value={formData.department} />
            <Row label="Program" value={labelFor(PROGRAMS, formData.program)} />
            <Row label="Year Level" value={formData.yearLevel} />
          </>
        ) : (
          <>
            <Row label="Department" value={formData.department} />
            <Row label="Grade Level" value={formData.gradeLevel} />
            {seniorHigh && <Row label="Strand" value={formData.strand} />}
          </>
        )}
      </Section>

      <p className="text-xs font-semibold auth-muted-text">
        Your password is not shown here for security and will not be included in any exported
        file.
      </p>
    </div>
  )
}
