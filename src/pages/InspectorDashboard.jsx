import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LogOut, Clock, CheckCircle2, XCircle, Search,
  FileText, Image, Eye, X, Loader2, AlertCircle,
  ExternalLink, User, ShieldCheck,
} from 'lucide-react'
import { useAuth } from '../lib/AuthContext.jsx'
import { supabase, supabaseAdmin } from '../lib/supabase.js'

/* ─── Document Viewer Modal ──────────────────────────────────────── */
function DocumentModal({ entity, onClose }) {
  const [docs,    setDocs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [urls,    setUrls]    = useState({}) // doc.id → signed/public URL
  const [active,  setActive]  = useState(null) // currently previewed doc

  useEffect(() => {
    const fetchDocs = async () => {
      setLoading(true)
      const client = supabaseAdmin || supabase
      const { data, error } = await client
        .from('documents')
        .select('id, entity_id, doc_type, file_name, file_path, mime_type, file_size')
        .eq('entity_id', entity.id)

      if (error || !data || data.length === 0) {
        setLoading(false)
        return
      }

      setDocs(data)

      // Generate URLs for each document
      const urlMap = {}
      for (const doc of data) {
        try {
          if (doc.doc_type === 'profile_photo') {
            // profile-photos bucket is public
            const { data: urlData } = supabase.storage
              .from('profile-photos')
              .getPublicUrl(doc.file_path.replace('photos/', ''))
            urlMap[doc.id] = urlData?.publicUrl || null
          } else {
            // entity-documents bucket is private — use signed URL
            const { data: signedData, error: signedError } = await (supabaseAdmin || supabase).storage
              .from('entity-documents')
              .createSignedUrl(doc.file_path, 60 * 10) // 10 min expiry
            urlMap[doc.id] = signedError ? null : signedData?.signedUrl
          }
        } catch {
          urlMap[doc.id] = null
        }
      }

      setUrls(urlMap)
      setLoading(false)
    }

    fetchDocs()
  }, [entity.id])

  const idDoc      = docs.find(d => d.doc_type === 'id_document')
  const profileDoc = docs.find(d => d.doc_type === 'profile_photo')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fadeInUp">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-display font-bold text-textPrimary">{entity.full_name}</h3>
            <p className="font-mono text-xs text-textSecondary mt-0.5">{entity.nexus_id}</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-textSecondary" />
          </button>
        </div>

        <div className="px-6 py-5">

          {/* Entity info */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { label: 'Role',    value: entity.role?.replace(/_/g, ' ') },
              { label: 'Email',   value: entity.email },
              { label: 'Nexus ID', value: entity.nexus_id },
              { label: 'Registered', value: new Date(entity.created_at).toLocaleDateString() },
            ].map(item => (
              <div key={item.label} className="bg-secondary rounded-xl px-4 py-3">
                <p className="text-xs font-display font-semibold text-textSecondary uppercase tracking-widest mb-1">
                  {item.label}
                </p>
                <p className="font-body text-sm text-textPrimary capitalize font-medium">{item.value || '—'}</p>
              </div>
            ))}
          </div>

          {/* Documents */}
          <h4 className="font-display font-bold text-sm text-textPrimary mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Submitted Documents
          </h4>

          {loading ? (
            <div className="flex items-center justify-center py-10 gap-2 text-textSecondary">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-body">Loading documents…</span>
            </div>
          ) : docs.length === 0 ? (
            <div className="text-center py-10 bg-secondary rounded-xl">
              <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-body text-textSecondary">No documents uploaded for this entity.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Profile photo */}
              {profileDoc && (
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-secondary border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <Image className="w-4 h-4 text-primary" />
                      <span className="font-display font-semibold text-sm text-textPrimary">Profile Photo</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-body text-textSecondary">
                        {(profileDoc.file_size / 1024).toFixed(1)} KB
                      </span>
                      {urls[profileDoc.id] && (
                        <a href={urls[profileDoc.id]} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs font-display font-semibold text-primary hover:underline">
                          <ExternalLink className="w-3 h-3" /> Open
                        </a>
                      )}
                    </div>
                  </div>
                  {urls[profileDoc.id] ? (
                    <div className="p-4 flex justify-center bg-gray-50">
                      <img
                        src={urls[profileDoc.id]}
                        alt="Profile photo"
                        className="max-h-48 rounded-lg object-contain shadow-sm"
                        onError={e => { e.target.style.display = 'none' }}
                      />
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm font-body text-textSecondary">
                      Unable to load image.
                    </div>
                  )}
                </div>
              )}

              {/* ID document */}
              {idDoc && (
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-secondary border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="font-display font-semibold text-sm text-textPrimary">ID Document</span>
                      <span className="text-xs font-body text-textSecondary">— {idDoc.file_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-body text-textSecondary">
                        {(idDoc.file_size / 1024).toFixed(1)} KB
                      </span>
                      {urls[idDoc.id] && (
                        <a href={urls[idDoc.id]} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs font-display font-semibold text-primary hover:underline">
                          <ExternalLink className="w-3 h-3" /> Open
                        </a>
                      )}
                    </div>
                  </div>
                  {urls[idDoc.id] ? (
                    idDoc.mime_type?.startsWith('image/') ? (
                      <div className="p-4 flex justify-center bg-gray-50">
                        <img
                          src={urls[idDoc.id]}
                          alt="ID document"
                          className="max-h-64 rounded-lg object-contain shadow-sm"
                          onError={e => { e.target.style.display = 'none' }}
                        />
                      </div>
                    ) : idDoc.mime_type === 'application/pdf' ? (
                      <div className="p-4">
                        <iframe
                          src={urls[idDoc.id]}
                          className="w-full h-64 rounded-lg border border-gray-100"
                          title="ID Document PDF"
                        />
                      </div>
                    ) : (
                      <div className="p-4 text-center">
                        <a href={urls[idDoc.id]} target="_blank" rel="noopener noreferrer"
                          className="btn-primary text-sm inline-flex items-center gap-2">
                          <ExternalLink className="w-4 h-4" /> Download Document
                        </a>
                      </div>
                    )
                  ) : (
                    <div className="p-4 text-center text-sm font-body text-textSecondary">
                      Unable to generate secure link for this document.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Main Inspector Dashboard ───────────────────────────────────── */
export default function InspectorDashboard() {
  const { entity, signOut } = useAuth()
  const navigate = useNavigate()

  const [entities,      setEntities]      = useState([])
  const [loading,       setLoading]       = useState(true)
  const [filter,        setFilter]        = useState('pending')
  const [search,        setSearch]        = useState('')
  const [viewingEntity, setViewingEntity] = useState(null)

  const fetchEntities = useCallback(async () => {
    setLoading(true)
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
  }, [filter])

  useEffect(() => { fetchEntities() }, [fetchEntities])

const [rejectTarget,  setRejectTarget]  = useState(null) // entity being rejected
const [rejectReason,  setRejectReason]  = useState('')
const [rejectError,   setRejectError]   = useState('')
const [rejectSaving,  setRejectSaving]  = useState(false)
const [approveTarget, setApproveTarget] = useState(null)
const [approveSaving, setApproveSaving] = useState(false)

const handleApproveSubmit = async () => {
  setApproveSaving(true)
  const client = supabaseAdmin || supabase
  await client.from('entities').update({
    verification_status: 'verified',
    verified_by:         entity?.id,
    verified_at:         new Date().toISOString(),
    rejection_reason:    null,
  }).eq('id', approveTarget.id)
  setEntities(prev => prev.map(e => e.id === approveTarget.id
    ? { ...e, verification_status: 'verified' } : e))
  setApproveSaving(false)
  setApproveTarget(null)
}

const handleRejectSubmit = async () => {
  if (!rejectReason.trim()) {
    setRejectError('Please provide a rejection reason.')
    return
  }
  setRejectSaving(true)
  setRejectError('')

  try {
    const client = supabaseAdmin || supabase

    // Step 1 — fetch documents for storage cleanup
    const { data: docs } = await client
      .from('documents')
      .select('file_path, doc_type')
      .eq('entity_id', rejectTarget.id)

    // Step 2 — delete storage files
    if (docs && docs.length > 0) {
      const idDocs    = docs.filter(d => d.doc_type === 'id_document').map(d => d.file_path)
      const photoDocs = docs.filter(d => d.doc_type === 'profile_photo').map(d => d.file_path)
      if (idDocs.length > 0)
        await client.storage.from('entity-documents').remove(idDocs)
      if (photoDocs.length > 0)
        await client.storage.from('entity-documents').remove(photoDocs)
    }

    // Step 3 — fetch auth_user_id before deletion
    const { data: entityRow } = await client
      .from('entities')
      .select('auth_user_id')
      .eq('id', rejectTarget.id)
      .single()

    // Step 4 — delete all entity data via secure function
    await client.rpc('delete_rejected_entity', { p_entity_id: rejectTarget.id })

    // Step 5 — delete Supabase Auth account
    if (entityRow?.auth_user_id && supabaseAdmin) {
      await supabaseAdmin.auth.admin.deleteUser(entityRow.auth_user_id)
    }

    // Step 6 — remove from local state
    setEntities(prev => prev.filter(e => e.id !== rejectTarget.id))
    setRejectSaving(false)
    setRejectTarget(null)
    setRejectReason('')

  } catch (err) {
    console.error('Rejection error:', err)
    setRejectError('Something went wrong during rejection. Please try again.')
    setRejectSaving(false)
  }
}

  const filtered = entities.filter(e =>
    e.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    e.nexus_id?.toLowerCase().includes(search.toLowerCase()) ||
    e.email?.toLowerCase().includes(search.toLowerCase())
  )

  const handleSignOut = async () => { await signOut(); navigate('/login') }

  return (
    <div className="min-h-screen bg-surface">
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-gray-100
        shadow-sm flex items-center px-6 gap-4">
        <div className="flex items-center gap-2.5">
          <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8">
            <polygon points="20,2 36,11 36,29 20,38 4,29 4,11" fill="#004C99" stroke="#0070E0" strokeWidth="1.5" />
            <path d="M13 22 L17 18 L20 21 L24 15 L27 18" stroke="white"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          <span className="font-display font-bold text-primary text-base">TraceChain</span>
        </div>
        <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-display font-bold
          rounded-full uppercase tracking-wide">Inspector</span>
        <div className="ml-auto flex items-center gap-3">
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

      <div className="pt-24 px-6 max-w-6xl mx-auto pb-16">
        <div className="mb-8">
          <h1 className="font-display font-bold text-2xl text-textPrimary mb-1">
            Entity Verification Queue
          </h1>
          <p className="font-body text-textSecondary text-sm">
            Review submitted documents and approve or reject entity registrations.
          </p>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, Nexus ID, or email…"
              className="form-input pl-9 text-sm" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'pending', 'verified', 'rejected'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2.5 rounded-xl text-xs font-display font-bold capitalize transition-all
                  ${filter === f
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-textSecondary hover:border-primary hover:text-primary'}`}>
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
              <p className="text-sm font-body text-textSecondary">Loading registrations…</p>
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
                    {['Nexus ID', 'Name', 'Role', 'Email', 'Registered', 'Status', 'Documents', 'Actions'].map(h => (
                      <th key={h} className="text-left text-xs font-display font-bold text-textSecondary
                        uppercase tracking-widest px-5 py-3.5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(e => (
                    <tr key={e.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs text-primary font-semibold">{e.nexus_id}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-body text-sm text-textPrimary font-medium">{e.full_name}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-display font-semibold text-textSecondary capitalize">
                          {e.role?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-body text-xs text-textSecondary">{e.email}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-body text-xs text-textSecondary">
                          {new Date(e.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border capitalize
                          ${e.verification_status === 'verified'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : e.verification_status === 'pending'
                            ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                            : 'bg-red-50 text-red-700 border-red-200'}`}>
                          {e.verification_status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => setViewingEntity(e)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary border
                            border-gray-200 rounded-lg text-xs font-display font-bold text-textSecondary
                            hover:border-primary hover:text-primary transition-all">
                          <Eye className="w-3.5 h-3.5" /> View Docs
                        </button>
                      </td>
                      <td className="px-5 py-4">
                       {e.verification_status === 'pending' ? (
  <div className="flex gap-2">
    <button onClick={() => setApproveTarget(e)}
  className="flex items-center gap-1 px-3 py-1.5 bg-success/10 text-success
    border border-success/20 rounded-lg text-xs font-display font-bold
    hover:bg-success hover:text-white transition-all">
  <CheckCircle2 className="w-3.5 h-3.5" /> Approve
</button>
    <button onClick={() => { setRejectTarget(e); setRejectReason(''); setRejectError('') }}
      className="flex items-center gap-1 px-3 py-1.5 bg-error/10 text-error
        border border-error/20 rounded-lg text-xs font-display font-bold
        hover:bg-error hover:text-white transition-all">
      <XCircle className="w-3.5 h-3.5" /> Reject
    </button>
  </div>
) : (
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

      {/* Document viewer modal */}
{viewingEntity && (
  <DocumentModal
    entity={viewingEntity}
    onClose={() => setViewingEntity(null)}
  />
)}
{/* Rejection reason modal */}
{rejectTarget && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fadeInUp">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 className="font-display font-bold text-textPrimary">Reject Entity</h3>
        <button onClick={() => setRejectTarget(null)}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
          <X className="w-4 h-4 text-textSecondary" />
        </button>
      </div>
      <div className="px-6 py-5">
        <div className="flex items-start gap-3 bg-red-50 border border-error/20 rounded-xl px-4 py-3 mb-5">
          <XCircle className="w-4 h-4 text-error flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-display font-semibold text-error">
              Rejecting: {rejectTarget.full_name}
            </p>
            <p className="text-xs font-body text-error/80 mt-0.5">
              {rejectTarget.nexus_id} · {rejectTarget.role?.replace(/_/g, ' ')}
            </p>
          </div>
        </div>

        <label className="form-label">
          Rejection Reason <span className="text-error text-xs">*</span>
        </label>
        <textarea
          value={rejectReason}
          onChange={e => { setRejectReason(e.target.value); setRejectError('') }}
          rows={4}
          className="form-input resize-none"
          placeholder="e.g. ID document is expired. Please resubmit with a valid government-issued ID."
        />
        {rejectError && (
          <p className="text-xs font-body text-error mt-2">{rejectError}</p>
        )}
        <p className="text-xs font-body text-textSecondary mt-2">
          This reason will be visible to the entity when they log in.
        </p>

        <div className="flex items-center gap-3 mt-5">
          <button onClick={() => setRejectTarget(null)}
            className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200
              font-display font-semibold text-sm text-textSecondary
              hover:border-primary hover:text-primary transition-all">
            Cancel
          </button>
          <button onClick={handleRejectSubmit} disabled={rejectSaving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5
              rounded-xl bg-error text-white font-display font-semibold text-sm
              hover:bg-red-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
            {rejectSaving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Rejecting…</>
              : <><XCircle className="w-4 h-4" /> Confirm Rejection</>}
          </button>
        </div>
      </div>
    </div>
  </div>
)}
{/* Approval confirmation modal */}
{approveTarget && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fadeInUp">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 className="font-display font-bold text-textPrimary">Confirm Approval</h3>
        <button onClick={() => setApproveTarget(null)}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
          <X className="w-4 h-4 text-textSecondary" />
        </button>
      </div>
      <div className="px-6 py-5">
        <div className="flex items-start gap-3 bg-green-50 border border-success/20 rounded-xl px-4 py-3 mb-5">
          <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-display font-semibold text-success">
              Approving: {approveTarget.full_name}
            </p>
            <p className="text-xs font-body text-success/80 mt-0.5">
              {approveTarget.nexus_id} · {approveTarget.role?.replace(/_/g, ' ')}
            </p>
          </div>
        </div>

        <p className="text-sm font-body text-textSecondary mb-1">
          This will grant <strong className="text-textPrimary">{approveTarget.full_name}</strong> full
          access to the TraceChain supply chain network.
        </p>
        <p className="text-sm font-body text-textSecondary">
          Make sure you have reviewed their submitted documents before proceeding.
        </p>

        <div className="flex items-center gap-3 mt-6">
          <button onClick={() => setApproveTarget(null)}
            className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200
              font-display font-semibold text-sm text-textSecondary
              hover:border-primary hover:text-primary transition-all">
            Cancel
          </button>
          <button onClick={handleApproveSubmit} disabled={approveSaving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5
              rounded-xl bg-success text-white font-display font-semibold text-sm
              hover:bg-green-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
            {approveSaving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Approving…</>
              : <><CheckCircle2 className="w-4 h-4" /> Confirm Approval</>}
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  )
}