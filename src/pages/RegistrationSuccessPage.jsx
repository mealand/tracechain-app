import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CheckCircle2, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import Navbar from '../components/layout/Navbar.jsx'

export default function RegistrationSuccessPage() {
  const { state } = useLocation()
  const nexusId = state?.nexusId || 'N/A'
  const fullName = state?.fullName || 'Applicant'
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(nexusId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navbar variant="light" />
      <div className="flex items-center justify-center min-h-screen pt-16 px-4 py-12">
        <div className="w-full max-w-lg animate-fadeInUp">

          {/* Success card */}
          <div className="card text-center mb-4">
            {/* Icon */}
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>

            <h1 className="text-2xl font-display font-bold text-textPrimary mb-2">
              Registration Submitted!
            </h1>
            <p className="text-textSecondary font-body text-sm leading-relaxed mb-8 max-w-sm mx-auto">
              Thank you, <strong>{fullName}</strong>. Your application is under review by a NordRock TraceChain Inspector. You will receive an email when your account is approved.
            </p>

            {/* Nexus ID display */}
            <div className="bg-[#060f1e] rounded-2xl px-6 py-5 mb-6">
              <p className="text-xs font-display font-semibold text-white/40 uppercase tracking-widest mb-2">
                Your Nexus ID (save this)
              </p>
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-xl font-bold text-white tracking-wider">{nexusId}</p>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20
                    text-white text-xs font-display font-semibold transition-all duration-200"
                >
                  {copied ? <><Check className="w-3.5 h-3.5 text-accent" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                </button>
              </div>
            </div>

            {/* What happens next */}
            <div className="text-left space-y-3 mb-8">
              {[
                { label: 'Blockchain recorded', desc: 'Your Nexus ID has been fingerprinted on the TraceChain ledger.' },
                { label: 'Under review', desc: 'An Inspector will verify your documents within 2–5 business days.' },
                { label: 'Email notification', desc: 'You will receive an email with your approval or rejection status.' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-secondary rounded-xl">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary text-xs font-display font-bold">{i + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm font-display font-semibold text-textPrimary">{item.label}</p>
                    <p className="text-xs font-body text-textSecondary mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-center">
              <Link to="/register" className="btn-outline text-sm">Register Another Entity</Link>
              <Link to="/login" className="btn-primary text-sm">Track My Application</Link>
            </div>
          </div>

          <p className="text-center text-xs font-body text-textSecondary">
            Questions? Contact <a href="mailto:support@nordrock.com" className="text-primary underline">support@nordrock.com</a>
          </p>
        </div>
      </div>
    </div>
  )
}
