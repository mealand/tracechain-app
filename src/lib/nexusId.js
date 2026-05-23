/**
 * Generates a unique Nexus ID for each entity type
 * Format: PREFIX-YYYYMMDD-RANDOM4
 * e.g. MIN-20240221-A3F9
 */

const ROLE_PREFIXES = {
  miner: 'MIN',
  artisan: 'ART',
  aggregator: 'AGG',
  processing_center: 'PRC',
  assay: 'ASY',
  logistics: 'LOG',
  freight: 'FRT',
  security: 'SEC',
  admin: 'ADM',
  inspector: 'INS',
}

export function generateNexusID(role) {
  const prefix = ROLE_PREFIXES[role] || 'ENT'
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.random().toString(36).toUpperCase().slice(2, 6)
  return `${prefix}-${dateStr}-${random}`
}

/**
 * Generates a Trace ID for a product batch
 * Format: TRC-YYYYMMDD-RANDOM6
 */
export function generateTraceID() {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.random().toString(36).toUpperCase().slice(2, 8)
  return `TRC-${dateStr}-${random}`
}

/**
 * Creates a simple SHA-256-style hash from entity data (simulated blockchain fingerprint)
 * In production this would be replaced by an actual on-chain transaction hash
 */
export async function generateBlockchainFingerprint(data) {
  const text = JSON.stringify(data) + Date.now()
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}
