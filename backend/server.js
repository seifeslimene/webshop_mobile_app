/**
 * Minimal REST API for the Webshop Expo app (matches routes under services/*.service.js).
 * Run: npm start (from ./backend) or npm run api:dev from repo root.
 */
import cors from 'cors'
import express from 'express'
import crypto from 'crypto'

import { buildProducts, categories as seedCategories, feedPayload, finalizeProduct } from './fixtures.js'

const PORT = Number(process.env.PORT || process.env.API_PORT || 3000)
const HOST = process.env.HOST || '0.0.0.0'

function clone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

let categoriesState = clone(seedCategories)
let productsState = buildProducts()

const tokens = new Map()
/** email -> { password, profile } */
const accounts = new Map()

/** email -> orders[] newest last — we'll reverse for UX */
const ordersByEmail = new Map()
/** email -> reviews[] */
const reviewsByEmail = new Map()

function demoProfile(email, name) {
  return {
    _id: 'usr_' + crypto.randomBytes(6).toString('hex'),
    name,
    email,
    mobile: '+33 6 12 34 56 78',
    address: {
      street: '15 Rue du Commerce',
      postalCode: '75015',
      province: { code: 'FR', name: 'France' },
      city: { name: 'Paris' },
      area: { name: 'Île-de-France' },
    },
  }
}

accounts.set('demo@example.com', {
  password: 'demo123',
  profile: demoProfile('demo@example.com', 'Demo User'),
})

accounts.set('admin@gmail.com', {
  password: '123456',
  profile: demoProfile('admin@gmail.com', 'Admin'),
})

function stripInternal(product) {
  const { effectivePrice: _, ...rest } = product
  return rest
}

function authEmail(req) {
  const raw = req.headers.authorization
  if (!raw || typeof raw !== 'string') return null
  const token = raw.trim()
  return tokens.get(token) || null
}

function requireAuth(req, res) {
  const email = authEmail(req)
  if (!email) {
    res.status(401).json({ message: 'Unauthorized' })
    return null
  }
  return email
}

function parseBool(v) {
  return v === true || v === 'true' || v === '1'
}

function filterProducts(query) {
  const category = query.category?.toString()?.trim() || ''
  const search = query.search?.toString()?.toLowerCase() || ''
  const discountFilter = parseBool(query.discount)
  const inStockFilter = parseBool(query.inStock)
  const priceRange = query.price?.toString()?.trim() || ''

  let minP
  let maxP
  if (priceRange.includes('-')) {
    const [a, b] = priceRange.split('-').map(x => Number(String(x).trim()))
    if (Number.isFinite(a)) minP = a
    if (Number.isFinite(b)) maxP = b
  }

  let list = productsState.map(stripInternal)

  if (category) {
    list = list.filter(p => p.categorySlug === category)
  }
  if (search) {
    list = list.filter(p => p.title.toLowerCase().includes(search))
  }
  if (discountFilter) {
    list = list.filter(p => Number(p.discount) > 0)
  }
  if (inStockFilter) {
    list = list.filter(p => Number(p.inStock) > 0)
  }
  if (minP != null || maxP != null) {
    list = list.filter(p => {
      const ep = finalizeProduct(p).effectivePrice
      if (minP != null && ep < minP) return false
      if (maxP != null && ep > maxP) return false
      return true
    })
  }

  return list
}

function priceBoundsForCategory(category) {
  const q = category ? { category } : {}
  const list = filterProducts(q)
  if (!list.length) return { mainMinPrice: 0, mainMaxPrice: 1000 }
  const eps = list.map(p => finalizeProduct(p).effectivePrice)
  return {
    mainMinPrice: Math.floor(Math.min(...eps)),
    mainMaxPrice: Math.ceil(Math.max(...eps)),
  }
}

function paginate(arr, page, pageSize) {
  const p = Math.max(1, Number(page) || 1)
  const ps = Math.max(1, Math.min(100, Number(pageSize) || 10))
  const start = (p - 1) * ps
  const slice = arr.slice(start, start + ps)
  return {
    items: slice,
    pagination: {
      page: p,
      pageSize: ps,
      hasNextPage: start + slice.length < arr.length,
    },
  }
}

const app = express()
app.use(cors({ origin: true, credentials: true }))
app.use(express.json())

