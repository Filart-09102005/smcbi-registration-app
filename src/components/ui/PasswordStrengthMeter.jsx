import { Check } from 'lucide-react'
import { evaluatePassword, getPasswordStrength } from '../../lib/password'

export default function PasswordStrengthMeter({ password }) {
  const strength = getPasswordStrength(password)
  const rules = evaluatePassword(password)
  const segments = 5

  return (
    <div className="mt-4 rounded-xl border p-5 auth-panel">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-bold auth-strong-text">Password strength</span>
        <span className="text-sm font-black" style={{ color: strength.hex }}>
          {strength.label}
        </span>
      </div>

      <div
        className="mt-3 flex h-3 gap-1 overflow-hidden rounded-full"
        style={{ backgroundColor: 'var(--auth-border)' }}
        aria-hidden="true"
      >
        {Array.from({ length: segments }).map((_, index) => (
          <span
            key={index}
            className="h-full flex-1 rounded-full transition-all duration-300"
            style={{ backgroundColor: index < strength.score ? strength.hex : 'transparent' }}
          />
        ))}
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {rules.map((rule) => (
          <div
            key={rule.key}
            className="flex items-center gap-2 text-sm font-semibold"
            style={{ color: rule.passed ? 'var(--color-success)' : 'var(--auth-muted)' }}
          >
            <Check size={15} />
            {rule.label}
          </div>
        ))}
      </div>
    </div>
  )
}
