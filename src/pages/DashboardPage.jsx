import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LogOut, Users, Package, ArrowRightLeft, ShieldCheck,
  TrendingUp, Activity, Clock, CheckCircle2, XCircle,
  HardHat, Pickaxe, PackagePlus, Factory, FlaskConical,
  Truck, Globe, AlertCircle, Loader2, RefreshCw,
} from 'lucide-react'
import { useAuth } from '../lib/AuthContext.jsx'
import { supabase, supabaseAdmin } from '../lib/supabase.js'

/* ─── Role icon map ──────────────────────────────────────────────── */
const ROLE_ICONS = {
  miner: HardHat, artisan: Pickaxe, aggregator: PackagePlus,
  processing_center: Factory, assay: FlaskConical,
  logistics: Truck, freight: Globe, security: ShieldCheck,
}

const STAGE_COLORS = {
  mined:       'bg-amber-50 text-amber-700 border-amber-200',
  aggregated:  'bg-blue-50 text-blue-700 border-blue-200',
  processed:   'bg-purple-50 text-purple-700 border-purple-200',
  transported: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  assayed:     'bg-indigo-50 text-indigo-700 border-indigo-200',
  exported:    'bg-green-50 text-green-700 border-green-200',
}

/* ─── Small shared components ────────────────────────────────────── */
function StatusPill({ value, colorMap }) {
  const cls = colorMap?.[value] || 'bg-gray-100 text-gray-600 border-gray-200'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${cls}`}>
      {(value || '').replace(/_/g, ' ')}
    </span>
  )
}

function StatCard({ label, value, icon: Icon, color, bg }) {
  return (
    <div className="card py-5">
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <p className="font-display font-bold text-2xl text-textPrimary">{value}</p>
      <p className="text-xs font-body text-textSecondary mt-0.5">{label}</p>
    </div>
  )
}

function LiveDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
    </span>
  )
}

function SectionTitle({ children }) {
  return (
    <h2 className="font-display font-bold text-base text-textPrimary mb-4 flex items-center gap-2">
      {children}
    </h2>
  )
}

/* ─── Main Dashboard ─────────────────────────────────────────────── */
export default function DashboardPage() {
  const { entity, signOut } = useAuth()
  const navigate = useNavigate()

  const [stats, setStats] = useState({
    totalEntities: 0, pending: 0, verified: 0, rejected: 0,
    totalBatches: 0, activeBatches: 0, mineralTypes: 0,
    totalTransactions: 0, stagesRecorded: 0, lastActivity: null,
  })
  const [recentEntities,     setRecentEntities]     = useState([])
  const [recentBatches,      setRecentBatches]      = useState([])
  const [recentTransactions, setRecentTransactions] = useState([])
  const [loading,            setLoading]            = useState(true)
  const [lastUpdated,        setLastUpdated]        = useState(null)
  const [liveActivity,       setLiveActivity]       = useState([])

  const handleSignOut = async () => { await signOut(); navigate('/login') }

  /* ── Fetch all data ── */
  const fetchData = useCallback(async () => {
    const client = supabaseAdmin || supabase
    try {
      const [entitiesRes, batchesRes, txRes] = await Promise.all([
        client
          .from('entities')
          .select('id, full_name, role, nexus_id, verification_status, created_at, email')
          .not('role', 'in', '(admin,inspector)')
          .order('created_at', { ascending: false }),
        client
          .from('batches')
          .select('id, trace_id, mineral_type, quantity_kg, unit, status, current_stage, created_at, origin_location')
          .order('created_at', { ascending: false }),
        client
          .from('transactions')
          .select(`
            id, stage, quantity_kg, location, timestamp,
            batch:batches ( trace_id, mineral_type ),
            sender:entities!transactions_from_entity_fkey ( full_name, role, nexus_id ),
            recipient:entities!transactions_to_entity_fkey ( full_name, role, nexus_id )
          `)
          .order('timestamp', { ascending: false })
          .limit(20),
      ])

      const entities = entitiesRes.data || []
      const batches  = batchesRes.data  || []
      const txs      = txRes.data       || []

      setStats({
        totalEntities:     entities.length,
        pending:           entities.filter(e => e.verification_status === 'pending').length,
        verified:          entities.filter(e => e.verification_status === 'verified').length,
        rejected:          entities.filter(e => e.verification_status === 'rejected').length,
        totalBatches:      batches.length,
        activeBatches:     batches.filter(b => b.status === 'active' || b.status === 'in_transit').length,
        mineralTypes:      [...new Set(batches.map(b => b.mineral_type))].length,
        totalTransactions: txs.length,
        stagesRecorded:    [...new Set(txs.map(t => t.stage))].length,
        lastActivity:      txs[0]?.timestamp || null,
      })

      setRecentEntities(entities.slice(0, 5))
      setRecentBatches(batches.slice(0, 5))
      setRecentTransactions(txs.slice(0, 5))
      setLastUpdated(new Date())
    } finally {
      setLoading(false)
    }
  }, [])

  /* ── Real-time subscriptions ── */
  useEffect(() => {
    fetchData()

    const addActivity = (msg) => {
      setLiveActivity(prev => [{ id: Date.now(), msg, time: new Date() }, ...prev].slice(0, 8))
    }

    const entitySub = supabase
      .channel('hq-entities')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'entities' }, (payload) => {
        if (['admin', 'inspector'].includes(payload.new?.role)) return
        if (payload.eventType === 'INSERT')
          addActivity(`New entity registered: ${payload.new.full_name} (${payload.new.role?.replace('_', ' ')})`)
        if (payload.eventType === 'UPDATE' && payload.new.verification_status !== payload.old?.verification_status)
          addActivity(`Entity ${payload.new.full_name} status → ${payload.new.verification_status}`)
        fetchData()
      })
      .subscribe()

    const batchSub = supabase
      .channel('hq-batches')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'batches' }, (payload) => {
        addActivity(`New batch: ${payload.new.trace_id} — ${payload.new.mineral_type}`)
        fetchData()
      })
      .subscribe()

    const txSub = supabase
      .channel('hq-transactions')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, (payload) => {
        addActivity(`Transaction recorded: stage ${payload.new.stage} — ${payload.new.quantity_kg}kg`)
        fetchData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(entitySub)
      supabase.removeChannel(batchSub)
      supabase.removeChannel(txSub)
    }
  }, [fetchData])

  return (
    <div className="min-h-screen bg-surface">

      {/* ── Navbar ── */}
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
        <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-display font-bold
          rounded-full uppercase tracking-wide">HQ</span>
        <div className="ml-auto flex items-center gap-4">
          {lastUpdated && (
            <div className="hidden sm:flex items-center gap-2 text-xs font-body text-textSecondary">
              <LiveDot />
              <span>Live · updated {lastUpdated.toLocaleTimeString()}</span>
            </div>
          )}
          <button onClick={fetchData}
            className="flex items-center gap-1.5 text-xs font-display font-semibold
              text-textSecondary hover:text-primary transition-colors px-2 py-1.5
              rounded-lg hover:bg-secondary">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <span className="text-sm font-display font-semibold text-textPrimary hidden sm:block">
            {entity?.full_name}
          </span>
          <button onClick={handleSignOut}
            className="flex items-center gap-1.5 text-sm font-display font-semibold
              text-textSecondary hover:text-error transition-colors px-3 py-2
              rounded-lg hover:bg-red-50">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </nav>

      <div className="pt-24 px-4 sm:px-6 max-w-7xl mx-auto pb-16">

        <div className="mb-8">
          <h1 className="font-display font-bold text-2xl text-textPrimary mb-1">
            NordRock HQ Dashboard
          </h1>
          <p className="font-body text-textSecondary text-sm">
            Live supply chain overview — data updates automatically as activity occurs.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 gap-3 text-textSecondary">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="font-body text-sm">Loading live data…</span>
          </div>
        ) : (
          <>
            {/* ── Entity stats ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <StatCard label="Total Entities"  value={stats.totalEntities}  icon={Users}        color="text-primary"    bg="bg-primary/10" />
              <StatCard label="Verified"         value={stats.verified}       icon={CheckCircle2} color="text-success"    bg="bg-green-50" />
              <StatCard label="Pending Review"   value={stats.pending}        icon={Clock}        color="text-yellow-600" bg="bg-yellow-50" />
              <StatCard label="Rejected"         value={stats.rejected}       icon={XCircle}      color="text-error"      bg="bg-red-50" />
            </div>

            {/* ── Batch stats ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
              <StatCard label="Total Batches"       value={stats.totalBatches}      icon={Package}    color="text-accent"     bg="bg-accent/10" />
              <StatCard label="Active Batches"      value={stats.activeBatches}     icon={TrendingUp} color="text-primary"    bg="bg-primary/10" />
              <StatCard label="Mineral Types"       value={stats.mineralTypes}      icon={Activity}   color="text-purple-600" bg="bg-purple-50" />
            </div>

            {/* ── Main grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

              {/* Recent registrations */}
              <div className="card lg:col-span-1">
                <SectionTitle><Users className="w-4 h-4 text-primary" /> Recent Registrations</SectionTitle>
                {recentEntities.length === 0 ? (
                  <p className="text-sm font-body text-textSecondary text-center py-8">No entities registered yet.</p>
                ) : (
                  <div className="space-y-3">
                    {recentEntities.map(e => {
                      const Icon = ROLE_ICONS[e.role] || ShieldCheck
                      return (
                        <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-display font-semibold text-sm text-textPrimary truncate">{e.full_name}</p>
                            <p className="font-mono text-xs text-textSecondary truncate">{e.nexus_id}</p>
                          </div>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize flex-shrink-0
                            ${e.verification_status === 'verified'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : e.verification_status === 'pending'
                              ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                              : 'bg-red-50 text-red-700 border-red-200'}`}>
                            {e.verification_status}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Recent batches */}
              <div className="card lg:col-span-2">
                <SectionTitle><Package className="w-4 h-4 text-accent" /> Recent Batches</SectionTitle>
                {recentBatches.length === 0 ? (
                  <p className="text-sm font-body text-textSecondary text-center py-8">No batches created yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          {['Trace ID', 'Mineral', 'Quantity', 'Stage', 'Status'].map(h => (
                            <th key={h} className="text-left text-xs font-display font-bold text-textSecondary
                              uppercase tracking-widest pb-3 pr-4">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {recentBatches.map(b => (
                          <tr key={b.id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="py-3 pr-4">
                              <span className="font-mono text-xs text-primary font-semibold">{b.trace_id}</span>
                            </td>
                            <td className="py-3 pr-4">
                              <span className="font-body text-sm text-textPrimary">{b.mineral_type}</span>
                            </td>
                            <td className="py-3 pr-4">
                              <span className="font-body text-sm text-textPrimary">{b.quantity_kg} {b.unit}</span>
                            </td>
                            <td className="py-3 pr-4">
                              <StatusPill value={b.current_stage} colorMap={STAGE_COLORS} />
                            </td>
                            <td className="py-3">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border capitalize
                                ${b.status === 'active' ? 'bg-green-50 text-green-700 border-green-200'
                                : b.status === 'exported' ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                {b.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* ── Transactions + Live feed ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Recent transactions */}
              <div className="card lg:col-span-2">
                <SectionTitle><ArrowRightLeft className="w-4 h-4 text-primary" /> Recent Transactions</SectionTitle>
                {recentTransactions.length === 0 ? (
                  <p className="text-sm font-body text-textSecondary text-center py-8">No transactions recorded yet.</p>
                ) : (
                  <div className="space-y-3">
                    {recentTransactions.map(tx => (
                      <div key={tx.id} className="p-4 rounded-xl border border-gray-100 hover:border-primary/20 transition-colors">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs text-primary font-semibold">
                              {tx.batch?.trace_id || '—'}
                            </span>
                            <StatusPill value={tx.stage} colorMap={STAGE_COLORS} />
                          </div>
                          <span className="font-display font-bold text-sm text-textPrimary flex-shrink-0">
                            {tx.quantity_kg} kg
                          </span>
                        </div>
                        <p className="text-xs font-body text-textSecondary">
                          <span className="font-semibold text-textPrimary">{tx.sender?.full_name || '—'}</span>
                          {' → '}
                          <span className="font-semibold text-textPrimary">{tx.recipient?.full_name || '—'}</span>
                        </p>
                        {tx.location && (
                          <p className="text-xs font-body text-textSecondary mt-1">📍 {tx.location}</p>
                        )}
                        <p className="text-xs font-body text-textSecondary mt-1">
                          {new Date(tx.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Live activity feed */}
              <div className="card lg:col-span-1">
                <SectionTitle><LiveDot /> Live Activity Feed</SectionTitle>
                {liveActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-xs font-body text-textSecondary">Waiting for activity…</p>
                    <p className="text-xs font-body text-textSecondary mt-1 leading-relaxed">
                      Events appear here in real time as entities register, batches are created, and transactions are recorded.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {liveActivity.map(a => (
                      <div key={a.id} className="flex items-start gap-2.5 animate-fadeInUp">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0 mt-1.5" />
                        <div>
                          <p className="text-xs font-body text-textPrimary leading-snug">{a.msg}</p>
                          <p className="text-xs font-body text-textSecondary mt-0.5">
                            {a.time.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Supply chain summary bar ── */}
            <div className="card mt-6">
              <SectionTitle><Activity className="w-4 h-4 text-primary" /> Supply Chain Summary</SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Total transactions',   value: stats.totalTransactions },
                  { label: 'Stages recorded',      value: stats.stagesRecorded },
                  { label: 'Mineral types traced', value: stats.mineralTypes },
                  { label: 'Last activity',        value: stats.lastActivity ? new Date(stats.lastActivity).toLocaleDateString() : '—' },
                ].map(s => (
                  <div key={s.label} className="bg-secondary rounded-xl p-4">
                    <p className="text-xs font-display font-semibold text-textSecondary uppercase tracking-widest mb-1">
                      {s.label}
                    </p>
                    <p className="font-display font-bold text-xl text-textPrimary">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}