app.get('/health', (_req, res) => res.json({ ok: true }))

app.get('/api/feed', (_req, res) => {
  const payload = feedPayload(categoriesState, productsState)
  res.json({ data: payload })
})

app.get('/api/category', (_req, res) => {
  res.json({ data: { categories: categoriesState } })
})

app.get('/api/category/:id', (req, res) => {
  const c = categoriesState.find(x => x._id === req.params.id)
  if (!c) return res.status(404).json({ message: 'Not found' })
  res.json({ data: { category: c } })
})

app.post('/api/category', (_req, res) => {
  const body = _req.body || {}
  const cat = {
    _id: 'cat_' + crypto.randomBytes(6).toString('hex'),
    name: body.name || 'New',
    slug: body.slug || 'new-category',
    level: body.level ?? 1,
    parent: body.parent ?? '',
    image: body.image || 'https://picsum.photos/seed/newcat/100/100',
  }
  categoriesState.push(cat)
  res.status(201).json({ data: { category: cat } })
})

app.put('/api/category/:id', (req, res) => {
  const i = categoriesState.findIndex(x => x._id === req.params.id)
  if (i === -1) return res.status(404).json({ message: 'Not found' })
  categoriesState[i] = { ...categoriesState[i], ...req.body }
  res.json({ data: { category: categoriesState[i] } })
})

app.get('/api/products', (req, res) => {
  const filtered = filterProducts(req.query)
  const { mainMinPrice, mainMaxPrice } = priceBoundsForCategory(req.query.category?.toString())

  const page = req.query.page ?? 1
  const page_size = req.query.page_size ?? 10
  const { items, pagination } = paginate(filtered, page, page_size)

  res.json({
    data: {
      products: items,
      productsLength: filtered.length,
      pagination,
      mainMinPrice,
      mainMaxPrice,
    },
  })
})

app.get('/api/products/itemDetail', (req, res) => {
  const id = req.query.id?.toString()
  const product = productsState.find(p => p._id === id)
  if (!product) return res.status(404).json({ message: 'Product not found' })

  const similar = productsState
    .filter(p => p._id !== product._id && p.categorySlug === product.categorySlug)
    .slice(0, 8)
    .map(stripInternal)

  res.json({
    data: {
      product: stripInternal(product),
      smilarProducts: {
        title: 'Similar picks',
        products: similar,
      },
    },
  })
})

app.get('/api/products/:id', (req, res) => {
  const product = productsState.find(p => p._id === req.params.id)
  if (!product) return res.status(404).json({ message: 'Not found' })
  res.json({ data: { product: stripInternal(product) } })
})

app.post('/api/products', (req, res) => {
  const body = req.body || {}
  const np = finalizeProduct({
    _id: 'prod_' + crypto.randomBytes(6).toString('hex'),
    title: body.title || 'New product',
    slug: body.slug || 'new-product',
    price: Number(body.price) || 99,
    discount: Number(body.discount) || 0,
    inStock: Number.isFinite(Number(body.inStock)) ? Number(body.inStock) : 10,
    sold: 0,
    rating: 4,
    numReviews: 0,
    categorySlug: body.categorySlug || 'smartphones',
    images: body.images?.length ? body.images : [{ url: 'https://picsum.photos/seed/newprod/400/400' }],
    colors: body.colors?.length ? body.colors : [],
    sizes: body.sizes?.length ? body.sizes : [],
    info: body.info || [],
    description: body.description || '',
    specification: body.specification || [],
  })
  productsState.push(np)
  res.status(201).json({ data: { product: stripInternal(np) } })
})

app.put('/api/products/:id', (req, res) => {
  const i = productsState.findIndex(p => p._id === req.params.id)
  if (i === -1) return res.status(404).json({ message: 'Not found' })
  const merged = finalizeProduct({ ...productsState[i], ...req.body })
  productsState[i] = merged
  res.json({ data: { product: stripInternal(merged) } })
})

