import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LogOut, Users, UserPlus, ShieldCheck,
  Activity, Loader2, AlertCircle,
} from 'lucide-react'
import { useAuth } from '../lib/AuthContext.jsx'
import { supabase, supabaseAdmin } from '../lib/supabase.js'
import { generateNexusID, generateBlockchainFingerprint } from '../lib/nexusId.js'

export default function AdminDashboard() {
  const { entity, signOut } = useAuth()
  const navigate = useNavigate()

  const [stats, setStats] = useState({ total: 0, pending: 0, verified: 0, rejected: 0 })
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createRole,     setCreateRole]     = useState('inspector')
  const [form,           setForm]           = useState({ full_name: '', email: '', password: '', phone: '' })
  const [creating,       setCreating]       = useState(false)
  const [createError,    setCreateError]    = useState('')
  const [createSuccess,  setCreateSuccess]  = useState('')

  useEffect(() => {
    const fetchStats = async () => {
      // Use service-role client so RLS doesn't filter out other users' rows
      const client = supabaseAdmin || supabase
      const { data } = await client
        .from('entities')
        .select('verification_status')
        .not('role', 'in', '(admin,inspector)')
      if (data) {
        setStats({
          total:    data.length,
          pending:  data.filter(e => e.verification_status === 'pending').length,
          verified: data.filter(e => e.verification_status === 'verified').length,
          rejected: data.filter(e => e.verification_status === 'rejected').length,
        })
      }
    }
    fetchStats()
  }, [])

  const handleCreateUser = async (e) => {
    e.preventDefault()
    if (!form.full_name || !form.email || !form.password) {
      setCreateError('Name, email and password are required.')
      return
    }

    setCreating(true)
    setCreateError('')
    setCreateSuccess('')

    try {
      // Guard: admin client requires service role key in .env
      if (!supabaseAdmin) {
        throw new Error(
          'Admin client not configured. Add VITE_SUPABASE_SERVICE_ROLE_KEY to your .env file.'
        )
      }

      // Step 1: Create Supabase Auth user (requires service role key)
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email:         form.email.trim().toLowerCase(),
          password:      form.password,
          email_confirm: true, // Skip email verification for system users
          user_metadata: { full_name: form.full_name },
        })

      if (authError) throw new Error(authError.message)

      // Step 2: Generate Nexus ID and blockchain fingerprint
      const nexusId    = generateNexusID(createRole)
      const fingerprint = await generateBlockchainFingerprint({
        nexus_id: nexusId,
        role:     createRole,
        email:    form.email,
      })

      // Step 3: Insert entity record linked to the new auth user
      // Use supabaseAdmin so the INSERT bypasses RLS (service role required for admin-created accounts)
      const { error: insertError } = await supabaseAdmin.from('entities').insert({
        nexus_id:              nexusId,
        role:                  createRole,
        full_name:             form.full_name,
        email:                 form.email.trim().toLowerCase(),
        phone:                 form.phone || null,
        auth_user_id:          authData.user.id,
        verification_status:   'verified',
        blockchain_fingerprint: fingerprint,
      })

      if (insertError) throw new Error(insertError.message)

      const roleLabel = createRole.charAt(0).toUpperCase() + createRole.slice(1)
      setCreateSuccess(`${roleLabel} created successfully. Nexus ID: ${nexusId}`)
      setForm({ full_name: '', email: '', password: '', phone: '' })

    } catch (err) {
      setCreateError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-surface">

      {/* Top nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-gray-100
        shadow-sm flex items-center px-6 gap-4">
        <div className="flex items-center gap-2.5">
          <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8">
            <polygon points="20,2 36,11 36,29 20,38 4,29 4,11"
              fill="#004C99" stroke="#0070E0" strokeWidth="1.5" />
            <path d="M13 22 L17 18 L20 21 L24 15 L27 18" stroke="white"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          <span className="font-display font-bold text-primary text-base">TraceChain</span>
        </div>
        <span className="px-2.5 py-1 bg-error/10 text-error text-xs font-display font-bold
          rounded-full uppercase tracking-wide">Admin</span>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm font-display font-semibold text-textPrimary hidden sm:block">
            {entity?.full_name}
          </span>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-sm font-display font-semibold
              text-textSecondary hover:text-error transition-colors px-3 py-2
              rounded-lg hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </nav>

      <div className="pt-24 px-6 max-w-5xl mx-auto pb-16">
        <div className="mb-8 flex items-center justify-between">
  <div>
    <h1 className="font-display font-bold text-2xl text-textPrimary mb-1">Admin Dashboard</h1>
    <p className="font-body text-textSecondary text-sm">System overview and user management.</p>
  </div>
  <a href="/dashboard/hq"
    className="flex items-center gap-2 btn-primary text-sm py-2.5">
    HQ Live Dashboard →
  </a>
</div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Entities', value: stats.total,    icon: Users,       color: 'text-primary', bg: 'bg-primary/10' },
            { label: 'Pending',        value: stats.pending,  icon: Activity,    color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { label: 'Verified',       value: stats.verified, icon: ShieldCheck, color: 'text-success', bg: 'bg-green-50' },
            { label: 'Rejected',       value: stats.rejected, icon: AlertCircle, color: 'text-error', bg: 'bg-red-50' },
          ].map(stat => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="card py-5">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <p className="font-display font-bold text-2xl text-textPrimary">{stat.value}</p>
                <p className="text-xs font-body text-textSecondary mt-0.5">{stat.label}</p>
              </div>
            )
          })}
        </div>

        {/* Create system user */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display font-bold text-textPrimary">Create System User</h2>
              <p className="text-sm font-body text-textSecondary mt-0.5">
                Add a new Admin or Inspector account.
              </p>
            </div>
            <button
              onClick={() => { setShowCreateForm(v => !v); setCreateError(''); setCreateSuccess('') }}
              className="flex items-center gap-2 btn-primary text-sm py-2.5"
            >
              <UserPlus className="w-4 h-4" />
              {showCreateForm ? 'Cancel' : 'Create User'}
            </button>
          </div>

          {showCreateForm && (
            <form onSubmit={handleCreateUser}
              className="border-t border-gray-100 pt-5 space-y-4 animate-fadeInUp">

              {createError && (
                <div className="flex items-start gap-2 bg-red-50 border border-error/20
                  rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-error flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-body text-error">{createError}</p>
                </div>
              )}
              {createSuccess && (
                <div className="flex items-start gap-2 bg-green-50 border border-green-200
                  rounded-xl px-4 py-3">
                  <ShieldCheck className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-body text-success">{createSuccess}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Role</label>
                  <select
                    value={createRole}
                    onChange={e => setCreateRole(e.target.value)}
                    className="form-input"
                  >
                    <option value="inspector">Inspector</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">
                    Full Name <span className="text-error text-xs">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                    className="form-input"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div>
                  <label className="form-label">
                    Email Address <span className="text-error text-xs">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="form-input"
                    placeholder="john@nordrock.com"
                  />
                </div>
                <div>
                  <label className="form-label">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="form-input"
                    placeholder="+234 000 0000"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="form-label">
                    Password <span className="text-error text-xs">*</span>
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="form-input"
                    placeholder="Minimum 8 characters"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="flex items-center gap-2 btn-primary text-sm
                  disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {creating
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                  : <><UserPlus className="w-4 h-4" />
                      Create {createRole.charAt(0).toUpperCase() + createRole.slice(1)}
                    </>
                }
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}