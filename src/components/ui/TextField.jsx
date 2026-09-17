import FieldError from './FieldError'

export default function TextField({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  type = 'text',
  placeholder,
  autoComplete,
  max,
  helperText,
  required = true,
  rightElement,
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-gray-800">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          max={max}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={(event) => onChange(name, event.target.value)}
          onBlur={onBlur}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
          className={`min-h-[48px] w-full rounded-lg border bg-white px-4 py-3 text-base text-gray-900 outline-none transition-colors focus:border-primary-700 focus:ring-2 focus:ring-primary-100 ${
            error ? 'border-red-400' : 'border-gray-300'
          } ${rightElement ? 'pr-12' : ''}`}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">{rightElement}</div>
        )}
      </div>
      {helperText && !error && <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>}
      <div id={`${name}-error`}>
        <FieldError>{error}</FieldError>
      </div>
    </div>
  )
}
