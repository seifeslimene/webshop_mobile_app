/**
 * Verbose HTTP / auth logging. Uses __DEV__ or EXPO_PUBLIC_DEBUG_LOG=1.
 * Passwords and tokens are redacted from payloads.
 */

const ENABLED = __DEV__ || process.env.EXPO_PUBLIC_DEBUG_LOG === '1'
const PREFIX = '[webshop]'

const SENSITIVE_KEY_SUBSTRINGS = [
  'password',
  'token',
  'secret',
  'authorization',
  'accesstoken',
  'refreshtoken',
  'credential',
  'apikey',
  'api_key',
]

function isSensitiveKey(key) {
  const lower = String(key).toLowerCase()
  return SENSITIVE_KEY_SUBSTRINGS.some(s => lower.includes(s))
}

export function sanitizeForLog(value, depth = 0, seen = new WeakSet()) {
  if (!ENABLED) return undefined
  if (value == null) return value
  if (typeof value !== 'object') return value
  if (depth > 6) return '[MaxDepth]'
  if (seen.has(value)) return '[Circular]'
  if (Array.isArray(value)) {
    seen.add(value)
    return value.slice(0, 50).map((item, i) => {
      if (i >= 20) return '…'
      return sanitizeForLog(item, depth + 1, seen)
    })
  }
  seen.add(value)
  const out = {}
  let count = 0
  for (const [k, v] of Object.entries(value)) {
    if (count++ > 40) {
      out['…'] = 'truncated keys'
      break
    }
    out[k] = isSensitiveKey(k) ? '[REDACTED]' : sanitizeForLog(v, depth + 1, seen)
  }
  return out
}

function summarizeData(data, maxLen = 1200) {
  if (data == null) return data
  try {
    const s = JSON.stringify(sanitizeForLog(data))
    if (s.length <= maxLen) return s
    return `${s.slice(0, maxLen)}… (${s.length} chars)`
  } catch {
    return String(data).slice(0, maxLen)
  }
}

function formatFetchError(error) {
  if (!error || typeof error !== 'object') return error
  const { status, data, error: errName, originalStatus } = error
  return {
    status: status ?? originalStatus,
    error: errName,
    data: sanitizeForLog(data),
  }
}

export const devLog = {
  enabled: ENABLED,

  info(scope, message, payload) {
    if (!ENABLED) return
    if (payload !== undefined) {
      console.log(`${PREFIX} [${scope}] ${message}`, payload)
    } else {
      console.log(`${PREFIX} [${scope}] ${message}`)
    }
  },

  warn(scope, message, payload) {
    if (!ENABLED) return
    if (payload !== undefined) {
      console.warn(`${PREFIX} [${scope}] ${message}`, payload)
    } else {
      console.warn(`${PREFIX} [${scope}] ${message}`)
    }
  },

  /** RTK Query / fetch network layer */
  apiRequest(method, url, body) {
    if (!ENABLED) return
    const line = `${method} ${url}`
    if (body !== undefined && body !== null) {
      console.log(`${PREFIX} [api] → ${line}`, sanitizeForLog(body))
    } else {
      console.log(`${PREFIX} [api] → ${line}`)
    }
  },

  apiResponse(method, url, ms, data) {
    if (!ENABLED) return
    console.log(`${PREFIX} [api] ← ${method} ${url} ${ms}ms OK`, summarizeData(data))
  },

  apiError(method, url, ms, error) {
    if (!ENABLED) return
    console.warn(`${PREFIX} [api] ✗ ${method} ${url} ${ms}ms`, formatFetchError(error))
  },

  /** Token preview: first/last few chars only */
  authTokenHint(token) {
    if (!ENABLED || !token || typeof token !== 'string') return '[none]'
    if (token.length <= 14) return '[short]'
    return `${token.slice(0, 6)}…${token.slice(-4)} (${token.length} chars)`
  },
}
