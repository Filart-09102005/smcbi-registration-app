import { Building2 } from 'lucide-react'
import OptionCards from '../ui/OptionCards'
import {
  GRADE_LEVELS,
  PROGRAMS,
  STRANDS,
  YEAR_LEVELS,
  isSeniorHigh,
  labelFor,
  STAFF_DEPARTMENTS,
} from '../../lib/academicOptions'

export default function StepAcademic({ formData, errors, setField }) {
  if (formData.role === 'personnel') {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-black auth-strong-text">Academic Information</h2>
          <p className="mt-1 text-sm font-semibold auth-muted-text">
            No further academic details are needed for personnel accounts.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border p-5 auth-panel">
          <Building2 size={20} style={{ color: 'var(--color-primary)' }} />
          <div>
            <p className="text-sm font-black auth-strong-text">
              {labelFor(STAFF_DEPARTMENTS, formData.department)}
            </p>
            <p className="text-xs font-semibold auth-muted-text">
              You can continue to the next step.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-black auth-strong-text">Academic Information</h2>
        <p className="mt-1 text-sm font-semibold auth-muted-text">
          {formData.department === 'COLLEGE'
            ? 'Tell us your program and year level.'
            : 'Tell us your grade level.'}
        </p>
      </div>

      {formData.department === 'COLLEGE' && (
        <>
          <OptionCards
            label="Program / Course"
            name="program"
            options={PROGRAMS}
            value={formData.program}
            onChange={setField}
            error={errors.program}
          />
          <OptionCards
            label="Year Level"
            name="yearLevel"
            options={YEAR_LEVELS}
            value={formData.yearLevel}
            onChange={setField}
            error={errors.yearLevel}
          />
        </>
      )}

      {formData.department === 'BED' && (
        <>
          <OptionCards
            label="Grade Level"
            name="gradeLevel"
            options={GRADE_LEVELS}
            value={formData.gradeLevel}
            onChange={setField}
            error={errors.gradeLevel}
          />
          {isSeniorHigh(formData.gradeLevel) && (
            <OptionCards
              label="Strand"
              name="strand"
              options={STRANDS}
              value={formData.strand}
              onChange={setField}
              error={errors.strand}
            />
          )}
        </>
      )}
    </div>
  )
}
