import { useSyncExternalStore } from 'react'
import { MonitorCog, Moon, Sun } from 'lucide-react'

const STORAGE_KEY = 'smcbi-registration-theme'
const MODES = ['system', 'light', 'dark']

const prefersDark = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false

const resolveTheme = (mode) => (mode === 'system' ? (prefersDark() ? 'dark' : 'light') : mode)

function readStoredMode() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return MODES.includes(stored) ? stored : 'system'
  } catch {
    return 'system'
  }
}

let currentMode = typeof window === 'undefined' ? 'system' : readStoredMode()
let snapshot = { mode: currentMode, resolvedTheme: resolveTheme(currentMode) }
const listeners = new Set()

function paint() {
  if (typeof document === 'undefined') return snapshot.resolvedTheme

  const resolved = resolveTheme(currentMode)
  const root = document.documentElement

  if (root.getAttribute('data-theme') !== resolved) root.setAttribute('data-theme', resolved)

  return resolved
}

function publish() {
  const resolved = paint()
  if (snapshot.mode === currentMode && snapshot.resolvedTheme === resolved) return
  snapshot = { mode: currentMode, resolvedTheme: resolved }
  listeners.forEach((listener) => listener())
}

function setThemeMode(mode) {
  if (!MODES.includes(mode) || mode === currentMode) {
    if (mode === currentMode) paint()
    return
  }

  currentMode = mode
  try {
    window.localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    /* the theme still applies for this visit */
  }
  publish()
}

if (typeof window !== 'undefined' && !window.__smcbiThemeStoreReady) {
  window.__smcbiThemeStoreReady = true

  if (typeof window.matchMedia === 'function') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (currentMode === 'system') publish()
    })
  }

  paint()
}

const subscribe = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const getSnapshot = () => snapshot

function useThemeMode() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return { mode: state.mode, resolvedTheme: state.resolvedTheme, setMode: setThemeMode }
}

export default function ThemeToggle({ className = '' }) {
  const { mode, resolvedTheme, setMode } = useThemeMode()
  const Icon = mode === 'system' ? MonitorCog : resolvedTheme === 'dark' ? Moon : Sun

  const cycleTheme = () => {
    const currentIndex = MODES.indexOf(mode)
    setMode(MODES[(currentIndex + 1) % MODES.length])
  }

  return (
    <button
      type="button"
      onClick={cycleTheme}
      aria-label="Change appearance"
      className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-black auth-panel auth-muted-text transition hover:-translate-y-0.5 ${className}`}
      style={{ borderColor: 'var(--auth-border)' }}
    >
      <Icon size={15} />
      <span className="hidden sm:inline">
        {mode === 'system' ? 'System' : mode === 'dark' ? 'Dark' : 'Light'}
      </span>
    </button>
  )
}
