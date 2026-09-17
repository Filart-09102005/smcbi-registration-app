import OptionCards from '../ui/OptionCards'
import { DEPARTMENTS } from '../../lib/academicOptions'

const ROLES = [{ value: 'student', label: 'Student' }]

export default function StepRoleDepartment({ formData, errors, setField }) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Role &amp; Department</h2>
        <p className="mt-1 text-sm text-gray-500">
          This portal is currently for student registration only.
        </p>
      </div>

      <OptionCards
        label="Role"
        name="role"
        options={ROLES}
        value={formData.role}
        onChange={setField}
        error={errors.role}
        columns={1}
      />

      <OptionCards
        label="Department"
        name="department"
        options={DEPARTMENTS}
        value={formData.department}
        onChange={setField}
        error={errors.department}
      />
    </div>
  )
}
