import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import FieldError from './FieldError'

export default function OptionCards({ label, name, options, value, onChange, error, columns = 2 }) {
  const gridClass = columns === 1 ? 'grid-cols-1' : 'grid-cols-2'

  return (
    <div>
      <span className="text-sm font-black auth-strong-text">
        {label}
        <span style={{ color: 'var(--color-error)' }}> *</span>
      </span>
      <div role="radiogroup" aria-label={label} className={`mt-2 grid gap-3 ${gridClass}`}>
        {options.map((option) => {
          const selected = value === option.value
          return (
            <motion.button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(name, option.value)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="flex min-h-[48px] items-center justify-between gap-2 rounded-xl border px-4 py-3 text-left text-sm font-bold transition-colors"
              style={{
                backgroundColor: selected
                  ? 'color-mix(in srgb, var(--color-primary), transparent 88%)'
                  : 'var(--auth-panel)',
                borderColor: selected ? 'var(--color-primary)' : 'var(--auth-border)',
                color: selected ? 'var(--color-primary)' : 'var(--auth-text)',
                boxShadow: selected
                  ? '0 12px 30px color-mix(in srgb, var(--color-primary) 22%, transparent)'
                  : 'none',
              }}
            >
              {option.label}
              {selected ? <Check size={16} /> : null}
            </motion.button>
          )
        })}
      </div>
      <FieldError>{error}</FieldError>
    </div>
  )
}
