import PasswordField from '../ui/PasswordField'
import PasswordStrengthMeter from '../ui/PasswordStrengthMeter'

export default function StepAccount({ formData, errors, setField }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Account Information</h2>
        <p className="mt-1 text-sm text-gray-500">
          This password will be used to prepare your Health Kiosk account.
        </p>
      </div>

      <div>
        <PasswordField
          label="Password"
          name="password"
          value={formData.password}
          onChange={setField}
          error={errors.password}
        />
        <PasswordStrengthMeter password={formData.password} />
      </div>

      <PasswordField
        label="Confirm Password"
        name="confirmPassword"
        value={formData.confirmPassword}
        onChange={setField}
        error={errors.confirmPassword}
      />
    </div>
  )
}
