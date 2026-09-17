import Alert from '../ui/Alert'
import { labelFor, GENDERS, PROGRAMS, isSeniorHigh } from '../../lib/academicOptions'

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
    <div className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-baseline sm:justify-between">
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-sm font-medium text-gray-900">{value}</dd>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-primary-800">{title}</h3>
      <dl className="mt-2 divide-y divide-gray-100 border-t border-gray-100">{children}</dl>
    </div>
  )
}

export default function StepReview({ formData, submitError }) {
  const seniorHigh = isSeniorHigh(formData.gradeLevel)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Review Your Information</h2>
        <p className="mt-1 text-sm text-gray-500">
          Please check your details before submitting. You can go back to make changes.
        </p>
      </div>

      {submitError && <Alert variant="error">{submitError}</Alert>}

      <Section title="Personal Information">
        <Row label="Name" value={`${formData.firstName} ${formData.lastName}`} />
        <Row label="Birthday" value={formatDate(formData.birthday)} />
        <Row label="Gender" value={labelFor(GENDERS, formData.gender)} />
        <Row label="School Email" value={formData.email} />
      </Section>

      <Section title="Academic Information">
        <Row label="Department" value={formData.department} />
        {formData.department === 'COLLEGE' ? (
          <>
            <Row label="Program" value={labelFor(PROGRAMS, formData.program)} />
            <Row label="Year Level" value={formData.yearLevel} />
          </>
        ) : (
          <>
            <Row label="Grade Level" value={formData.gradeLevel} />
            {seniorHigh && <Row label="Strand" value={formData.strand} />}
          </>
        )}
      </Section>

      <p className="text-xs text-gray-400">
        Your password is not shown here for security and will not be included in any exported
        file.
      </p>
    </div>
  )
}
