import React, { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Eye, EyeOff, Loader2, AlertCircle, ArrowRight } from 'lucide-react'
import { useAuth } from '../lib/AuthContext.jsx'

const ROLE_REDIRECT = {
  admin: '/dashboard/admin',
  inspector: '/dashboard/inspector',
  miner: '/dashboard/entity',
  artisan: '/dashboard/entity',
  aggregator: '/dashboard/entity',
  processing_center: '/dashboard/entity',
  assay: '/dashboard/entity',
  logistics: '/dashboard/entity',
  freight: '/dashboard/entity',
  security: '/dashboard/entity',
}

export default function LoginPage() {
  const { signIn, isPending } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const from = location.state?.from || '/dashboard'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) { setError('Please enter your email and password.'); return }
    setLoading(true)
    setError('')
    const result = await signIn(email.trim().toLowerCase(), password)
    setLoading(false)
    if (result.error) { setError(result.error); return }
    const role = result.entity?.role
    navigate(ROLE_REDIRECT[role] || '/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen flex">
      {/* LEFT — Dark brand panel */}
      <div className="hidden lg:flex w-[480px] xl:w-[560px] flex-col justify-between bg-[#060f1e] px-12 py-14 relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: `linear-gradient(rgba(0,180,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,180,255,0.5) 1px, transparent 1px)`, backgroundSize: '50px 50px' }} />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-15 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, #004C99, transparent 70%)', transform: 'translate(-30%, 30%)' }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
              <polygon points="20,2 36,11 36,29 20,38 4,29 4,11" fill="#004C99" stroke="#0070E0" strokeWidth="1.5" />
              <path d="M13 22 L17 18 L20 21 L24 15 L27 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
            <span className="font-display font-bold text-white text-xl tracking-tight">TraceChain</span>
          </div>
          <h2 className="font-display font-bold text-white text-4xl leading-tight mb-6">
            The mineral supply chain,<br />
            <span className="text-accent">verified on-chain.</span>
          </h2>
          <p className="font-body text-white/50 text-base leading-relaxed max-w-sm">
            Every gram tracked. Every entity verified. Every transaction timestamped and immutable.
          </p>
        </div>
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { label: 'Entities Registered', value: '—' },
            { label: 'Batches Traced', value: '—' },
            { label: 'Transactions Logged', value: '—' },
          ].map(stat => (
            <div key={stat.label} className="bg-white/5 border border-white/8 rounded-xl p-4">
              <p className="font-mono font-bold text-white text-xl mb-1">{stat.value}</p>
              <p className="font-body text-white/40 text-xs leading-tight">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT — Login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-surface">
        <div className="w-full max-w-md animate-fadeInUp">
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8">
              <polygon points="20,2 36,11 36,29 20,38 4,29 4,11" fill="#004C99" stroke="#0070E0" strokeWidth="1.5" />
              <path d="M13 22 L17 18 L20 21 L24 15 L27 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
            <span className="font-display font-bold text-primary text-lg">TraceChain</span>
          </div>
          <h1 className="font-display font-bold text-textPrimary text-3xl mb-1">Welcome back</h1>
          <p className="font-body text-textSecondary text-sm mb-8">Sign in to your TraceChain account.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-error/20 rounded-xl px-4 py-3.5">
                <AlertCircle className="w-4 h-4 text-error flex-shrink-0 mt-0.5" />
                <p className="text-sm font-body text-error">{error}</p>
              </div>
            )}
            {isPending && (
              <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3.5">
                <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-body text-yellow-700">Your account is pending verification. Some features may be restricted until approved.</p>
              </div>
            )}
            <div>
              <label className="form-label">Email Address</label>
              <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError('') }}
                placeholder="your@email.com" className="form-input" autoComplete="email" autoFocus />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="form-label mb-0">Password</label>
                <a href="#" className="text-xs text-primary font-display font-semibold hover:underline">Forgot password?</a>
              </div>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="Your password" className="form-input pr-11" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-white font-display font-semibold text-sm hover:bg-primary-600 shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 mt-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="flex items-center gap-3 my-7">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs font-body text-textSecondary">New to TraceChain?</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <Link to="/register"
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-primary text-primary font-display font-semibold text-sm hover:bg-primary hover:text-white transition-all duration-200">
            Register Your Entity
          </Link>
          <p className="text-center text-xs font-body text-textSecondary mt-8">
            By signing in you agree to the{' '}
            <a href="#" className="text-primary underline">Terms of Service</a> and{' '}
            <a href="#" className="text-primary underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
