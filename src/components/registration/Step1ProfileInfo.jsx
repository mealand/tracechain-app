import React from 'react'
import FormField from '../forms/FormField.jsx'
import { COMMON_FIELDS } from '../../lib/entityConfig.js'

const IDENTITY_FIELDS = COMMON_FIELDS.filter(
  f => f.group === 'Identity' && f.name !== 'password' && f.name !== 'id_type' && f.name !== 'id_number'
)
const PASSWORD_FIELD  = COMMON_FIELDS.find(f => f.name === 'password')
const LOCATION_FIELDS = COMMON_FIELDS.filter(f => f.group === 'Location')

// Confirm password is a UI-only field — not stored, purely for validation
const CONFIRM_PASSWORD_FIELD = {
  name:     'confirm_password',
  label:    'Confirm Password',
  type:     'password',
  required: true,
}

export default function Step1ProfileInfo({ roleConfig, formData, onChange, errors }) {
  return (
    <div className="space-y-8 animate-fadeInUp">

      {/* Identity & Access */}
      <section>
        <h3 className="text-xs font-display font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="w-5 h-px bg-primary/30 inline-block" />
          Identity & Access
          <span className="flex-1 h-px bg-primary/10 inline-block" />
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {IDENTITY_FIELDS.map(field => (
            <div
              key={field.name}
              className={field.name === 'full_name' || field.name === 'email' ? 'sm:col-span-2' : ''}
            >
              <FormField
                field={field}
                value={formData[field.name]}
                onChange={onChange}
                error={errors[field.name]}
              />
            </div>
          ))}

          {/* Password + Confirm Password side by side */}
          <div>
            <FormField
              field={PASSWORD_FIELD}
              value={formData['password']}
              onChange={onChange}
              error={errors['password']}
            />
          </div>
          <div>
            <FormField
              field={CONFIRM_PASSWORD_FIELD}
              value={formData['confirm_password']}
              onChange={onChange}
              error={errors['confirm_password']}
            />
          </div>
        </div>
      </section>

      {/* Location */}
      <section>
        <h3 className="text-xs font-display font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="w-5 h-px bg-primary/30 inline-block" />
          Location
          <span className="flex-1 h-px bg-primary/10 inline-block" />
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {LOCATION_FIELDS.map(field => (
            <div key={field.name} className={field.name === 'physical_address' ? 'sm:col-span-2' : ''}>
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

      {/* Role-specific fields */}
      {roleConfig.specificFields && roleConfig.specificFields.length > 0 && (
        <section>
          <h3 className="text-xs font-display font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-5 h-px bg-primary/30 inline-block" />
            {roleConfig.label} Details
            <span className="flex-1 h-px bg-primary/10 inline-block" />
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {roleConfig.specificFields.map(field => (
              <div
                key={field.name}
                className={
                  field.type === 'textarea' ||
                  field.name?.includes('address') ||
                  field.name?.includes('name')
                    ? 'sm:col-span-2'
                    : ''
                }
              >
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
      )}
    </div>
  )
}