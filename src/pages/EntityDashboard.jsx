import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LogOut, Clock, CheckCircle2, XCircle, HardHat, Pickaxe,
  PackagePlus, Factory, FlaskConical, Truck, Globe, ShieldCheck,
  Plus, ArrowRightLeft, Layers, History, Loader2, AlertCircle,
  ChevronDown, X, Package, TrendingUp, Activity,
} from 'lucide-react'
import { useAuth } from '../lib/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'
import { generateTraceID, generateBlockchainFingerprint } from '../lib/nexusId.js'

/* ─── Constants ─────────────────────────────────────────────────── */
const BATCH_CREATOR_ROLES = ['miner', 'artisan']

const ROLE_ICONS = {
  miner: HardHat, artisan: Pickaxe, aggregator: PackagePlus,
  processing_center: Factory, assay: FlaskConical,
  logistics: Truck, freight: Globe, security: ShieldCheck,
}

const STATUS_CONFIG = {
  pending:   { icon: Clock,         color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200',  label: 'Pending Verification' },
  verified:  { icon: CheckCircle2,  color: 'text-success',    bg: 'bg-green-50 border-green-200',    label: 'Verified' },
  rejected:  { icon: XCircle,       color: 'text-error',      bg: 'bg-red-50 border-red-200',        label: 'Rejected' },
  suspended: { icon: XCircle,       color: 'text-gray-600',   bg: 'bg-gray-100 border-gray-300',     label: 'Suspended' },
}

const MINERAL_TYPES = [
  'Gold', 'Coltan', 'Cassiterite', 'Wolframite', 'Diamond',
  'Iron Ore', 'Copper', 'Lithium', 'Cobalt', 'Manganese', 'Other',
]

const STAGE_OPTIONS = [
  { value: 'mined',       label: 'Mined' },
  { value: 'aggregated',  label: 'Aggregated' },
  { value: 'processed',   label: 'Processed' },
  { value: 'transported', label: 'Transported' },
  { value: 'assayed',     label: 'Assayed' },
  { value: 'exported',    label: 'Exported' },
]

const STAGE_COLORS = {
  mined:       'bg-amber-50 text-amber-700 border-amber-200',
  aggregated:  'bg-blue-50 text-blue-700 border-blue-200',
  processed:   'bg-purple-50 text-purple-700 border-purple-200',
  transported: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  assayed:     'bg-indigo-50 text-indigo-700 border-indigo-200',
  exported:    'bg-green-50 text-green-700 border-green-200',
}

const BATCH_STATUS_COLORS = {
  active:     'bg-green-50 text-green-700 border-green-200',
  in_transit: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  processed:  'bg-purple-50 text-purple-700 border-purple-200',
  exported:   'bg-blue-50 text-blue-700 border-blue-200',
  disputed:   'bg-red-50 text-red-700 border-red-200',
}

/* ─── Small shared components ────────────────────────────────────── */
function StatusPill({ value, colorMap, fallback = '' }) {
  const cls = colorMap[value] || 'bg-gray-100 text-gray-600 border-gray-200'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${cls}`}>
      {(value || fallback).replace('_', ' ')}
    </span>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fadeInUp">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-display font-bold text-textPrimary text-base">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-textSecondary" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

function ErrorBox({ message }) {
  if (!message) return null
  return (
    <div className="flex items-start gap-2 bg-red-50 border border-error/20 rounded-xl px-4 py-3 mb-4">
      <AlertCircle className="w-4 h-4 text-error flex-shrink-0 mt-0.5" />
      <p className="text-sm font-body text-error">{message}</p>
    </div>
  )
}

/* ─── Create Batch Modal ─────────────────────────────────────────── */
function CreateBatchModal({ entity, onClose, onSuccess }) {
  const [form, setForm] = useState({
    mineral_type: '', quantity_kg: '', unit: 'kg',
    origin_location: '', origin_gps: '', notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.mineral_type || !form.quantity_kg || !form.origin_location) {
      setError('Mineral type, quantity, and origin location are required.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const traceId = generateTraceID()
      const fingerprint = await generateBlockchainFingerprint({
        trace_id:        traceId,
        entity_id:       entity.id,
        mineral_type:    form.mineral_type,
        quantity_kg:     form.quantity_kg,
        origin_location: form.origin_location,
        timestamp:       new Date().toISOString(),
      })

      const { error: insertError } = await supabase.from('batches').insert({
        trace_id:             traceId,
        origin_entity:        entity.id,
        mineral_type:         form.mineral_type,
        quantity_kg:          parseFloat(form.quantity_kg),
        unit:                 form.unit,
        origin_location:      form.origin_location,
        origin_gps:           form.origin_gps || null,
        notes:                form.notes || null,
        current_stage:        'mined',
        status:               'active',
        blockchain_fingerprint: fingerprint,
      })

      if (insertError) throw new Error(insertError.message)
      onSuccess(traceId)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Create New Batch" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorBox message={error} />

        <div>
          <label className="form-label">Mineral Type <span className="text-error text-xs">*</span></label>
          <select value={form.mineral_type} onChange={e => set('mineral_type', e.target.value)} className="form-input">
            <option value="">Select mineral…</option>
            {MINERAL_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Quantity <span className="text-error text-xs">*</span></label>
            <input
              type="number" step="0.01" min="0"
              value={form.quantity_kg}
              onChange={e => set('quantity_kg', e.target.value)}
              className="form-input" placeholder="e.g. 150.5"
            />
          </div>
          <div>
            <label className="form-label">Unit</label>
            <select value={form.unit} onChange={e => set('unit', e.target.value)} className="form-input">
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="tonnes">tonnes</option>
              <option value="carats">carats</option>
            </select>
          </div>
        </div>

        <div>
          <label className="form-label">Origin Location <span className="text-error text-xs">*</span></label>
          <input
            type="text"
            value={form.origin_location}
            onChange={e => set('origin_location', e.target.value)}
            className="form-input" placeholder="e.g. Plateau State, Nigeria"
          />
        </div>

        <div>
          <label className="form-label">GPS Coordinates <span className="text-textSecondary text-xs font-normal">(optional)</span></label>
          <input
            type="text"
            value={form.origin_gps}
            onChange={e => set('origin_gps', e.target.value)}
            className="form-input font-mono" placeholder="9.0765, 7.3986"
          />
        </div>

        <div>
          <label className="form-label">Notes <span className="text-textSecondary text-xs font-normal">(optional)</span></label>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            rows={3}
            className="form-input resize-none" placeholder="Additional notes about this batch…"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 font-display font-semibold text-sm text-textSecondary hover:border-primary hover:text-primary transition-all">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 btn-primary text-sm py-2.5 disabled:opacity-60 disabled:cursor-not-allowed">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : <><Plus className="w-4 h-4" /> Create Batch</>}
          </button>
        </div>
      </form>
    </Modal>
  )
}

/* ─── Record Transaction Modal ───────────────────────────────────── */
function RecordTransactionModal({ entity, batches, onClose, onSuccess }) {
  const [form, setForm] = useState({
    batch_id: '', stage: '', to_nexus_id: '',
    quantity_kg: '', location: '', notes: '',
  })
  const [resolving, setResolving] = useState(false)
  const [toEntity,  setToEntity]  = useState(null)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

 const resolveNexusId = async () => {
  if (!form.to_nexus_id.trim()) return
  setResolving(true)
  setToEntity(null)
  try {
    const { data, error: fetchError } = await supabase
      .rpc('lookup_entity_by_nexus_id', {
        p_nexus_id: form.to_nexus_id.trim().toUpperCase()
      })

    if (fetchError) {
      setError('No entity found with that Nexus ID.')
      return
    }

    // Handle both array and single object responses
    const result = Array.isArray(data) ? data[0] : data

    if (!result) {
      setError('No entity found with that Nexus ID.')
    } else if (result.id === entity.id) {
      setError('You cannot record a transaction to yourself.')
    } else {
      setToEntity(result)
      setError('')
    }
  } catch (err) {
    console.error('Catch error:', err)
    setError('Failed to look up Nexus ID.')
  } finally {
    setResolving(false)
  }
}
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.batch_id || !form.stage || !toEntity || !form.quantity_kg || !form.location) {
      setError('All fields except Notes are required. Look up a valid recipient Nexus ID.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const fingerprint = await generateBlockchainFingerprint({
        batch_id:     form.batch_id,
        from_entity:  entity.nexus_id,
        to_entity:    toEntity.nexus_id,
        stage:        form.stage,
        quantity_kg:  form.quantity_kg,
        location:     form.location,
        timestamp:    new Date().toISOString(),
      })

      const { error: insertError } = await supabase.from('transactions').insert({
        batch_id:               form.batch_id,
        from_entity:            entity.id,
        to_entity:              toEntity.id,
        stage:                  form.stage,
        quantity_kg:            parseFloat(form.quantity_kg),
        location:               form.location,
        notes:                  form.notes || null,
        blockchain_fingerprint: fingerprint,
      })

      if (insertError) throw new Error(insertError.message)
      onSuccess()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const selectedBatch = batches.find(b => b.id === form.batch_id)

  return (
    <Modal title="Record Transaction" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorBox message={error} />

        <div>
          <label className="form-label">Batch <span className="text-error text-xs">*</span></label>
          <select value={form.batch_id} onChange={e => set('batch_id', e.target.value)} className="form-input">
            <option value="">Select batch…</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>
                {b.trace_id} — {b.mineral_type} ({b.quantity_kg} {b.unit})
              </option>
            ))}
          </select>
          {selectedBatch && (
            <p className="text-xs font-body text-textSecondary mt-1">
              Current stage: <span className="font-semibold capitalize">{selectedBatch.current_stage}</span>
              {' · '} Status: <span className="font-semibold capitalize">{selectedBatch.status?.replace('_', ' ')}</span>
            </p>
          )}
        </div>

        <div>
          <label className="form-label">Stage Being Recorded <span className="text-error text-xs">*</span></label>
          <select value={form.stage} onChange={e => set('stage', e.target.value)} className="form-input">
            <option value="">Select stage…</option>
            {STAGE_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {/* Recipient lookup */}
        <div>
          <label className="form-label">Recipient Nexus ID <span className="text-error text-xs">*</span></label>
          <div className="flex gap-2">
            <input
              type="text"
              value={form.to_nexus_id}
              onChange={e => { set('to_nexus_id', e.target.value); setToEntity(null) }}
              className="form-input font-mono flex-1" placeholder="e.g. AGG-20240315-B7K2"
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), resolveNexusId())}
            />
            <button type="button" onClick={resolveNexusId} disabled={resolving || !form.to_nexus_id}
              className="px-3 py-2 rounded-lg bg-secondary border border-primary/20 text-primary text-sm font-display font-semibold hover:bg-primary hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
              {resolving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Look up'}
            </button>
          </div>
          {toEntity && (
            <div className="mt-2 flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
              <div>
                <p className="text-xs font-display font-semibold text-textPrimary">{toEntity.full_name}</p>
                <p className="text-xs font-body text-textSecondary capitalize">{toEntity.role?.replace('_', ' ')} · {toEntity.nexus_id}</p>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="form-label">Quantity Transferred <span className="text-error text-xs">*</span></label>
          <input
            type="number" step="0.01" min="0"
            value={form.quantity_kg}
            onChange={e => set('quantity_kg', e.target.value)}
            className="form-input" placeholder="e.g. 100.0"
          />
        </div>

        <div>
          <label className="form-label">Transaction Location <span className="text-error text-xs">*</span></label>
          <input
            type="text"
            value={form.location}
            onChange={e => set('location', e.target.value)}
            className="form-input" placeholder="e.g. Port Harcourt, Rivers State"
          />
        </div>

        <div>
          <label className="form-label">Notes <span className="text-textSecondary text-xs font-normal">(optional)</span></label>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            rows={2}
            className="form-input resize-none" placeholder="Anything to note about this transfer…"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 font-display font-semibold text-sm text-textSecondary hover:border-primary hover:text-primary transition-all">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 btn-primary text-sm py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: 'var(--color-accent)' }}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Recording…</> : <><ArrowRightLeft className="w-4 h-4" /> Record Transaction</>}
          </button>
        </div>
      </form>
    </Modal>
  )
}

/* ─── Batch Card ─────────────────────────────────────────────────── */
function BatchCard({ batch }) {
  return (
    <div className="card hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-mono text-xs text-textSecondary mb-0.5">{batch.trace_id}</p>
          <p className="font-display font-bold text-textPrimary">{batch.mineral_type}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <StatusPill value={batch.status} colorMap={BATCH_STATUS_COLORS} />
          <StatusPill value={batch.current_stage} colorMap={STAGE_COLORS} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div>
          <p className="text-textSecondary font-display font-semibold">Quantity</p>
          <p className="font-body text-textPrimary">{batch.quantity_kg} {batch.unit}</p>
        </div>
        <div>
          <p className="text-textSecondary font-display font-semibold">Origin</p>
          <p className="font-body text-textPrimary truncate">{batch.origin_location || '—'}</p>
        </div>
        <div className="col-span-2">
          <p className="text-textSecondary font-display font-semibold">Fingerprint</p>
          <p className="font-mono text-textSecondary truncate">{batch.blockchain_fingerprint?.slice(0, 40)}…</p>
        </div>
        <div className="col-span-2">
          <p className="text-textSecondary font-display font-semibold">Created</p>
          <p className="font-body text-textPrimary">{new Date(batch.created_at).toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}

/* ─── Transaction Row ────────────────────────────────────────────── */
function TransactionRow({ tx, entityId }) {
  const isOutgoing = tx.from_entity === entityId
  return (
    <div className="card py-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`text-xs font-display font-bold px-2 py-0.5 rounded-full border ${
              isOutgoing ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-green-50 text-green-700 border-green-200'
            }`}>
              {isOutgoing ? '↑ Outgoing' : '↓ Incoming'}
            </span>
            <StatusPill value={tx.stage} colorMap={STAGE_COLORS} />
          </div>
          <p className="font-mono text-xs text-textSecondary">{tx.batch?.trace_id || '—'}</p>
          <p className="text-xs font-body text-textPrimary mt-1">
            <span className="text-textSecondary">From:</span> {tx.sender?.full_name || '—'}{' '}
            <span className="text-textSecondary">→ To:</span> {tx.recipient?.full_name || '—'}
          </p>
          {tx.location && (
            <p className="text-xs font-body text-textSecondary mt-0.5">📍 {tx.location}</p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-display font-bold text-textPrimary text-sm">{tx.quantity_kg} kg</p>
          <p className="text-xs text-textSecondary mt-0.5">{new Date(tx.created_at).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  )
}

/* ─── Main Dashboard ─────────────────────────────────────────────── */
export default function EntityDashboard() {
  const { entity, signOut } = useAuth()
  const navigate = useNavigate()

  const role   = entity?.role
  const Icon   = ROLE_ICONS[role] || HardHat
  const status = STATUS_CONFIG[entity?.verification_status] || STATUS_CONFIG.pending
  const StatusIcon = status.icon
  const isVerified  = entity?.verification_status === 'verified'
  const canCreate   = isVerified && BATCH_CREATOR_ROLES.includes(role)

  /* ── data state ── */
  const [batches,      setBatches]      = useState([])
  const [transactions, setTransactions] = useState([])
  const [stats,        setStats]        = useState({ totalBatches: 0, activeBatches: 0, totalTx: 0 })
  const [loading,      setLoading]      = useState(true)
  const [activeTab,    setActiveTab]    = useState('batches')

  /* ── modal state ── */
  const [showCreateBatch, setShowCreateBatch]   = useState(false)
  const [showRecordTx,    setShowRecordTx]      = useState(false)
  const [successMsg,      setSuccessMsg]        = useState('')

  const handleSignOut = async () => { await signOut(); navigate('/login') }

  /* ── fetch data ── */
  const fetchData = useCallback(async () => {
    if (!entity?.id) return
    setLoading(true)
    try {
      const [batchRes, txRes] = await Promise.all([
        supabase
          .from('batches')
          .select('*')
          .eq('origin_entity', entity.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('transactions')
          .select(`
            id, batch_id, from_entity, to_entity, stage, quantity_kg, location, notes,
            blockchain_fingerprint, timestamp, supporting_doc_id,
            batch:batches ( trace_id ),
            sender:entities!transactions_from_entity_fkey   ( full_name, nexus_id ),
            recipient:entities!transactions_to_entity_fkey  ( full_name, nexus_id )
          `)
          .or(`from_entity.eq.${entity.id},to_entity.eq.${entity.id}`)
          .order('timestamp', { ascending: false }),
      ])

      const batchData = batchRes.data || []
      const txData    = txRes.data    || []

      setBatches(batchData)
      setTransactions(txData)
      setStats({
        totalBatches:  batchData.length,
        activeBatches: batchData.filter(b => b.status === 'active' || b.status === 'in_transit').length,
        totalTx:       txData.length,
      })
    } finally {
      setLoading(false)
    }
  }, [entity?.id])

  useEffect(() => { fetchData() }, [fetchData])

  /* ── modal success handlers ── */
  const handleBatchCreated = (traceId) => {
    setShowCreateBatch(false)
    setSuccessMsg(`Batch created successfully. Trace ID: ${traceId}`)
    fetchData()
    setTimeout(() => setSuccessMsg(''), 6000)
  }

  const handleTxRecorded = () => {
    setShowRecordTx(false)
    setSuccessMsg('Transaction recorded and anchored to the blockchain ledger.')
    fetchData()
    setTimeout(() => setSuccessMsg(''), 6000)
  }

  /* ─────────────────────────────────────────────────────────────── */
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
        <div className="ml-auto flex items-center gap-3">
          <span className={`badge-${entity?.verification_status || 'pending'} capitalize`}>
            {entity?.verification_status || 'pending'}
          </span>
          <span className="text-sm font-display font-semibold text-textPrimary hidden sm:block">
            {entity?.full_name}
          </span>
          <button onClick={handleSignOut}
            className="flex items-center gap-1.5 text-sm font-display font-semibold
              text-textSecondary hover:text-error transition-colors px-3 py-2 rounded-lg hover:bg-red-50">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </nav>

      <div className="pt-24 px-4 sm:px-6 max-w-4xl mx-auto pb-16">

        {/* ── Welcome card ── */}
        <div className="bg-gradient-to-br from-primary to-[#003d7a] rounded-2xl px-8 py-7
          text-white mb-6 animate-fadeInUp">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-white/60 text-xs font-display font-semibold uppercase tracking-widest mb-1">
                Welcome back
              </p>
              <h1 className="font-display font-bold text-2xl mb-1">{entity?.full_name}</h1>
              <p className="font-mono text-white/70 text-sm">{entity?.nexus_id}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* ── Status banner ── */}
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
                Your account is verified. You have full access to the TraceChain supply chain network.
              </p>
            )}
            {entity?.verification_status === 'rejected' && (
              <p className="font-body text-sm text-red-700 mt-0.5">
                Your registration was rejected. Please contact support for details.
              </p>
            )}
            {entity?.verification_status === 'suspended' && (
              <p className="font-body text-sm text-gray-700 mt-0.5">
                Your account has been suspended. Please contact a NordRock Administrator.
              </p>
            )}
          </div>
        </div>

        {/* ── Info grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {[
            { label: 'Role',          value: role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) },
            { label: 'Email',         value: entity?.email },
            { label: 'Country',       value: entity?.country },
            { label: 'State / Region', value: entity?.state },
            { label: 'Phone',         value: entity?.phone },
            { label: 'Registered',    value: entity?.created_at ? new Date(entity.created_at).toLocaleDateString() : '—' },
          ].map(item => (
            <div key={item.label} className="card py-4">
              <p className="text-xs font-display font-semibold text-textSecondary uppercase tracking-widest mb-1">
                {item.label}
              </p>
              <p className="font-body text-textPrimary text-sm font-medium">{item.value || '—'}</p>
            </div>
          ))}
        </div>

        {/* ── Supply Chain section (verified only) ── */}
        {isVerified && (
          <div className="animate-fadeInUp">

            {/* Success message */}
            {successMsg && (
              <div className="flex items-start gap-2 bg-green-50 border border-green-200
                rounded-xl px-4 py-3 mb-5">
                <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                <p className="text-sm font-body text-green-700">{successMsg}</p>
              </div>
            )}

            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Total Batches',  value: stats.totalBatches,  icon: Package,     color: 'text-primary', bg: 'bg-primary/10' },
                { label: 'Active Batches', value: stats.activeBatches, icon: TrendingUp,  color: 'text-accent',  bg: 'bg-accent/10' },
                { label: 'Transactions',   value: stats.totalTx,       icon: Activity,    color: 'text-success', bg: 'bg-green-50'   },
              ].map(s => {
                const SIcon = s.icon
                return (
                  <div key={s.label} className="card py-5 text-center">
                    <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mx-auto mb-2`}>
                      <SIcon className={`w-4 h-4 ${s.color}`} />
                    </div>
                    <p className="font-display font-bold text-2xl text-textPrimary">{s.value}</p>
                    <p className="text-xs font-body text-textSecondary mt-0.5">{s.label}</p>
                  </div>
                )
              })}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              {canCreate && (
                <button
                  onClick={() => setShowCreateBatch(true)}
                  className="flex items-center gap-2 btn-primary text-sm py-2.5"
                >
                  <Plus className="w-4 h-4" /> Create Batch
                </button>
              )}
              <button
                onClick={() => setShowRecordTx(true)}
                disabled={batches.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 border-accent
                  text-accent font-display font-semibold text-sm hover:bg-accent hover:text-white
                  transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowRightLeft className="w-4 h-4" /> Record Transaction
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <div className="flex gap-0">
                {[
                  { id: 'batches',      label: 'My Batches',          icon: Layers  },
                  { id: 'transactions', label: 'Transaction History',  icon: History },
                ].map(tab => {
                  const TIcon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-5 py-3 text-sm font-display font-semibold
                        border-b-2 transition-all duration-200
                        ${activeTab === tab.id
                          ? 'border-primary text-primary'
                          : 'border-transparent text-textSecondary hover:text-textPrimary'}`}
                    >
                      <TIcon className="w-4 h-4" />
                      {tab.label}
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
                        ${activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-textSecondary'}`}>
                        {tab.id === 'batches' ? batches.length : transactions.length}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Tab content */}
            {loading ? (
              <div className="flex items-center justify-center py-16 gap-3 text-textSecondary">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="font-body text-sm">Loading supply chain data…</span>
              </div>
            ) : activeTab === 'batches' ? (
              batches.length === 0 ? (
                <div className="card text-center py-12">
                  <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="font-display font-bold text-textPrimary mb-1">No batches yet</p>
                  <p className="font-body text-textSecondary text-sm">
                    {canCreate
                      ? 'Create your first batch to start tracking minerals on the blockchain.'
                      : 'Batches you participate in will appear here once a transaction is recorded.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {batches.map(batch => <BatchCard key={batch.id} batch={batch} />)}
                </div>
              )
            ) : (
              transactions.length === 0 ? (
                <div className="card text-center py-12">
                  <History className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="font-display font-bold text-textPrimary mb-1">No transactions yet</p>
                  <p className="font-body text-textSecondary text-sm">
                    All incoming and outgoing supply chain transactions will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map(tx => (
                    <TransactionRow key={tx.id} tx={tx} entityId={entity.id} />
                  ))}
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showCreateBatch && (
        <CreateBatchModal
          entity={entity}
          onClose={() => setShowCreateBatch(false)}
          onSuccess={handleBatchCreated}
        />
      )}
      {showRecordTx && (
        <RecordTransactionModal
          entity={entity}
          batches={batches}
          onClose={() => setShowRecordTx(false)}
          onSuccess={handleTxRecorded}
        />
      )}
    </div>
  )
}