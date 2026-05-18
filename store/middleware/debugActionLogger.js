import { devLog, sanitizeForLog } from '@/utils/devLog'

const SKIP_PREFIXES = ['persist/FLUSH', 'persist/PAUSE', 'persist/PERSIST', 'persist/PURGE']

function shouldLogAction(type) {
  if (!type || typeof type !== 'string') return false
  if (SKIP_PREFIXES.some(p => type.startsWith(p))) return false
  if (type.startsWith('api/')) return true
  if (type.startsWith('user/')) return true
  if (type === 'persist/REHYDRATE') return true
  return false
}

function summarizeMeta(meta) {
  if (!meta || typeof meta !== 'object') return undefined
  const { requestId, arg } = meta
  const row = {}
  if (requestId != null) row.requestId = requestId
  if (arg && typeof arg === 'object') {
    if (arg.endpointName) row.endpoint = arg.endpointName
    if (arg.type) row.type = arg.type
    if (arg.originalArgs != null) row.args = sanitizeForLog(arg.originalArgs)
  }
  return Object.keys(row).length ? row : undefined
}

/** Logs Redux Toolkit + RTK Query + user slice actions (dev / EXPO_PUBLIC_DEBUG_LOG). */
export const debugActionLogger = _store => next => action => {
  const { type, payload, meta } = action
  if (!devLog.enabled || !shouldLogAction(type)) {
    return next(action)
  }

  if (type === 'user/userLogout') {
    devLog.info('redux', type, 'session cleared (token removed)')
    return next(action)
  }

  if (type === 'user/userLogin' && typeof payload === 'string') {
    devLog.info('redux', type, { token: devLog.authTokenHint(payload) })
    return next(action)
  }

  if (type === 'persist/REHYDRATE') {
    const keys = payload ? Object.keys(payload) : []
    devLog.info('redux', `REHYDRATE slices: ${keys.join(', ')}`)
    return next(action)
  }

  const extra = summarizeMeta(meta)
  if (extra !== undefined) {
    devLog.info('redux', type, { ...extra, payload: sanitizeForLog(payload) })
  } else if (payload !== undefined) {
    devLog.info('redux', type, sanitizeForLog(payload))
  } else {
    devLog.info('redux', type)
  }

  return next(action)
}
