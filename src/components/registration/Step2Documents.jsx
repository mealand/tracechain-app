import React from 'react'
import FormField from '../forms/FormField.jsx'
import { COMMON_FIELDS } from '../../lib/entityConfig.js'
import { ShieldCheck, FileText, Info } from 'lucide-react'

const DOC_FIELDS = COMMON_FIELDS.filter(f => f.group === 'Documents')

export default function Step2Documents({ formData, onChange, errors }) {
  return (
    <div className="space-y-8 animate-fadeInUp">

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-primary/5 border border-primary/15 rounded-xl px-4 py-3.5">
        <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-sm font-body text-primary/80 leading-relaxed">
          All documents are stored securely and will only be accessed by NordRock TraceChain inspectors for verification purposes.
          Accepted formats: <strong>JPG, PNG, PDF</strong>.
        </p>
      </div>

      {/* Government ID section */}
      <section>
        <h3 className="text-xs font-display font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="w-5 h-px bg-primary/30 inline-block" />
          Government ID Verification
          <span className="flex-1 h-px bg-primary/10 inline-block" />
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {DOC_FIELDS.filter(f => f.type !== 'file').map(field => (
            <FormField
              key={field.name}
              field={field}
              value={formData[field.name]}
              onChange={onChange}
              error={errors[field.name]}
            />
          ))}
          {/* File uploads */}
          {DOC_FIELDS.filter(f => f.type === 'file').map(field => (
            <div key={field.name} className="sm:col-span-2">
              <FormField
                field={field}
                value={formData[field.name]}
                onChange={onChange}
                error={errors[field.name]}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Security note */}
      <div className="flex items-center gap-3 border-t border-gray-100 pt-6">
        <div className="w-9 h-9 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-4 h-4 text-success" />
        </div>
        <div>
          <p className="text-sm font-display font-semibold text-textPrimary">Secure & Encrypted</p>
          <p className="text-xs font-body text-textSecondary">Your documents are encrypted and stored on a private server. They are never shared publicly.</p>
        </div>
      </div>
    </div>
  )
}
