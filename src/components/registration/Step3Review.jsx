import React from 'react'
import { CheckCircle2, Edit2 } from 'lucide-react'
import { COMMON_FIELDS } from '../../lib/entityConfig.js'

function ReviewRow({ label, value }) {
  if (!value || value === '') return null
  // Don't show password or file objects
  if (typeof value === 'object') return null

  return (
    <div className="flex justify-between items-start py-2.5 border-b border-gray-50 last:border-0 gap-4">
      <span className="text-xs font-display font-semibold text-textSecondary flex-shrink-0 w-44">{label}</span>
      <span className="text-xs font-body text-textPrimary text-right break-all">{value}</span>
    </div>
  )
}

function Section({ title, fields, formData }) {
  const hasValues = fields.some(f => formData[f.name] && formData[f.name] !== '')
  if (!hasValues) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-3 bg-secondary border-b border-gray-100">
        <h4 className="text-xs font-display font-bold text-primary uppercase tracking-widest">{title}</h4>
      </div>
      <div className="px-5 py-1">
        {fields.filter(f => f.name !== 'password' && f.type !== 'file').map(field => (
          <ReviewRow key={field.name} label={field.label} value={formData[field.name]} />
        ))}
      </div>
    </div>
  )
}

export default function Step3Review({ roleConfig, formData, nexusId, onEdit }) {
  const identityFields = COMMON_FIELDS.filter(f => f.group === 'Identity' && f.name !== 'password')
  const locationFields = COMMON_FIELDS.filter(f => f.group === 'Location')
  const docFields = COMMON_FIELDS.filter(f => f.group === 'Documents' && f.type !== 'file')

  // Count uploaded files
  const uploadedFiles = ['id_document', 'profile_photo'].filter(k => formData[k] instanceof File)

  return (
    <div className="space-y-5 animate-fadeInUp">

      {/* Nexus ID preview */}
      <div className="bg-gradient-to-br from-primary to-primary-600 rounded-2xl px-6 py-5 text-white">
        <p className="text-xs font-display font-semibold text-white/60 uppercase tracking-widest mb-1">Your Nexus ID</p>
        <p className="font-mono text-2xl font-bold tracking-wider mb-3">{nexusId}</p>
        <p className="text-xs text-white/60 font-body">
          This ID will be permanently assigned to your entity on the TraceChain blockchain ledger upon approval.
        </p>
      </div>

      {/* Review sections */}
      <Section title="Personal Information" fields={identityFields} formData={formData} />
      <Section title="Location" fields={locationFields} formData={formData} />
      <Section title="ID Verification" fields={docFields} formData={formData} />

      {/* Role-specific */}
      {roleConfig.specificFields?.length > 0 && (
        <Section
          title={`${roleConfig.label} Details`}
          fields={roleConfig.specificFields}
          formData={formData}
        />
      )}

      {/* Documents uploaded */}
      {uploadedFiles.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 bg-secondary border-b border-gray-100">
            <h4 className="text-xs font-display font-bold text-primary uppercase tracking-widest">Documents Uploaded</h4>
          </div>
          <div className="px-5 py-3 space-y-2">
            {uploadedFiles.map(key => (
              <div key={key} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent" />
                <span className="text-xs font-body text-textPrimary">{formData[key].name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit prompt */}
      <button
        type="button"
        onClick={() => onEdit(1)}
        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200
          rounded-xl text-sm font-display font-semibold text-textSecondary hover:border-primary hover:text-primary
          transition-all duration-200"
      >
        <Edit2 className="w-4 h-4" />
        Something wrong? Go back and edit
      </button>

      {/* Terms agreement */}
      <p className="text-xs font-body text-textSecondary text-center leading-relaxed px-4">
        By submitting, you confirm that all information provided is accurate and you agree to the{' '}
        <a href="#" className="text-primary underline">Terms of Service</a> and{' '}
        <a href="#" className="text-primary underline">Privacy Policy</a> of NordRock TraceChain.
      </p>
    </div>
  )
}
