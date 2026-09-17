import { evaluatePassword, getPasswordStrength } from '../../lib/password'

export default function PasswordStrengthMeter({ password }) {
  const strength = getPasswordStrength(password)
  const rules = evaluatePassword(password)
  const segments = 5

  return (
    <div className="mt-3">
      <div className="flex gap-1.5" aria-hidden="true">
        {Array.from({ length: segments }).map((_, index) => (
          <span
            key={index}
            className={`h-1.5 flex-1 rounded-full ${
              index < strength.score ? strength.color : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <p className="mt-1.5 text-sm font-medium text-gray-600">{strength.label}</p>

      <ul className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {rules.map((rule) => (
          <li
            key={rule.key}
            className={`flex items-center gap-2 text-sm ${
              rule.passed ? 'text-green-700' : 'text-gray-500'
            }`}
          >
            <span
              className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[10px] ${
                rule.passed ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}
              aria-hidden="true"
            >
              {rule.passed ? '✓' : ''}
            </span>
            {rule.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
