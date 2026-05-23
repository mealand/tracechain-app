import React from 'react'
import { Check } from 'lucide-react'

const STEPS = [
  { number: 1, label: 'Profile Info' },
  { number: 2, label: 'Documents' },
  { number: 3, label: 'Review & Submit' },
]

export default function ProgressBar({ currentStep }) {
  return (
    <div className="flex items-center justify-center gap-0 w-full max-w-md mx-auto">
      {STEPS.map((step, i) => {
        const isComplete = currentStep > step.number
        const isActive = currentStep === step.number
        const isLast = i === STEPS.length - 1

        return (
          <React.Fragment key={step.number}>
            {/* Step bubble */}
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-sm
                transition-all duration-300 border-2
                ${isComplete
                  ? 'bg-accent border-accent text-white'
                  : isActive
                  ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30'
                  : 'bg-white border-gray-200 text-gray-400'
                }`}>
                {isComplete ? <Check className="w-4 h-4" /> : step.number}
              </div>
              <span className={`text-xs font-display font-semibold whitespace-nowrap transition-colors duration-300
                ${isActive ? 'text-primary' : isComplete ? 'text-accent' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div className="flex-1 h-0.5 mx-2 mb-5 rounded-full transition-all duration-500"
                style={{
                  background: isComplete
                    ? 'linear-gradient(90deg, #00B3A4, #004C99)'
                    : '#e5e7eb'
                }}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}
