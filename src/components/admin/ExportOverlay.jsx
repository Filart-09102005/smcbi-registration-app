import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  AlertTriangle,
  Check,
  Database,
  FileSpreadsheet,
  FileText,
  Loader2,
  RotateCcw,
  Wand2,
} from 'lucide-react'

/**
 * Generation overlay shown while a PDF/Excel export is being built, styled
 * after the SMCBI Health Kiosk's own ReportGenerationOverlay (same card,
 * glow, status badge, progress bar and stage checklist language) so exports
 * feel consistent across both admin surfaces rather than a plain silent
 * download.
 *
 * Simplified from the kiosk's version: that one drives a multi-minute
 * server-side report through a tuned perceived-progress curve. A client-side
 * spreadsheet/PDF build finishes in well under a second, so this ticks
 * through the same four stages on a fixed cadence in parallel with the real
 * work, and only advances to the success state once that work has actually
 * resolved.
 */

const STAGES = [
  { key: 'collect', label: 'Collecting registrations', icon: Database, ms: 260 },
  { key: 'format', label: 'Formatting record data', icon: FileSpreadsheet, ms: 260 },
  { key: 'build', label: 'Building the file', icon: Wand2, ms: 260 },
]

const MIN_VISIBLE_MS = 900
const SUCCESS_HOLD_MS = 1400

