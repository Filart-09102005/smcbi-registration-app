import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown } from 'lucide-react'

/**
 * Compact custom dropdown used where a native <select> won't do - its
 * options popup is rendered by the OS and ignores our dark-mode CSS
 * entirely, so it goes unreadable in dark mode. Mirrors the Health Kiosk's
 * CustomSelectField, scoped down to what BirthdayPicker's month/year
 * controls need.
 */
export default function MiniSelect({ value, options, onChange, className = '' }) {
  const [open, setOpen] = useState(false)
  const [openUpward, setOpenUpward] = useState(false)
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

  const toggleOpen = () => {
    if (!open && rootRef.current) {
      const rect = rootRef.current.getBoundingClientRect()
      setOpenUpward(window.innerHeight - rect.bottom < 260 && rect.top > 260)
    }
    setOpen((current) => !current)
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={toggleOpen}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-9 w-full items-center justify-between gap-1.5 rounded-lg border px-2 text-xs font-black outline-none transition auth-control"
      >
        <span className="truncate">{selected ? selected.label : ''}</span>
        <ChevronDown
          size={13}
          className={`flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          style={{ color: 'var(--color-muted)' }}
        />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: openUpward ? 6 : -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: openUpward ? 4 : -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            role="listbox"
            className={`absolute left-0 right-0 z-[60] max-h-56 overflow-y-auto hk-auth-form-scroll rounded-xl border p-1.5 shadow-2xl ${
              openUpward ? 'bottom-full mb-2' : 'top-full mt-1.5'
            }`}
            style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--auth-border)' }}
          >
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
                  className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs font-black transition"
                  style={{
                    backgroundColor: isSelected
                      ? 'color-mix(in srgb, var(--color-primary) 14%, transparent)'
                      : 'transparent',
                    color: isSelected ? 'var(--color-primary)' : 'var(--auth-text)',
                  }}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected ? <Check size={13} /> : null}
                </button>
              )
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
