import { useState } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'
import FieldError from './FieldError'

export default function PasswordField({
  label,
  name,
  value,
  onChange,
  error,
  autoComplete = 'new-password',
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div>
      <label htmlFor={name} className="text-sm font-black auth-strong-text">
        {label}
        <span style={{ color: 'var(--color-error)' }}> *</span>
      </label>
      <div
        className="mt-2 flex h-[3.25rem] items-center gap-3 rounded-xl border px-4 auth-control"
        style={{ borderColor: error ? 'var(--color-error)' : undefined }}
      >
        <Lock size={18} style={{ color: 'var(--color-muted)' }} />
        <input
          id={name}
          name={name}
          type={visible ? 'text' : 'password'}
          value={value}
          autoComplete={autoComplete}
          onChange={(event) => onChange(name, event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
          className="w-full bg-transparent text-sm font-semibold outline-none"
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          className="rounded-lg p-1 transition hover:scale-105"
          style={{ color: 'var(--color-muted)' }}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      <div id={`${name}-error`}>
        <FieldError>{error}</FieldError>
      </div>
    </div>
  )
}
