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
  icon: Icon,
  rightElement,
}) {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-black auth-strong-text">
        {label}
        {required && <span style={{ color: 'var(--color-error)' }}> *</span>}
      </label>
      <div
        className="mt-2 flex h-[3.25rem] items-center gap-3 rounded-xl border px-4 auth-control"
        style={{ borderColor: error ? 'var(--color-error)' : undefined }}
      >
        {Icon ? <Icon size={18} style={{ color: 'var(--color-muted)' }} /> : null}
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
          className="w-full bg-transparent text-sm font-semibold outline-none"
        />
        {rightElement}
      </div>
      {helperText && !error && (
        <p className="mt-1.5 text-xs font-semibold auth-muted-text">{helperText}</p>
      )}
      <div id={`${name}-error`}>
        <FieldError>{error}</FieldError>
      </div>
    </div>
  )
}
