import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import Constants from 'expo-constants'
import { Platform } from 'react-native'

import { devLog } from '@/utils/devLog'

/** Backend API port — NOT the Expo/Metro web port (often 8081/19006/etc.). Next.js default is 3000. */
const API_PORT = process.env.EXPO_PUBLIC_API_PORT || '3000'

function stripDevUriScheme(value) {
  if (!value || typeof value !== 'string') return null
  return value.trim().replace(/^https?:\/\//, '')
}

/** Host (no port) from values like `192.168.1.65:8081` or `[::1]:8081` */
function hostFromHostPortPair(hostWithPort) {
  const s = stripDevUriScheme(hostWithPort)
  if (!s) return null
  if (s.startsWith('[')) {
    const end = s.indexOf(']')
    if (end !== -1) return s.slice(1, end) || null
  }
  const colon = s.indexOf(':')
  return colon === -1 ? s : s.slice(0, colon)
}

function hostFromExpUrl(value) {
  if (!value || typeof value !== 'string') return null
  const match = value.trim().match(/^exp:\/\/([^/?#]+)/i)
  if (!match) return null
  return hostFromHostPortPair(match[1])
}

function getDevPackagerHost() {
  const candidates = [
    Constants.expoConfig?.hostUri,
    Constants.expoGoConfig?.debuggerHost,
    Constants.experienceUrl,
    Constants.linkingUri,
    typeof Constants.manifest === 'object' && Constants.manifest
      ? Constants.manifest.debuggerHost
      : null,
  ]

  for (const c of candidates) {
    const host = hostFromHostPortPair(c)
    if (host) return host
  }

  for (const c of candidates) {
    const host = hostFromExpUrl(c)
    if (host) return host
  }

  return null
}

export function resolveBaseUrl() {
  const explicit = process.env.EXPO_PUBLIC_BASE_URL || process.env.EXPO_PUBLIC_API_URL

  if (explicit) {
    return explicit.replace(/\/$/, '')
  }

  if (__DEV__) {
    const packagerHost = getDevPackagerHost()
    if (packagerHost) {
      return `http://${packagerHost}:${API_PORT}`
    }

    if (Platform.OS === 'android') {
      return `http://10.0.2.2:${API_PORT}`
    }
  }

  return `http://localhost:${API_PORT}`
}

function joinUrl(base, path) {
  const b = base.replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return `${b}${p}`
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: '',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().user?.token
    if (token) headers.set('authorization', token)
    headers.set('Accept', 'application/json')
    return headers
  },
})

const baseQueryWithHost = async (args, api, extraOptions) => {
  const baseUrl = resolveBaseUrl()
  const path = typeof args === 'string' ? args : args.url
  const fullUrl = joinUrl(baseUrl, path)
  const adapted = typeof args === 'string' ? fullUrl : { ...args, url: fullUrl }

  const method = String((typeof adapted === 'object' && adapted.method) || 'GET').toUpperCase()
  const body = typeof adapted === 'object' ? adapted.body : undefined

  devLog.apiRequest(method, fullUrl, body)

  const started = Date.now()
  const result = await rawBaseQuery(adapted, api, extraOptions)
  const ms = Date.now() - started

  if (result.error) {
    devLog.apiError(method, fullUrl, ms, result.error)
  } else {
    devLog.apiResponse(method, fullUrl, ms, result.data)
  }

  return result
}

if (__DEV__) {
  const host = getDevPackagerHost()
  if (!process.env.EXPO_PUBLIC_BASE_URL && !process.env.EXPO_PUBLIC_API_URL && !host) {
    console.warn(
      '[api] No Expo dev host found (hostUri / debuggerHost). Set EXPO_PUBLIC_BASE_URL in .env (e.g. http://YOUR_PC_LAN_IP:' +
        API_PORT +
        ').'
    )
  }
}

const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithHost,
  tagTypes: ['User', 'Review', 'Details', 'Order', 'Product', 'Category', 'Slider', 'Banner'],
  endpoints: builder => ({}),
})

export default apiSlice