export default function ExportOverlay({ open, format, status, count = 0, truncated = false, resultAction = 'downloaded', onDone, onRetry }) {
  const [stageIndex, setStageIndex] = useState(0)
  const openedAtRef = useRef(0)

  const succeeded = status === 'success'
  const failed = status === 'error'
  const formatLabel = format === 'excel' ? 'Excel' : format === 'pdf' ? 'PDF' : 'export'
  const FormatIcon = format === 'excel' ? FileSpreadsheet : FileText

  // The overlay stays mounted across open/close (the parent just toggles
  // `open`), so resetting stageIndex when that prop flips has to happen
  // during render - React's documented pattern for this - rather than as a
  // synchronous setState at the top of an effect. The ref itself (and the
  // impure performance.now() read) stays in the effect below, since refs and
  // impure calls are only safe to touch outside of render.
  const [trackedOpen, setTrackedOpen] = useState(open)
  if (open !== trackedOpen) {
    setTrackedOpen(open)
    setStageIndex(0)
  }

  useEffect(() => {
    if (!open) {
      openedAtRef.current = 0
      return undefined
    }

    openedAtRef.current = performance.now()

    const timers = STAGES.slice(1).map((_, index) =>
      window.setTimeout(() => setStageIndex(index + 1), STAGES.slice(0, index + 1).reduce((sum, s) => sum + s.ms, 0)),
    )

    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [open])

  useEffect(() => {
    if (!open || !succeeded) return undefined

    const elapsed = performance.now() - openedAtRef.current
    const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed)

    const settleTimer = window.setTimeout(() => setStageIndex(STAGES.length), remaining)
    const closeTimer = window.setTimeout(() => onDone?.(), remaining + SUCCESS_HOLD_MS)

    return () => {
      window.clearTimeout(settleTimer)
      window.clearTimeout(closeTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, succeeded])

  if (!open) return null

  const tone = succeeded ? 'var(--color-success)' : failed ? 'var(--color-error)' : 'var(--color-primary)'
  const title = succeeded ? `${formatLabel} Export Ready` : failed ? `Unable to Generate ${formatLabel}` : `Generating ${formatLabel} Export`
  const blurb = succeeded
    ? count > 0
      ? `Your ${formatLabel} file has been ${resultAction}. ${count.toLocaleString()} ${count === 1 ? 'record' : 'records'} included.${
          truncated ? ' The result set was capped at this size - narrow your filters to get the rest.' : ''
        }`
      : `Your ${formatLabel} file has been ${resultAction}.`
    : failed
      ? "We couldn't complete this export. Please try again."
      : 'Preparing your file from the selected registrations.'

  const progressPercent = succeeded
    ? 100
    : Math.round(((stageIndex + 0.6) / STAGES.length) * 92)

  return createPortal(
    <div
      className="fixed inset-0 z-[9300] flex items-center justify-center px-4 py-6"
      style={{ backgroundColor: 'rgba(4, 8, 18, 0.55)', backdropFilter: 'blur(6px)' }}
      role="status"
      aria-live="polite"
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border p-6 shadow-2xl"
        style={{
          backgroundColor: 'var(--color-card)',
          borderColor: succeeded || failed
            ? `color-mix(in srgb, ${tone} 32%, var(--color-border))`
            : 'var(--color-border)',
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: tone }}
        />

        <div className="relative z-10 flex items-start gap-4">
          <div
            className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border"
            style={{
              backgroundColor: `color-mix(in srgb, ${tone} 12%, var(--color-surface))`,
              borderColor: `color-mix(in srgb, ${tone} 30%, transparent)`,
              color: tone,
            }}
          >
            {succeeded ? <Check size={26} strokeWidth={3} /> : failed ? <AlertTriangle size={24} /> : <FormatIcon size={24} />}
          </div>

          <div className="min-w-0 flex-1">
            <span
              className="inline-block rounded-md border px-2 py-0.5 text-[0.65rem] font-black uppercase tracking-widest"
              style={{
                backgroundColor: `color-mix(in srgb, ${tone} 14%, var(--color-surface))`,
                borderColor: `color-mix(in srgb, ${tone} 30%, transparent)`,
                color: tone,
              }}
            >
              {succeeded ? 'Export Ready' : failed ? 'Export Failed' : 'Generating'}
            </span>
            <h2 className="mt-2 text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              {title}
            </h2>
            <p className="mt-1 text-xs font-semibold leading-5" style={{ color: 'var(--color-muted)' }}>
              {blurb}
            </p>
          </div>
        </div>

        {!failed && (
          <div className="relative z-10 mt-5">
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="truncate text-xs font-bold" style={{ color: 'var(--color-text)' }}>
                {succeeded ? 'Done' : STAGES[Math.min(stageIndex, STAGES.length - 1)].label}
              </span>
              <span className="shrink-0 text-xs font-black tabular-nums" style={{ color: tone }}>
                {progressPercent}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: 'var(--color-border)' }}>
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${progressPercent}%`,
                  background: `linear-gradient(90deg, color-mix(in srgb, ${tone} 55%, transparent), ${tone})`,
                }}
              />
            </div>
          </div>
        )}

        {!failed && (
          <div className="relative z-10 mt-4 space-y-1.5">
            {STAGES.map((stage, index) => {
              const state = succeeded || index < stageIndex ? 'done' : index === stageIndex ? 'active' : 'pending'
              const rowTone = state === 'done' ? 'var(--color-success)' : state === 'active' ? 'var(--color-primary)' : 'var(--color-muted)'
              const Icon = stage.icon

              return (
                <div
                  key={stage.key}
                  className="flex items-center gap-2.5 rounded-xl border px-3 py-2 transition-opacity"
                  style={{
                    opacity: state === 'pending' ? 0.5 : 1,
                    backgroundColor: state === 'active' ? 'color-mix(in srgb, var(--color-primary) 8%, var(--color-surface))' : 'var(--color-surface)',
                    borderColor: state === 'active' ? 'color-mix(in srgb, var(--color-primary) 28%, transparent)' : 'var(--color-border)',
                  }}
                >
                  <span
                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `color-mix(in srgb, ${rowTone} 14%, transparent)`, color: rowTone }}
                  >
                    <Icon size={12} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
                    {stage.label}
                  </span>
                  {state === 'done' ? (
                    <Check size={14} style={{ color: rowTone }} />
                  ) : state === 'active' ? (
                    <Loader2 size={14} className="animate-spin" style={{ color: rowTone }} />
                  ) : (
                    <span className="block h-2 w-2 rounded-full border-2" style={{ borderColor: 'var(--color-muted)' }} />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {failed && (
          <div className="relative z-10 mt-5 flex gap-2">
            <button
              type="button"
              onClick={onRetry}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <RotateCcw size={15} />
              Try Again
            </button>
            <button
              type="button"
              onClick={onDone}
              className="rounded-xl border px-4 py-2.5 text-sm font-bold transition hover:-translate-y-0.5"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
