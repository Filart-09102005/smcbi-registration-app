import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

/**
 * Custom dropdown for the admin area, themed with --color-* tokens. A native
 * <select> renders its options popup via the OS and ignores our CSS, which
 * goes unreadable in dark mode - same reason the public registration side
 * has its own MiniSelect instead of a native <select>.
 */
export default function AdminSelect({ value, options, onChange, placeholder = 'All', className = '' }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  const selected = options.find((option) => String(option.value) === String(value))

  useEffect(() => {
    if (!open) return undefined
    const closeOnOutside = (event) => {
      if (rootRef.current?.contains(event.target)) return
      setOpen(false)
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-9 w-full items-center justify-between gap-1.5 rounded-lg border px-2.5 text-xs font-semibold outline-none transition"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown
          size={13}
          className={`flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          style={{ color: 'var(--color-muted)' }}
        />
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full z-[60] mt-1.5 max-h-56 overflow-y-auto rounded-lg border p-1 shadow-lg"
          style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
        >
          <button
            type="button"
            onClick={() => {
              onChange('')
              setOpen(false)
            }}
            className="flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-semibold"
            style={{ color: value ? 'var(--color-muted)' : 'var(--color-primary)' }}
          >
            {placeholder}
            {!value ? <Check size={13} /> : null}
          </button>
          {options.map((option) => {
            const isSelected = String(option.value) === String(value)
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
                className="flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-semibold"
                style={{
                  backgroundColor: isSelected
                    ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)'
                    : 'transparent',
                  color: isSelected ? 'var(--color-primary)' : 'var(--color-text)',
                }}
              >
                <span className="truncate">{option.label}</span>
                {isSelected ? <Check size={13} /> : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