app.delete('/api/products/:id', (req, res) => {
  const i = productsState.findIndex(p => p._id === req.params.id)
  if (i === -1) return res.status(404).json({ message: 'Not found' })
  productsState.splice(i, 1)
  res.json({ message: 'Deleted' })
})

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {}
  const row = accounts.get(String(email || '').toLowerCase())
  if (!row || row.password !== password) {
    return res.status(401).json({ message: 'Invalid credentials', data: {} })
  }
  const token = crypto.randomBytes(24).toString('hex')
  tokens.set(token, row.profile.email.toLowerCase())
  res.json({
    message: 'Logged in',
    data: { token },
  })
})

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body || {}
  const em = String(email || '').toLowerCase()
  if (!em || !password) {
    return res.status(400).json({ message: 'Email and password required' })
  }
  if (accounts.has(em)) {
    return res.status(409).json({ message: 'Email already registered' })
  }
  const profile = demoProfile(em, name || 'New User')
  profile.address = undefined
  accounts.set(em, { password, profile })
  const token = crypto.randomBytes(24).toString('hex')
  tokens.set(token, em)
  res.json({
    message: 'Registered',
    data: { token },
  })
})

app.get('/api/auth/user', (req, res) => {
  const email = requireAuth(req, res)
  if (!email) return
  const row = accounts.get(email)
  if (!row) return res.status(401).json({ message: 'Unauthorized' })
  res.json({ data: row.profile })
})

app.get('/api/user', (req, res) => {
  const users = [...accounts.values()].map(a => a.profile)
  const page = Number(req.query.page) || 1
  const { items, pagination } = paginate(users, page, 20)
  res.json({
    data: {
      users: items,
      pagination,
    },
  })
})

app.patch('/api/user', (req, res) => {
  const email = requireAuth(req, res)
  if (!email) return
  const row = accounts.get(email)
  if (!row) return res.status(401).json({ message: 'Unauthorized' })
  const body = req.body || {}
  row.profile = {
    ...row.profile,
    ...body,
    _id: row.profile._id,
    email: row.profile.email,
  }
  res.json({ message: 'Updated', data: row.profile })
})

app.delete('/api/user/:id', (req, res) => {
  res.json({ message: 'Mock delete ok' })
})

app.post('/api/order', (req, res) => {
  const email = requireAuth(req, res)
  if (!email) return
  const body = req.body || {}
  const order = {
    _id: 'ord_' + crypto.randomBytes(8).toString('hex'),
    delivered: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totalPrice: Number(body.totalPrice) || 0,
    totalDiscount: Number(body.totalDiscount) || 0,
    paymentMethod: body.paymentMethod || '',
    cart: (body.cart || []).map(line => ({
      productID: line.productID,
      name: line.name,
      img: line.img || { url: '' },
      quantity: line.quantity,
    })),
  }
  const list = ordersByEmail.get(email) || []
  list.push(order)
  ordersByEmail.set(email, list)
  res.status(201).json({ message: 'Order placed', data: { order } })
})

function ordersPayload(email, page, pageSize) {
  const list = [...(ordersByEmail.get(email) || [])].reverse()
  const { items, pagination } = paginate(list, page, pageSize)
  return {
    orders: items,
    ordersLength: list.length,
    pagination,
  }
}

app.get('/api/order/list', (req, res) => {
  const email = requireAuth(req, res)
  if (!email) return
  const page = req.query.page ?? 1
  const page_size = req.query.page_size ?? 10
  res.json({ data: ordersPayload(email, page, page_size) })
})

app.get('/api/order', (req, res) => {
  const email = requireAuth(req, res)
  if (!email) return
  const page = req.query.page ?? 1
  const page_size = req.query.page_size ?? 10
  res.json({ data: ordersPayload(email, page, page_size) })
})

app.get('/api/order/:id', (req, res) => {
  const email = requireAuth(req, res)
  if (!email) return
  const list = ordersByEmail.get(email) || []
  const order = list.find(o => o._id === req.params.id)
  if (!order) return res.status(404).json({ message: 'Not found' })
  res.json({ data: { order } })
})

app.patch('/api/order/:id', (req, res) => {
  const email = requireAuth(req, res)
  if (!email) return
  const list = ordersByEmail.get(email) || []
  const order = list.find(o => o._id === req.params.id)
  if (!order) return res.status(404).json({ message: 'Not found' })
  Object.assign(order, req.body || {}, { updatedAt: new Date().toISOString() })
  res.json({ message: 'Updated', data: { order } })
})

