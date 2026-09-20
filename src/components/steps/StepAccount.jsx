import PasswordField from '../ui/PasswordField'
import PasswordStrengthMeter from '../ui/PasswordStrengthMeter'

export default function StepAccount({ formData, errors, setField }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black auth-strong-text">Account Information</h2>
        <p className="mt-1 text-sm font-semibold auth-muted-text">
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
