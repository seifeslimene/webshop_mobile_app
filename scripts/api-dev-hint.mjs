/**
 * Prints your LAN IP(s) and the exact .env + terminal commands so the phone can reach the API.
 * Run: npm run api:dev-hint
 */
import { networkInterfaces } from 'os'

const PORT = process.env.EXPO_PUBLIC_API_PORT || process.env.API_PORT || '3000'

function lanIPv4s() {
  const nets = networkInterfaces() || {}
  const out = []
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      const fam = net.family
      const isV4 = fam === 'IPv4' || fam === 4
      if (isV4 && !net.internal) out.push({ name, address: net.address })
    }
  }
  return out
}

const addrs = lanIPv4s().sort((a, b) => {
  const ap = a.address.startsWith('169.254.') ? 1 : 0
  const bp = b.address.startsWith('169.254.') ? 1 : 0
  return ap - bp
})
const first = addrs[0]?.address

console.log(`
=== API + Expo (réseau local) =========================================

1) Terminal A — BACKEND Next.js (obligatoire, projet séparé du mobile) :

   npx next dev -H 0.0.0.0 -p ${PORT}

   (-H 0.0.0.0 = accessible depuis le téléphone sur ton IP LAN)

2) Vérifier sur CE PC :

   npm run check-api

   Puis avec ton IP (voir ci-dessous) :

   node scripts/check-api.mjs http://${first || 'TON_IP'}:${PORT}

3) Fichier .env de L'APP MOBILE (ce repo) — décommente et adapte une ligne :

`)

if (addrs.length === 0) {
  console.log('   (Aucune IPv4 LAN trouvée — Wi‑Fi/Ethernet actif ? ipconfig pour ton IP)\n')
} else {
  for (const { name, address } of addrs) {
    console.log(`   EXPO_PUBLIC_BASE_URL=http://${address}:${PORT}   # ${name}`)
  }
}

console.log(`
   Redémarre Metro après modification : Ctrl+C puis npm start

4) Si check-api avec ton IP échoue encore :

   • Pare-feu Windows : autoriser TCP ${PORT} (réseau Privé)
   • Téléphone + PC sur le même Wi‑Fi (pas “invité” isolé)

5) USB (Android, dépannage) :

   adb reverse tcp:${PORT} tcp:${PORT}
   puis dans .env : EXPO_PUBLIC_BASE_URL=http://127.0.0.1:${PORT}

=======================================================================
`)
