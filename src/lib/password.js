export const PASSWORD_RULES = [
  { key: 'minLength', label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { key: 'hasUpper', label: 'One uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { key: 'hasLower', label: 'One lowercase letter', test: (pw) => /[a-z]/.test(pw) },
  { key: 'hasNumber', label: 'One number', test: (pw) => /[0-9]/.test(pw) },
  {
    key: 'hasSymbol',
    label: 'One symbol (e.g. ! @ # $ %)',
    test: (pw) => /[^A-Za-z0-9]/.test(pw),
  },
]

export function evaluatePassword(password) {
  const pw = password || ''
  return PASSWORD_RULES.map((rule) => ({ ...rule, passed: rule.test(pw) }))
}

export function isPasswordValid(password) {
  return evaluatePassword(password).every((rule) => rule.passed)
}

export function getPasswordStrength(password) {
  const pw = password || ''
  if (!pw) return { score: 0, label: 'Enter a password' }

  const passedCount = evaluatePassword(pw).filter((rule) => rule.passed).length
  let score = passedCount
  if (pw.length >= 12) score += 1

  score = Math.min(score, 5)

  const levels = [
    { label: 'Very weak', color: 'bg-red-500' },
    { label: 'Weak', color: 'bg-red-500' },
    { label: 'Fair', color: 'bg-amber-500' },
    { label: 'Good', color: 'bg-amber-500' },
    { label: 'Strong', color: 'bg-green-600' },
    { label: 'Very strong', color: 'bg-green-600' },
  ]

  return { score, ...levels[score] }
}