function productStub(productId) {
  const p = productsState.find(x => x._id === productId)
  if (!p) return { images: [{ url: 'https://picsum.photos/seed/missing/80/80' }] }
  return { images: p.images }
}

app.get('/api/reviews/list', (req, res) => {
  const email = requireAuth(req, res)
  if (!email) return
  const page = req.query.page ?? 1
  const mine = [...(reviewsByEmail.get(email) || [])].reverse()
  const { items, pagination } = paginate(mine, page, 10)
  res.json({
    data: {
      reviews: items,
      reviewsLength: mine.length,
      pagination,
    },
  })
})

app.get('/api/reviews', (req, res) => {
  const email = requireAuth(req, res)
  if (!email) return
  const page = req.query.page ?? 1
  const page_size = req.query.page_size ?? 5
  const mine = [...(reviewsByEmail.get(email) || [])].reverse()
  const { items, pagination } = paginate(mine, page, page_size)
  res.json({
    data: {
      reviews: items,
      reviewsLength: mine.length,
      pagination,
    },
  })
})

app.get('/api/reviews/product/:id', (req, res) => {
  const page = Number(req.query.page) || 1
  const pageSize = Number(req.query.page_size) || 5
  const all = []
  for (const list of reviewsByEmail.values()) {
    for (const r of list) {
      if (r.productID === req.params.id) all.push(r)
    }
  }
  const { items, pagination } = paginate(all, page, pageSize)
  res.json({ data: { reviews: items, pagination } })
})

app.post('/api/reviews', (req, res) => {
  const email = requireAuth(req, res)
  if (!email) return
  const body = req.body || {}
  const rev = {
    _id: 'rev_' + crypto.randomBytes(6).toString('hex'),
    title: body.title || 'Review',
    rating: Number(body.rating) || 5,
    status: 1,
    productID: body.productID || body.prdouctID,
    product: productStub(body.productID || body.prdouctID),
    comment: body.comment || '',
    createdAt: new Date().toISOString(),
  }
  const list = reviewsByEmail.get(email) || []
  list.push(rev)
  reviewsByEmail.set(email, list)
  res.status(201).json({ message: 'Created', data: { review: rev } })
})

app.get('/api/reviews/:id', (req, res) => {
  let found
  for (const list of reviewsByEmail.values()) {
    found = list.find(r => r._id === req.params.id)
    if (found) break
  }
  if (!found) return res.status(404).json({ message: 'Not found' })
  res.json({ data: { review: found } })
})

app.delete('/api/reviews/:id', (req, res) => {
  const email = requireAuth(req, res)
  if (!email) return
  const list = reviewsByEmail.get(email) || []
  const i = list.findIndex(r => r._id === req.params.id)
  if (i === -1) return res.status(404).json({ message: 'Not found' })
  list.splice(i, 1)
  res.json({ message: 'Deleted' })
})

app.patch('/api/reviews/:id', (req, res) => {
  const email = requireAuth(req, res)
  if (!email) return
  const list = reviewsByEmail.get(email) || []
  const rev = list.find(r => r._id === req.params.id)
  if (!rev) return res.status(404).json({ message: 'Not found' })
  Object.assign(rev, req.body || {})
  res.json({ message: 'Updated', data: { review: rev } })
})

app.get('/api/upload/getToken', (_req, res) => {
  res.json({
    data: {
      token: 'mock-upload-token',
      uploadUrl: 'https://example.invalid/upload',
    },
  })
})

function seedDemoReview() {
  const email = 'demo@example.com'
  const p = productsState[0]
  const rev = {
    _id: 'rev_seed_1',
    title: 'Great demo unit',
    rating: 5,
    status: 2,
    productID: p._id,
    product: { images: p.images },
    comment: 'Seeded review for local API.',
    createdAt: new Date().toISOString(),
  }
  reviewsByEmail.set(email, [rev])
}

seedDemoReview()

app.listen(PORT, HOST, () => {
  console.log(`Webshop mock API listening on http://${HOST}:${PORT}`)
  console.log(`Try: curl -s ${HOST === '0.0.0.0' ? '127.0.0.1' : HOST}:${PORT}/api/category | head`)
  console.log(`Logins: demo@example.com / demo123 · admin@gmail.com / 123456`)
})
