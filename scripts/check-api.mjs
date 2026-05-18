/**
 * Quick check that the backend returns JSON (not HTML).
 * Usage:
 *   node scripts/check-api.mjs
 *   node scripts/check-api.mjs http://192.168.1.65:3000
 */
function formatErr(err) {
  const parts = [err?.name, err?.message].filter(Boolean)
  const c = err?.cause
  if (c) {
    parts.push(`cause: ${c.code || ''} ${c.message || c}`.trim())
  }
  if (err?.code) parts.push(`code: ${err.code}`)
  return parts.join(' | ')
}

const base = (process.argv[2] || process.env.API_CHECK_URL || 'http://localhost:3000').replace(/\/$/, '')
const paths = ['/api/feed', '/api/category']

console.log(`Base: ${base}\n`)

for (const p of paths) {
  const url = `${base}${p}`
  process.stdout.write(`${url} … `)
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(15000),
    })
    const text = await res.text()
    const json = text.trim().startsWith('{') || text.trim().startsWith('[')
    console.log(res.status, json ? 'JSON ✓' : 'Not JSON (likely HTML / wrong server) ✗')
    if (!json) console.log(text.slice(0, 200).replace(/\s+/g, ' '))
  } catch (e) {
    console.log('FAILED', formatErr(e))
  }
}

console.log(`
If FAILED appears:
  1) Start the API: npm run api:dev  (mock server in ./backend, port 3000) — or your real backend on :3000
  2) Test loopback first:       node scripts/check-api.mjs http://127.0.0.1:3000
  3) If (2) works but LAN IP fails: Windows Firewall — allow TCP 3000 (Private network)
  4) 192.168.x.x must be the IP of the machine running Next (ipconfig)`)
