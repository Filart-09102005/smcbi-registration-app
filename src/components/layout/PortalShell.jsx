export default function PortalShell({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4 sm:px-6">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary-800 text-base font-bold text-white">
            S
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight text-gray-900">SMCBI</p>
            <p className="text-xs leading-tight text-gray-500">Student Pre-Registration Portal</p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">{children}</main>

      <footer className="border-t border-gray-200 bg-white py-4">
        <p className="mx-auto max-w-2xl px-4 text-center text-xs text-gray-400 sm:px-6">
          SMCBI &middot; Health Kiosk Pre-Registration
        </p>
      </footer>
    </div>
  )
}
