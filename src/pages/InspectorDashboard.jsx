import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Clock, CheckCircle2, XCircle, Search } from 'lucide-react'
import { useAuth } from '../lib/AuthContext.jsx'
import { supabase, supabaseAdmin } from '../lib/supabase.js'

export default function InspectorDashboard() {
  const { entity, signOut } = useAuth()
  const navigate = useNavigate()
  const [entities, setEntities] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchEntities = async () => {
      setLoading(true)
      // Use service-role client so RLS doesn't restrict cross-entity reads
      const client = supabaseAdmin || supabase
      const query = client
        .from('entities')
        .select('id, nexus_id, full_name, role, email, verification_status, created_at')
        .not('role', 'in', '(admin,inspector)')
        .order('created_at', { ascending: false })

      if (filter !== 'all') query.eq('verification_status', filter)

      const { data, error } = await query
      if (!error) setEntities(data || [])
      setLoading(false)
    }
    fetchEntities()
  }, [filter])

  const handleVerify = async (id, status) => {
    // Use service-role client so the UPDATE bypasses RLS (inspectors cannot UPDATE other users' rows)
    const client = supabaseAdmin || supabase
    await client.from('entities').update({
      verification_status: status,
      verified_by: entity?.id,
      verified_at: new Date().toISOString(),
    }).eq('id', id)
    setEntities(prev => prev.map(e => e.id === id ? { ...e, verification_status: status } : e))
  }

  const filtered = entities.filter(e =>
    e.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    e.nexus_id?.toLowerCase().includes(search.toLowerCase()) ||
    e.email?.toLowerCase().includes(search.toLowerCase())
  )

  const handleSignOut = async () => { await signOut(); navigate('/login') }

  return (
    <div className="min-h-screen bg-surface">
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-gray-100 shadow-sm flex items-center px-6 gap-4">
        <div className="flex items-center gap-2.5">
          <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8">
            <polygon points="20,2 36,11 36,29 20,38 4,29 4,11" fill="#004C99" stroke="#0070E0" strokeWidth="1.5" />
            <path d="M13 22 L17 18 L20 21 L24 15 L27 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          <span className="font-display font-bold text-primary text-base">TraceChain</span>
        </div>
        <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-display font-bold rounded-full uppercase tracking-wide">Inspector</span>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm font-display font-semibold text-textPrimary hidden sm:block">{entity?.full_name}</span>
          <button onClick={handleSignOut}
            className="flex items-center gap-1.5 text-sm font-display font-semibold text-textSecondary hover:text-error transition-colors px-3 py-2 rounded-lg hover:bg-red-50">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </nav>

      <div className="pt-24 px-6 max-w-5xl mx-auto pb-16">
        <div className="mb-8">
          <h1 className="font-display font-bold text-2xl text-textPrimary mb-1">Entity Verification Queue</h1>
          <p className="font-body text-textSecondary text-sm">Review and approve or reject entity registrations.</p>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, Nexus ID, or email..."
              className="form-input pl-9 text-sm" />
          </div>
          <div className="flex gap-2">
            {['all', 'pending', 'verified', 'rejected'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2.5 rounded-xl text-xs font-display font-bold capitalize transition-all
                  ${filter === f ? 'bg-primary text-white shadow-sm' : 'bg-white border border-gray-200 text-textSecondary hover:border-primary hover:text-primary'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden p-0">
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-body text-textSecondary">Loading registrations...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-display font-semibold text-textSecondary">No entities found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-secondary">
                    {['Nexus ID', 'Name', 'Role', 'Email', 'Registered', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left text-xs font-display font-bold text-textSecondary uppercase tracking-widest px-5 py-3.5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(e => (
                    <tr key={e.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-4"><span className="font-mono text-xs text-primary font-semibold">{e.nexus_id}</span></td>
                      <td className="px-5 py-4"><span className="font-body text-sm text-textPrimary font-medium">{e.full_name}</span></td>
                      <td className="px-5 py-4"><span className="text-xs font-display font-semibold text-textSecondary capitalize">{e.role?.replace('_', ' ')}</span></td>
                      <td className="px-5 py-4"><span className="font-body text-xs text-textSecondary">{e.email}</span></td>
                      <td className="px-5 py-4"><span className="font-body text-xs text-textSecondary">{new Date(e.created_at).toLocaleDateString()}</span></td>
                      <td className="px-5 py-4">
                        <span className={`badge-${e.verification_status} capitalize`}>{e.verification_status}</span>
                      </td>
                      <td className="px-5 py-4">
                        {e.verification_status === 'pending' && (
                          <div className="flex gap-2">
                            <button onClick={() => handleVerify(e.id, 'verified')}
                              className="flex items-center gap-1 px-3 py-1.5 bg-success/10 text-success border border-success/20 rounded-lg text-xs font-display font-bold hover:bg-success hover:text-white transition-all">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button onClick={() => handleVerify(e.id, 'rejected')}
                              className="flex items-center gap-1 px-3 py-1.5 bg-error/10 text-error border border-error/20 rounded-lg text-xs font-display font-bold hover:bg-error hover:text-white transition-all">
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </div>
                        )}
                        {e.verification_status !== 'pending' && (
                          <span className="text-xs text-textSecondary font-body italic">Actioned</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}