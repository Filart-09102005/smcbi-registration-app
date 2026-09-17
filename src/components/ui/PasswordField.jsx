import { useState } from 'react'
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
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-gray-800">
        {label}
        <span className="text-red-600"> *</span>
      </label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={visible ? 'text' : 'password'}
          value={value}
          autoComplete={autoComplete}
          onChange={(event) => onChange(name, event.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
          className={`min-h-[48px] w-full rounded-lg border bg-white px-4 py-3 pr-14 text-base text-gray-900 outline-none transition-colors focus:border-primary-700 focus:ring-2 focus:ring-primary-100 ${
            error ? 'border-red-400' : 'border-gray-300'
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          className="absolute inset-y-0 right-0 px-4 text-sm font-medium text-primary-700 hover:text-primary-900"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
      <div id={`${name}-error`}>
        <FieldError>{error}</FieldError>
      </div>
    </div>
  )
}
