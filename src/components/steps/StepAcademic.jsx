import OptionCards from '../ui/OptionCards'
import {
  GRADE_LEVELS,
  PROGRAMS,
  STRANDS,
  YEAR_LEVELS,
  isSeniorHigh,
} from '../../lib/academicOptions'

export default function StepAcademic({ formData, errors, setField }) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Academic Information</h2>
        <p className="mt-1 text-sm text-gray-500">
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
