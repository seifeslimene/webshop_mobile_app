/** Seed categories + products matching app expectations (see services/*.service.js). */

const pic = seed => `https://picsum.photos/seed/${seed}/600/600`

export const categories = [
  {
    _id: 'cat_l1_elec',
    name: 'Electronics',
    slug: 'electronics',
    level: 1,
    parent: '',
    image: pic('c_l1'),
  },
  {
    _id: 'cat_l2_phone',
    name: 'Phones',
    slug: 'phones',
    level: 2,
    parent: 'cat_l1_elec',
    image: pic('c_l2p'),
  },
  {
    _id: 'cat_l2_tab',
    name: 'Tablets',
    slug: 'tablets',
    level: 2,
    parent: 'cat_l1_elec',
    image: pic('c_l2t'),
  },
  {
    _id: 'cat_l3_smart',
    name: 'Smartphones',
    slug: 'smartphones',
    level: 3,
    parent: 'cat_l2_phone',
    image: pic('c_l3s'),
  },
  {
    _id: 'cat_l3_acc',
    name: 'Accessories',
    slug: 'accessories',
    level: 3,
    parent: 'cat_l2_phone',
    image: pic('c_l3a'),
  },
]

function effectivePrice(p) {
  const d = Number(p.discount) || 0
  return p.price * (1 - d / 100)
}

export function makeProduct(i, categorySlug) {
  const discount = i % 4 === 0 ? 12 : i % 7 === 0 ? 20 : 0
  const inStock = i % 11 === 0 ? 0 : 40 + (i % 15)
  const slugLeaf = categorySlug || 'smartphones'

  return {
    _id: `prod_${i}`,
    title: `Demo handset ${i} · ${slugLeaf}`,
    slug: `demo-product-${i}`,
    price: 89 + (i % 50) * 7,
    discount,
    inStock,
    sold: 5 + (i % 200),
    rating: 3.5 + (i % 15) * 0.1,
    numReviews: 3 + (i % 40),
    categorySlug: slugLeaf,
    images: [{ url: pic(`p${i}a`) }, { url: pic(`p${i}b`) }],
    colors: [
      { id: 'col_1', hashCode: '#1e293b' },
      { id: 'col_2', hashCode: '#dc2626' },
      { id: 'col_3', hashCode: '#16a34a' },
    ],
    sizes: [
      { id: 'sz_1', title: 'Standard' },
      { id: 'sz_2', title: 'Plus' },
    ],
    info: [
      { title: 'Brand', value: 'DemoBrand' },
      { title: 'Model', value: `DM-${i}` },
      { title: 'Warranty', value: '12 months' },
    ],
    description:
      'This is demo catalogue copy for local development. '.repeat(8) +
      'Supports Expo web and native clients against this mock API.',
    specification: [
      { title: 'Weight', value: `${400 + i} g` },
      { title: 'Display', value: '6.1&quot; OLED demo' },
      { title: 'Notes', value: '<strong>In-memory</strong> mock backend.' },
    ],
  }
}

/** Attach computed prices after object creation */
export function finalizeProduct(p) {
  const o = { ...p }
  o.effectivePrice = effectivePrice(o)
  return o
}

const leafSlugs = ['smartphones', 'accessories', 'tablets']

export function buildProducts() {
  const list = []
  for (let i = 1; i <= 36; i++) {
    const slug = leafSlugs[i % leafSlugs.length]
    list.push(finalizeProduct(makeProduct(i, slug)))
  }
  return list
}

export function feedPayload(categoriesList, productsList) {
  const root = categoriesList.find(c => c.slug === 'electronics')
  const childCategories = categoriesList.filter(c => c.parent === root._id)
  return {
    childCategories,
    currentCategory: {
      ...root,
      colors: { start: '#1d4ed8' },
    },
    sliders: [
      { isPublic: true, image: { url: pic('slide1') } },
      { isPublic: true, image: { url: pic('slide2') } },
      { isPublic: false, image: { url: pic('slide_hidden') } },
    ],
    bannerOneType: [{ image: { url: pic('ban1') } }, { image: { url: pic('ban2') } }],
    bannerTwoType: [{ image: { url: pic('ban_wide1') } }, { image: { url: pic('ban_wide2') } }],
  }
}
