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
          const isComplete = currentStep > step.number
          const isActive = currentStep === step.number

          return (
            <div key={step.number} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    isComplete
                      ? 'bg-primary-800 text-white'
                      : isActive
                        ? 'border-2 border-primary-800 bg-white text-primary-800'
                        : 'border-2 border-gray-300 bg-white text-gray-400'
                  }`}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {isComplete ? '✓' : step.number}
                </div>
                <span
                  className={`mt-1.5 hidden text-xs font-medium sm:block ${
                    isActive ? 'text-primary-900' : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`mx-1 h-0.5 flex-1 ${
                    isComplete ? 'bg-primary-800' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
      <p className="mt-3 text-center text-sm font-medium text-gray-500 sm:hidden">
        Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].label}
      </p>
    </div>
  )
}
