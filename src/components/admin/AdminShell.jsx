import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, LogOut, Menu, Users, X, FileOutput } from 'lucide-react'
import { useAdminAuth } from '../../context/useAdminAuth'
import ConfirmDialog from './ConfirmDialog'

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/students', label: 'Students', icon: Users },
  { to: '/admin/import-export', label: 'Import/Export', icon: FileOutput },
]

export default function AdminShell({ children }) {
  const { signOut } = useAdminAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [confirmingLogout, setConfirmingLogout] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    await signOut()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-surface)' }}>
      <header
        className="sticky top-0 z-40 border-b"
        style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div>
            <p
              className="text-[0.65rem] font-black uppercase tracking-[0.18em]"
              style={{ color: 'var(--color-muted)' }}
            >
              SMCBI
            </p>
            <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
              Student Registration
            </p>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => (
              <NavItem key={item.to} item={item} />
            ))}
          </nav>

          <div className="hidden md:block">
            <button
              type="button"
              onClick={() => setConfirmingLogout(true)}
              className="flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-semibold transition hover:-translate-y-0.5"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((current) => !current)}
            className="rounded-lg p-2 md:hidden"
            style={{ color: 'var(--color-text)' }}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileOpen && (
          <nav
            className="flex flex-col gap-1 border-t px-4 py-3 md:hidden"
            style={{ borderColor: 'var(--color-border)' }}
          >
            {NAV_ITEMS.map((item) => (
              <NavItem key={item.to} item={item} onClick={() => setMobileOpen(false)} />
            ))}
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false)
                setConfirmingLogout(true)
              }}
              className="mt-1 flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm font-semibold"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}
            >
              <LogOut size={16} />
              Logout
            </button>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>

      {confirmingLogout && (
        <ConfirmDialog
          title="Sign out?"
          message="You'll need to sign in again to access the admin dashboard."
          confirmLabel="Logout"
          loading={loggingOut}
          onConfirm={handleLogout}
          onCancel={() => setConfirmingLogout(false)}
        />
      )}
    </div>
  )
}

function NavItem({ item, onClick }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
          isActive ? '' : 'hover:opacity-70'
        }`
      }
      style={({ isActive }) => ({
        backgroundColor: isActive ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)' : 'transparent',
        color: isActive ? 'var(--color-primary)' : 'var(--color-muted)',
      })}
    >
      <Icon size={16} />
      {item.label}
    </NavLink>
  )
}
