import { Check } from 'lucide-react'

const STEPS = [
  { number: 1, label: 'Role' },
  { number: 2, label: 'Academic' },
  { number: 3, label: 'Personal' },
  { number: 4, label: 'Account' },
  { number: 5, label: 'Review' },
]

export default function ProgressSteps({ currentStep }) {
  return (
    <div className="mb-8">
      <div className="flex items-center">
      {STEPS.map((step, index) => {
        const complete = currentStep > step.number
        const active = currentStep === step.number

        return (
          <div key={step.number} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border text-xs font-black"
                style={{
                  backgroundColor: active
                    ? 'color-mix(in srgb, var(--color-primary) 16%, transparent)'
                    : complete
                      ? 'var(--color-primary)'
                      : 'var(--auth-control)',
                  borderColor: active || complete ? 'var(--color-primary)' : 'var(--auth-border)',
                  color: active ? 'var(--color-primary)' : complete ? '#ffffff' : 'var(--auth-muted)',
                }}
                aria-current={active ? 'step' : undefined}
              >
                {complete ? <Check size={14} /> : step.number}
              </div>
              <span
                className="hidden whitespace-nowrap text-sm font-black sm:block"
                style={{ color: active || complete ? 'var(--auth-text)' : 'var(--auth-muted)' }}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 ? (
              <div className="mx-3 h-px flex-1" style={{ backgroundColor: 'var(--auth-border)' }} />
            ) : null}
          </div>
        )
      })}
      </div>
      <p className="mt-3 text-center text-sm font-semibold auth-muted-text sm:hidden">
        Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].label}
      </p>
    </div>
  )
}
