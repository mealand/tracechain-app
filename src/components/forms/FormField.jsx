import React, { useState } from 'react'
import { Eye, EyeOff, Upload, AlertCircle } from 'lucide-react'

export default function FormField({ field, value, onChange, error }) {
  const [showPassword, setShowPassword] = useState(false)
  const [fileName, setFileName] = useState('')

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFileName(file.name)
      onChange(field.name, file)
    }
  }

  const baseInput = `w-full px-4 py-3 rounded-xl border font-body text-sm text-textPrimary bg-white
    placeholder-gray-400 transition-all duration-200 outline-none
    focus:ring-2 focus:ring-primary/25 focus:border-primary
    ${error ? 'border-error bg-red-50 focus:ring-error/20 focus:border-error' : 'border-gray-200 hover:border-gray-300'}`

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-display font-semibold text-textPrimary flex items-center gap-1">
        {field.label}
        {field.required && <span className="text-error text-xs">*</span>}
      </label>

      {/* TEXT / EMAIL / TEL / NUMBER / DATE */}
      {['text', 'email', 'tel', 'number', 'date'].includes(field.type) && (
        <input
          type={field.type}
          value={value || ''}
          onChange={(e) => onChange(field.name, e.target.value)}
          placeholder={field.placeholder || ''}
          className={baseInput}
        />
      )}

      {/* PASSWORD */}
      {field.type === 'password' && (
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={value || ''}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder="Enter a secure password"
            className={`${baseInput} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      )}

      {/* SELECT */}
      {field.type === 'select' && (
        <select
          value={value || ''}
          onChange={(e) => onChange(field.name, e.target.value)}
          className={`${baseInput} cursor-pointer`}
        >
          <option value="">Select an option...</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      )}

      {/* TEXTAREA */}
      {field.type === 'textarea' && (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(field.name, e.target.value)}
          placeholder={field.placeholder || ''}
          rows={3}
          className={`${baseInput} resize-none`}
        />
      )}

      {/* FILE UPLOAD */}
      {field.type === 'file' && (
        <label className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer
          transition-all duration-200 group
          ${error ? 'border-error bg-red-50' : 'border-gray-200 hover:border-primary hover:bg-primary/3'}
          ${fileName ? 'border-accent bg-accent/5' : ''}`}>
          <Upload className={`w-4 h-4 flex-shrink-0 transition-colors
            ${fileName ? 'text-accent' : 'text-gray-400 group-hover:text-primary'}`} />
          <span className={`text-sm font-body truncate
            ${fileName ? 'text-accent font-medium' : 'text-gray-400 group-hover:text-primary'}`}>
            {fileName || `Upload ${field.label}`}
          </span>
          <input
            type="file"
            accept={field.accept || '*'}
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      )}

      {/* Error message */}
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-error font-body">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}
