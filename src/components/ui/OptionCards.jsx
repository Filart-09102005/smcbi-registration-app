import FieldError from './FieldError'

export default function OptionCards({
  label,
  name,
  options,
  value,
  onChange,
  error,
  columns = 2,
}) {
  const gridClass = columns === 1 ? 'grid-cols-1' : 'grid-cols-2'

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-gray-800">
        {label}
        <span className="text-red-600"> *</span>
      </span>
      <div role="radiogroup" aria-label={label} className={`grid gap-3 ${gridClass}`}>
        {options.map((option) => {
          const selected = value === option.value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(name, option.value)}
              className={`min-h-[48px] rounded-lg border-2 px-4 py-3 text-left text-base font-medium transition-colors ${
                selected
                  ? 'border-primary-800 bg-primary-50 text-primary-900'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-primary-400'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
      <FieldError>{error}</FieldError>
    </div>
  )
}
