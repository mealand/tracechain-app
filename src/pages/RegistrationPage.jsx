import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  HardHat, Pickaxe, PackagePlus, Factory,
  FlaskConical, Truck, Globe, ShieldCheck,
  ChevronRight, ChevronLeft, Loader2
} from 'lucide-react'
import Navbar from '../components/layout/Navbar.jsx'
import ProgressBar from '../components/registration/ProgressBar.jsx'
import Step1ProfileInfo from '../components/registration/Step1ProfileInfo.jsx'
import Step2Documents from '../components/registration/Step2Documents.jsx'
import Step3Review from '../components/registration/Step3Review.jsx'
import { ENTITY_ROLES, ROLE_SPECIFIC_FIELDS, COMMON_FIELDS } from '../lib/entityConfig.js'
import { generateNexusID, generateBlockchainFingerprint } from '../lib/nexusId.js'
import { supabase } from '../lib/supabase.js'

const ICONS = {
  HardHat, Pickaxe, PackagePlus, Factory,
  FlaskConical, Truck, Globe, ShieldCheck,
}

function validateStep(step, formData, roleConfig) {
  const errors = {}
  if (step === 1) {
    const requiredCommon = COMMON_FIELDS.filter(f => f.required && f.group !== 'Documents')
    requiredCommon.forEach(f => {
      if (!formData[f.name] || formData[f.name] === '') errors[f.name] = `${f.label} is required`
    })
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Please enter a valid email address'
    if (formData.password && formData.password.length < 8) errors.password = 'Password must be at least 8 characters'
    roleConfig.specificFields?.filter(f => f.required).forEach(f => {
      if (!formData[f.name] || formData[f.name] === '') errors[f.name] = `${f.label} is required`
    })
  }
  if (step === 2) {
    COMMON_FIELDS.filter(f => f.required && f.group === 'Documents').forEach(f => {
      if (!formData[f.name] || formData[f.name] === '') errors[f.name] = `${f.label} is required`
    })
  }
  return errors
}

