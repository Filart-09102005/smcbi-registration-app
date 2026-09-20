import { CheckCircle2, GraduationCap, Sparkles } from 'lucide-react'
import ThemeToggle from '../ui/ThemeToggle'

export default function PortalShell({ children, eyebrow, title, subtitle }) {
  return (
    <main className="auth-screen min-h-screen px-5 py-6">
      <div className="fixed right-6 top-6 z-30">
        <ThemeToggle />
      </div>

      <section className="relative z-10 mx-auto grid w-full max-w-7xl items-start gap-10 py-10 lg:min-h-[calc(100vh-3rem)] lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="hidden flex-col justify-center gap-10 py-6 lg:flex lg:pl-10">
          <BrandLockup />

          <div className="mx-auto w-full max-w-md text-center">
            <h1 className="text-3xl font-black leading-tight auth-strong-text md:text-4xl">
              Student Pre-Registration
            </h1>
            <p className="mx-auto mt-5 max-w-sm text-base font-semibold leading-8 auth-muted-text">
              Register your information online. It's reviewed and imported into the SMCBI Health
              Kiosk — no need to fill anything out again at the kiosk itself.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-2">
              <StatusPill icon={CheckCircle2} label="No password needed - just your information" />
              <StatusPill icon={GraduationCap} label="Student Portal" />
              <StatusPill icon={Sparkles} label="~3-5 Minutes" />
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[480px] py-6 pr-1">
          {eyebrow ? <p className="auth-eyebrow" style={{ color: '#22d3ee' }}>{eyebrow}</p> : null}
          {title ? (
            <h2 className="mt-2 text-3xl font-black tracking-normal auth-strong-text md:text-4xl">
              {title}
            </h2>
          ) : null}
          {subtitle ? (
            <p className="mt-3 text-base font-semibold leading-6 auth-muted-text">{subtitle}</p>
          ) : null}

          <div className={eyebrow || title || subtitle ? 'mt-8' : ''}>{children}</div>
        </div>
      </section>

      <div className="relative z-10 mx-auto max-w-7xl pb-4 text-center lg:pl-10 lg:text-left">
        <p className="text-xs font-semibold auth-muted-text">
          SMCBI &middot; Health Kiosk Pre-Registration
        </p>
        <p className="mt-0.5 text-[0.68rem] font-semibold auth-muted-text opacity-70">
          Developed by Hans Filart &middot; 4th Yr BSIT
        </p>
      </div>
    </main>
  )
}

function BrandLockup() {
  return (
    <div className="mx-auto flex w-full max-w-md items-center gap-4">
      <div className="auth-logo">
        <GraduationCap size={28} />
      </div>
      <div>
        <div className="text-2xl font-black leading-none auth-strong-text">SMCBI</div>
        <div className="mt-2 text-xs font-black uppercase tracking-[0.24em] auth-muted-text">
          Student Pre-Registration Portal
        </div>
      </div>
    </div>
  )
}

function StatusPill({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2 rounded-full border auth-panel px-4 py-2 text-xs font-black auth-muted-text">
      <Icon size={14} style={{ color: 'var(--color-primary)' }} />
      {label}
    </div>
  )
}
