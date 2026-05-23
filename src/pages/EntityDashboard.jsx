import React from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Clock, CheckCircle2, XCircle, HardHat, Pickaxe, PackagePlus, Factory, FlaskConical, Truck, Globe, ShieldCheck } from 'lucide-react'
import { useAuth } from '../lib/AuthContext.jsx'

const ROLE_ICONS = {
  miner: HardHat, artisan: Pickaxe, aggregator: PackagePlus,
  processing_center: Factory, assay: FlaskConical,
  logistics: Truck, freight: Globe, security: ShieldCheck,
}

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', label: 'Pending Verification' },
  verified: { icon: CheckCircle2, color: 'text-success', bg: 'bg-green-50 border-green-200', label: 'Verified' },
  rejected: { icon: XCircle, color: 'text-error', bg: 'bg-red-50 border-red-200', label: 'Rejected' },
}

export default function EntityDashboard() {
  const { entity, signOut, nexusId, role } = useAuth()
  const navigate = useNavigate()
  const Icon = ROLE_ICONS[role] || HardHat
  const status = STATUS_CONFIG[entity?.verification_status] || STATUS_CONFIG.pending
  const StatusIcon = status.icon

  const handleSignOut = () => { signOut(); navigate('/login') }

  return (
    <div className="min-h-screen bg-surface">
      {/* Top Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-gray-100 shadow-sm flex items-center px-6 gap-4">
        <div className="flex items-center gap-2.5">
          <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8">
            <polygon points="20,2 36,11 36,29 20,38 4,29 4,11" fill="#004C99" stroke="#0070E0" strokeWidth="1.5" />
            <path d="M13 22 L17 18 L20 21 L24 15 L27 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          <span className="font-display font-bold text-primary text-base">TraceChain</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className={`badge-${entity?.verification_status || 'pending'} capitalize`}>
            {entity?.verification_status || 'pending'}
          </span>
          <span className="text-sm font-display font-semibold text-textPrimary hidden sm:block">
            {entity?.full_name}
          </span>
          <button onClick={handleSignOut}
            className="flex items-center gap-1.5 text-sm font-display font-semibold text-textSecondary hover:text-error transition-colors px-3 py-2 rounded-lg hover:bg-red-50">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </nav>

      <div className="pt-24 px-6 max-w-4xl mx-auto pb-16">
        {/* Welcome card */}
        <div className="bg-gradient-to-br from-primary to-primary-600 rounded-2xl px-8 py-7 text-white mb-6 animate-fadeInUp">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-white/60 text-xs font-display font-semibold uppercase tracking-widest mb-1">Welcome back</p>
              <h1 className="font-display font-bold text-2xl mb-1">{entity?.full_name}</h1>
              <p className="font-mono text-white/70 text-sm">{nexusId}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Status banner */}
        <div className={`flex items-start gap-3 border rounded-2xl px-5 py-4 mb-6 ${status.bg}`}>
          <StatusIcon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${status.color}`} />
          <div>
            <p className={`font-display font-bold text-sm ${status.color}`}>{status.label}</p>
            {entity?.verification_status === 'pending' && (
              <p className="font-body text-sm text-yellow-700 mt-0.5">
                Your registration is under review by a NordRock Inspector. You will be notified by email once approved. This typically takes 2–5 business days.
              </p>
            )}
            {entity?.verification_status === 'verified' && (
              <p className="font-body text-sm text-green-700 mt-0.5">
                Your account is verified. You now have full access to the TraceChain network.
              </p>
            )}
            {entity?.verification_status === 'rejected' && (
              <p className="font-body text-sm text-red-700 mt-0.5">
                Your registration was rejected. Please contact support for details.
              </p>
            )}
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {[
            { label: 'Role', value: role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) },
            { label: 'Email', value: entity?.email },
            { label: 'Country', value: entity?.country },
            { label: 'State / Region', value: entity?.state },
            { label: 'Phone', value: entity?.phone },
            { label: 'Registered', value: entity?.created_at ? new Date(entity.created_at).toLocaleDateString() : '—' },
          ].map(item => (
            <div key={item.label} className="card py-4">
              <p className="text-xs font-display font-semibold text-textSecondary uppercase tracking-widest mb-1">{item.label}</p>
              <p className="font-body text-textPrimary text-sm font-medium">{item.value || '—'}</p>
            </div>
          ))}
        </div>

        {/* Coming soon panel */}
        <div className="card text-center py-10">
          <p className="text-xs font-display font-semibold text-textSecondary uppercase tracking-widest mb-3">Coming in Step 6</p>
          <h3 className="font-display font-bold text-textPrimary text-lg mb-2">Supply Chain Activity</h3>
          <p className="font-body text-textSecondary text-sm max-w-sm mx-auto">
            Batch logging, Trace IDs, transaction history, and the live blockchain ledger feed will appear here.
          </p>
        </div>
      </div>
    </div>
  )
}