export default function RegistrationPage() {
  const { role } = useParams()
  const navigate = useNavigate()
  const topRef = useRef(null)
  const roleConfig = ENTITY_ROLES.find(r => r.id === role)
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({})
  const [errors, setErrors] = useState({})
  const [nexusId] = useState(() => generateNexusID(role))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const enrichedRole = roleConfig
    ? { ...roleConfig, specificFields: ROLE_SPECIFIC_FIELDS[role] || [] }
    : null

  useEffect(() => { topRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [currentStep])

  if (!enrichedRole) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="card text-center">
          <p className="text-error font-semibold mb-3">Invalid role selected.</p>
          <button onClick={() => navigate('/register')} className="btn-primary">← Go Back</button>
        </div>
      </div>
    )
  }

  const Icon = ICONS[enrichedRole.icon]

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleNext = () => {
    const stepErrors = validateStep(currentStep, formData, enrichedRole)
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors)
      topRef.current?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    setErrors({})
    setCurrentStep(s => s + 1)
  }

  const uploadFile = async (file, folder) => {
    if (!file || !(file instanceof File)) return null
    const ext = file.name.split('.').pop()
    const path = `${folder}/${nexusId}-${Date.now()}.${ext}`
    const { data, error } = await supabase.storage.from('entity-documents').upload(path, file, { upsert: true })
    if (error) throw new Error(`File upload failed: ${error.message}`)
    return data.path
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setSubmitError('')
    try {
      const idDocPath = await uploadFile(formData.id_document, 'id-docs')
      const photoPath = await uploadFile(formData.profile_photo, 'photos')
      const roleData = {}
      enrichedRole.specificFields?.forEach(f => { if (formData[f.name] !== undefined) roleData[f.name] = formData[f.name] })
      const fingerprint = await generateBlockchainFingerprint({ nexus_id: nexusId, role, email: formData.email, full_name: formData.full_name, timestamp: new Date().toISOString() })
      const { error: insertError } = await supabase.from('entities').insert({
        nexus_id: nexusId, role, full_name: formData.full_name,
        date_of_birth: formData.date_of_birth || null, gender: formData.gender || null,
        email: formData.email, phone: formData.phone || null,
        password_hash: formData.password,
        country: formData.country || null, state: formData.state || null,
        lga: formData.lga || null, physical_address: formData.physical_address || null,
        location_gps: formData.location_gps || null, id_type: formData.id_type || null,
        id_number: formData.id_number || null, role_data: roleData,
        blockchain_fingerprint: fingerprint, verification_status: 'pending',
      })
      if (insertError) throw new Error(insertError.message)
      const entityRes = await supabase.from('entities').select('id').eq('nexus_id', nexusId).single()
      if (entityRes.data && (idDocPath || photoPath)) {
        const docs = []
        if (idDocPath) docs.push({ entity_id: entityRes.data.id, doc_type: 'id_document', file_name: formData.id_document?.name, file_path: idDocPath, mime_type: formData.id_document?.type, file_size: formData.id_document?.size })
        if (photoPath) docs.push({ entity_id: entityRes.data.id, doc_type: 'profile_photo', file_name: formData.profile_photo?.name, file_path: photoPath, mime_type: formData.profile_photo?.type, file_size: formData.profile_photo?.size })
        await supabase.from('documents').insert(docs)
      }
      navigate('/register/success', { state: { nexusId, role, fullName: formData.full_name } })
    } catch (err) {
      console.error('Submission error:', err)
      setSubmitError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navbar variant="light" />
      <div ref={topRef} className="min-h-screen pt-16 flex flex-col lg:flex-row">

        {/* LEFT PANEL */}
        <div className="flex-1 flex flex-col px-4 sm:px-8 lg:px-12 py-10 max-w-2xl mx-auto w-full lg:max-w-none lg:mx-0">
          <div className="flex items-center gap-3 mb-8 animate-fadeInUp">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: `${enrichedRole.color}15`, border: `1.5px solid ${enrichedRole.color}30` }}>
              {Icon && <Icon className="w-5 h-5" style={{ color: enrichedRole.color }} />}
            </div>
            <div>
              <p className="text-xs font-display font-semibold text-textSecondary uppercase tracking-widest">{enrichedRole.profileType}</p>
              <h1 className="text-xl font-display font-bold text-textPrimary leading-tight">{enrichedRole.label} Registration</h1>
            </div>
            <div className="ml-auto"><span className="nexus-badge text-xs">{nexusId}</span></div>
          </div>

          <div className="mb-10"><ProgressBar currentStep={currentStep} /></div>

          <div className="flex-1">
            {currentStep === 1 && <Step1ProfileInfo roleConfig={enrichedRole} formData={formData} onChange={handleChange} errors={errors} />}
            {currentStep === 2 && <Step2Documents formData={formData} onChange={handleChange} errors={errors} />}
            {currentStep === 3 && <Step3Review roleConfig={enrichedRole} formData={formData} nexusId={nexusId} onEdit={setCurrentStep} />}
          </div>

          {submitError && (
            <div className="mt-4 px-4 py-3 bg-red-50 border border-error/20 rounded-xl text-sm text-error font-body">{submitError}</div>
          )}

          <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-100">
            <button
              onClick={() => currentStep > 1 ? setCurrentStep(s => s - 1) : navigate('/register')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-gray-200 font-display font-semibold text-sm text-textSecondary hover:border-primary hover:text-primary transition-all duration-200">
              <ChevronLeft className="w-4 h-4" /> {currentStep > 1 ? 'Back' : 'Change Role'}
            </button>
            {currentStep < 3 ? (
              <button onClick={handleNext}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-white font-display font-semibold text-sm hover:bg-primary-600 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-200">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-accent text-white font-display font-semibold text-sm hover:bg-accent-dark shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100">
                {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <>Submit Registration <ChevronRight className="w-4 h-4" /></>}
              </button>
            )}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="hidden lg:flex w-80 xl:w-96 flex-col bg-[#060f1e] px-8 py-12 sticky top-16 h-[calc(100vh-4rem)] overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: `linear-gradient(rgba(0,180,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,180,255,0.5) 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />
          <div className="relative z-10 flex flex-col h-full">
            <div className="mb-8">
              <svg viewBox="0 0 40 40" fill="none" className="w-12 h-12 mb-3">
                <polygon points="20,2 36,11 36,29 20,38 4,29 4,11" fill="#004C99" stroke="#0070E0" strokeWidth="1.5" />
                <path d="M13 22 L17 18 L20 21 L24 15 L27 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
              <h2 className="font-display font-bold text-white text-lg leading-tight">NordRock<br />TraceChain</h2>
              <p className="text-white/40 text-xs font-body mt-1">Blockchain Mineral Traceability</p>
            </div>
            <div className="space-y-4 mb-8">
              {[
                { step: 1, title: 'Profile Information', desc: 'Your personal or business identity and contact details.' },
                { step: 2, title: 'Verification Documents', desc: 'Upload your ID and supporting certifications.' },
                { step: 3, title: 'Review & Submit', desc: 'Confirm your details before final submission.' },
              ].map(item => (
                <div key={item.step} className={`flex gap-3 p-3 rounded-xl transition-all duration-300 ${currentStep === item.step ? 'bg-white/8 border border-white/10' : 'opacity-40'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-display font-bold flex-shrink-0 ${currentStep > item.step ? 'bg-accent text-white' : currentStep === item.step ? 'bg-primary text-white' : 'bg-white/10 text-white/50'}`}>
                    {currentStep > item.step ? '✓' : item.step}
                  </div>
                  <div>
                    <p className="text-sm font-display font-semibold text-white">{item.title}</p>
                    <p className="text-xs font-body text-white/50 mt-0.5 leading-snug">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-auto">
              <p className="text-xs font-display font-semibold text-white/40 uppercase tracking-widest mb-3">After submission</p>
              <div className="space-y-3">
                {['Your Nexus ID is permanently recorded on the blockchain ledger', 'An Inspector will review your documents within 2–5 business days', 'You will receive an email with your verification status'].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0 mt-1.5" />
                    <p className="text-xs font-body text-white/50 leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
