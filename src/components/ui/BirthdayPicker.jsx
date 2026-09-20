import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import FieldError from './FieldError'
import MiniSelect from './MiniSelect'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// Local calendar days throughout. ISO parsing would shift dates across
// timezones - "2006-08-04" lands on the 3rd west of UTC - so days are built
// and formatted component-wise instead of going through `new Date(iso)`.
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const today = () => startOfDay(new Date())
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
const sameDay = (a, b) =>
  a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

const toISO = (d) =>
  d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : ''

const fromISO = (value) => {
  if (!value) return null
  const [y, m, day] = String(value).split('-').map(Number)
  if (!y || !m || !day) return null
  return new Date(y, m - 1, day)
}

const longLabel = (d) => (d ? `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}` : '')

/** Six weeks of cells so every month occupies the same height. */
function buildMonthGrid(monthDate) {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const gridStart = addDays(first, -first.getDay())
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
}

/**
 * Calendar date-of-birth picker, styled to match the Health Kiosk's own
 * BirthdayPicker: month/year quick-jump plus a day grid, instead of the
 * browser's native <input type="date"> control.
 */
export default function BirthdayPicker({
  label = 'Birthday',
  name = 'birthday',
  value,
  onChange,
  placeholder = 'Select date of birth',
  yearsBack = 100,
  error,
  helperText,
  badge = null,
}) {
  const [open, setOpen] = useState(false)
  const [openUpward, setOpenUpward] = useState(false)
  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const panelRef = useRef(null)

  const selected = fromISO(value)
  const latest = today()

  const [viewMonth, setViewMonth] = useState(
    () => selected || new Date(latest.getFullYear() - 15, latest.getMonth(), 1),
  )

  const toggleOpen = () => {
    setOpen((current) => {
      const next = !current
      if (next && selected) setViewMonth(new Date(selected.getFullYear(), selected.getMonth(), 1))
      return next
    })
  }

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const panelHeight = panelRef.current?.offsetHeight || 360
    setOpenUpward(rect.bottom + 8 + panelHeight > window.innerHeight && rect.top > panelHeight + 8)
  }, [open])

  const monthOptions = useMemo(
    () => MONTHS.map((month, index) => ({ value: index, label: month })),
    [],
  )

  const yearOptions = useMemo(() => {
    const end = latest.getFullYear()
    return Array.from({ length: yearsBack + 1 }, (_, i) => ({ value: end - i, label: String(end - i) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearsBack])

  const days = useMemo(() => buildMonthGrid(viewMonth), [viewMonth])

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

  const pick = (day) => {
    if (day > latest) return
    onChange?.(name, toISO(day))
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-black auth-strong-text">
          {label}
          <span style={{ color: 'var(--color-error)' }}> *</span>
        </label>
        {badge}
      </div>

      <button
        ref={triggerRef}
        type="button"
        onClick={toggleOpen}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="mt-2 flex h-[3.25rem] w-full items-center gap-3 rounded-xl border px-4 text-sm font-semibold outline-none transition auth-control hover:-translate-y-0.5"
        style={{ borderColor: error ? 'var(--color-error)' : undefined }}
      >
        <CalendarDays size={18} style={{ color: 'var(--color-muted)' }} />
        <span className="truncate" style={{ color: selected ? 'var(--auth-text)' : 'var(--auth-muted)' }}>
          {selected ? longLabel(selected) : placeholder}
        </span>
      </button>

      {helperText && !error && (
        <p className="mt-1.5 text-xs font-semibold auth-muted-text">{helperText}</p>
      )}
      <FieldError>{error}</FieldError>

      <AnimatePresence>
        {open ? (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: openUpward ? 6 : -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: openUpward ? 4 : -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute z-50 w-[min(20rem,85vw)] rounded-2xl border p-3 shadow-2xl auth-panel ${
              openUpward ? 'bottom-full mb-2' : 'top-full mt-2'
            }`}
            style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--auth-border)' }}
            role="dialog"
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition hover:-translate-y-0.5"
                style={{ color: 'var(--auth-muted)' }}
                aria-label="Previous month"
              >
                <ChevronLeft size={16} />
              </button>

              <MiniSelect
                className="min-w-0 flex-1"
                value={viewMonth.getMonth()}
                options={monthOptions}
                onChange={(next) => setViewMonth((m) => new Date(m.getFullYear(), Number(next), 1))}
              />

              <MiniSelect
                className="w-[5.5rem] flex-shrink-0"
                value={viewMonth.getFullYear()}
                options={yearOptions}
                onChange={(next) => setViewMonth((m) => new Date(Number(next), m.getMonth(), 1))}
              />

              <button
                type="button"
                onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition hover:-translate-y-0.5"
                style={{ color: 'var(--auth-muted)' }}
                aria-label="Next month"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-7 gap-1">
              {WEEKDAYS.map((day) => (
                <span
                  key={day}
                  className="flex h-7 items-center justify-center text-[0.65rem] font-black uppercase auth-muted-text"
                >
                  {day}
                </span>
              ))}

              {days.map((day) => {
                const outside = day.getMonth() !== viewMonth.getMonth()
                const isSelected = sameDay(day, selected)
                const isToday = sameDay(day, today())
                const tooLate = day > latest

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    disabled={tooLate}
                    onClick={() => pick(day)}
                    className={`flex h-9 items-center justify-center rounded-xl text-xs font-black transition ${
                      tooLate ? 'cursor-not-allowed' : 'cursor-pointer hover:-translate-y-0.5'
                    }`}
                    style={{
                      backgroundColor: isSelected ? 'var(--color-primary)' : 'transparent',
                      color: isSelected
                        ? '#ffffff'
                        : tooLate
                          ? 'color-mix(in srgb, var(--color-muted) 45%, transparent)'
                          : outside
                            ? 'color-mix(in srgb, var(--color-muted) 70%, transparent)'
                            : 'var(--auth-text)',
                      boxShadow:
                        isToday && !isSelected
                          ? 'inset 0 0 0 1.5px color-mix(in srgb, var(--color-primary) 45%, transparent)'
                          : 'none',
                    }}
                  >
                    {day.getDate()}
                  </button>
                )
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
