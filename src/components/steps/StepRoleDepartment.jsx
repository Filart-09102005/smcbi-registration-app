import OptionCards from '../ui/OptionCards'
import { ROLES, departmentsForRole } from '../../lib/academicOptions'

export default function StepRoleDepartment({ formData, errors, setField }) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-black auth-strong-text">Role &amp; Department</h2>
        <p className="mt-1 text-sm font-semibold auth-muted-text">
          Select your role, then your department.
        </p>
      </div>

      <OptionCards
        label="Role"
        name="role"
        options={ROLES}
        value={formData.role}
        onChange={setField}
        error={errors.role}
      />

      <OptionCards
        label="Department"
        name="department"
        options={departmentsForRole(formData.role)}
        value={formData.department}
        onChange={setField}
        error={errors.department}
      />
    </div>
  )
}
