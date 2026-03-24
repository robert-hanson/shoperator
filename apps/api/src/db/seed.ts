import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import { env } from '../config/env.js'
import { categories, storeVariants } from './schema.js'

const pool = new pg.Pool({ connectionString: env.DATABASE_URL })
const db = drizzle(pool)

// ─── Categories ────────────────────────────────────────────────────────────────
const categoryData = [
  { name: 'Cold Brew Coffee', slug: 'cold-brew-coffee', iconEmoji: '☕', preferredUnit: 'fl_oz' },
  { name: 'Baby Wipes', slug: 'baby-wipes', iconEmoji: '🧻', preferredUnit: 'count' },
  { name: 'Paper Towels', slug: 'paper-towels', iconEmoji: '🪣', preferredUnit: 'sheets' },
  { name: 'Olive Oil', slug: 'olive-oil', iconEmoji: '🫙', preferredUnit: 'fl_oz' },
  { name: 'Eggs', slug: 'eggs', iconEmoji: '🥚', preferredUnit: 'count' },
  { name: 'Butter', slug: 'butter', iconEmoji: '🧈', preferredUnit: 'oz' },
  { name: 'Mixed Nuts', slug: 'mixed-nuts', iconEmoji: '🥜', preferredUnit: 'oz' },
  { name: 'Laundry Detergent', slug: 'laundry-detergent', iconEmoji: '🫧', preferredUnit: 'fl_oz' },
  { name: 'Dish Soap', slug: 'dish-soap', iconEmoji: '🧼', preferredUnit: 'fl_oz' },
  { name: 'Trash Bags', slug: 'trash-bags', iconEmoji: '🗑️', preferredUnit: 'count' },
] as const

console.log('Seeding categories...')
await db
  .insert(categories)
  .values(categoryData.map((c) => ({ ...c, preferredUnit: c.preferredUnit })))
  .onConflictDoNothing()

// Query all categories (existing + newly inserted) to build catMap
const allCategories = await db.select().from(categories)
const catMap = Object.fromEntries(allCategories.map((c) => [c.slug, c.id]))

// ─── Store Variants ─────────────────────────────────────────────────────────
// Clear all variants so re-running seed is idempotent
console.log('Clearing existing store variants...')
await db.delete(storeVariants)

const variantData = [
  // Cold Brew Coffee
  {
    categorySlug: 'cold-brew-coffee',
    storeId: 'costco',
    name: 'Kirkland Signature Cold Brew Coffee',
    brand: 'Kirkland Signature',
    imageUrl: 'https://costcofan.com/wp-content/uploads/2020/08/Costco-Cold-Brew-Kirkland-Signature-Main.jpg',
    priceCents: 1799,
    unitAmount: 11,
    unitType: 'fl_oz',
    unitCount: 12,
    sourceUrl: 'https://www.costco.com/p/-/kirkland-signature-colombian-cold-brew-coffee-11-fl-oz-12-count/100520076',
    notes: 'Ready-to-drink cans',
  },
  {
    categorySlug: 'cold-brew-coffee',
    storeId: 'costco',
    name: 'SToK Cold Brew Coffee',
    brand: 'SToK',
    imageUrl: 'https://target.scene7.com/is/image/Target/GUEST_1ef24756-2e22-4628-83a4-85cc989b7a29',
    priceCents: 869,
    unitAmount: 48,
    unitType: 'fl_oz',
    unitCount: 2,
    sourceUrl: 'https://www.costco.com',
    notes: '2-pack of 48 fl oz bottles',
  },
  {
    categorySlug: 'cold-brew-coffee',
    storeId: 'aldi',
    name: 'Barissimo Organic Cold Brew Coffee',
    brand: 'Barissimo',
    imageUrl: 'https://dm.cms.aldi.cx/is/image/prod1amer/product/jpg/scaleWidth/500/6f684b0a-439e-4d4c-a379-342e28856d06/Organic%20Cold%20Brew%20Medium%20Roast%20Coffee%2048%20fl%20oz',
    priceCents: 399,
    unitAmount: 48,
    unitType: 'fl_oz',
    unitCount: 1,
    sourceUrl: 'https://www.aldi.us/product/barissimo-organic-cold-brew-medium-roast-coffee-48-fl-oz-0000000000063526',
    notes: null,
  },
  {
    categorySlug: 'cold-brew-coffee',
    storeId: 'aldi',
    name: 'SToK Cold Brew Coffee Unsweetened',
    brand: 'SToK',
    imageUrl: 'https://dm.cms.aldi.cx/is/image/prod1amer/product/jpg/scaleWidth/500/005a7e27-0fa7-4661-9477-b599a0bcfbfa/Cold%20Brew%20Black%20Coffee%20Unsweetened%2048%20fl%20oz',
    priceCents: 659,
    unitAmount: 48,
    unitType: 'fl_oz',
    unitCount: 1,
    sourceUrl: 'https://www.aldi.us/product/stok-cold-brew-black-coffee-unsweetened-48-fl-oz-0000000000003087',
    notes: null,
  },

  // Baby Wipes
  {
    categorySlug: 'baby-wipes',
    storeId: 'costco',
    name: 'Kirkland Signature Baby Wipes Fragrance Free',
    brand: 'Kirkland Signature',
    imageUrl: 'https://brandsforlessusa.com/cdn/shop/files/KirklandSignatureBabyWipesFragranceFree_900-count1_5d593bfb-a6e5-4cf8-ad4d-c3eabd29fe8a.jpg?v=1770285957',
    priceCents: 2499,
    unitAmount: 900,
    unitType: 'count',
    unitCount: 1,
    sourceUrl: 'https://www.costco.com/p/-/kirkland-signature-baby-wipes-fragrance-free-900-count/100801219',
    notes: null,
  },
  {
    categorySlug: 'baby-wipes',
    storeId: 'aldi',
    name: 'Little Journey Sensitive Baby Wipes',
    brand: 'Little Journey',
    imageUrl: 'https://d2lnr5mha7bycj.cloudfront.net/product-image/file/large_eec38e54-d844-485c-9aff-eb23f23a631d.jpg',
    priceCents: 549,
    unitAmount: 192,
    unitType: 'count',
    unitCount: 1,
    sourceUrl: 'https://shop.aldi.us/store/aldi/products/19876332-little-journey-sensitive-baby-wipes-192-ct',
    notes: null,
  },

  // Olive Oil
  {
    categorySlug: 'olive-oil',
    storeId: 'costco',
    name: 'Kirkland Signature Organic Extra Virgin Olive Oil',
    brand: 'Kirkland Signature',
    imageUrl: null,
    priceCents: 1799,
    unitAmount: 67.6,
    unitType: 'fl_oz',
    unitCount: 1,
    sourceUrl: 'https://www.costco.com/p/-/kirkland-signature-organic-extra-virgin-olive-oil-2-l/100334841',
    notes: '2 L bottle',
  },
  {
    categorySlug: 'olive-oil',
    storeId: 'aldi',
    name: 'Simply Nature Organic Extra Virgin Olive Oil',
    brand: 'Simply Nature',
    imageUrl: 'https://dm.cms.aldi.cx/is/image/prod1amer/product/jpg/scaleWidth/500/2e520fdf-48e1-4d54-97e2-b9ada53af6fb/Organic%20Extra%20Virgin%20Olive%20Oil%2016.9%20fl%20oz',
    priceCents: 799,
    unitAmount: 16.9,
    unitType: 'fl_oz',
    unitCount: 1,
    sourceUrl: 'https://www.aldi.us/product/simply-nature-organic-extra-virgin-olive-oil-16-9-fl-oz-0000000000002151',
    notes: null,
  },

  // Eggs
  {
    categorySlug: 'eggs',
    storeId: 'costco',
    name: 'Kirkland Signature Cage Free Large Eggs',
    brand: 'Kirkland Signature',
    imageUrl: 'https://picgrocery.com/wp-content/uploads/2023/04/Kirkland-Signature-Extra-Large-White-Eggs-Cage-Free-2-dozen.webp',
    priceCents: 999,
    unitAmount: 24,
    unitType: 'count',
    unitCount: 1,
    sourceUrl: 'https://sameday.costco.com/store/costco/products/3308878-kirkland-signature-cage-free-eggs-24-ct-24-ct',
    notes: null,
  },
  {
    categorySlug: 'eggs',
    storeId: 'aldi',
    name: 'Goldhen Grade A Large White Eggs',
    brand: 'Goldhen',
    imageUrl: 'https://dm.cms.aldi.cx/is/image/prod1amer/product/jpg/scaleWidth/500/0da9bf82-a41d-40b1-8935-63b64f0602b3/Grade%20%20A%20Large%20White%20Eggs%201%20dozen',
    priceCents: 185,
    unitAmount: 12,
    unitType: 'count',
    unitCount: 1,
    sourceUrl: 'https://www.aldi.us/product/goldhen-grade-a-large-white-eggs-1-dozen-0000000000001719',
    notes: null,
  },

  // Butter
  {
    categorySlug: 'butter',
    storeId: 'costco',
    name: 'Kirkland Signature Salted Butter',
    brand: 'Kirkland Signature',
    imageUrl: 'https://cdn.shoplightspeed.com/shops/621581/files/32208428/650x650x2/kirkland-salted-cream-butter-1-lb-4-ct.jpg',
    priceCents: 1299,
    unitAmount: 4,
    unitType: 'lbs',
    unitCount: 1,
    sourceUrl: 'https://sameday.costco.com/store/costco/products/32528-kirkland-signature-salted-butter-quarters-4-x-1-lb-4-oz',
    notes: '4 × 1 lb quarters',
  },
  {
    categorySlug: 'butter',
    storeId: 'aldi',
    name: 'Countryside Creamery Salted Butter Sticks',
    brand: 'Countryside Creamery',
    imageUrl: 'https://dm.cms.aldi.cx/is/image/prod1amer/product/jpg/scaleWidth/500/64a0dda2-edb4-4d7f-9974-8b3b9baf64b9/Salted%20Butter%20Sticks%201%20lb',
    priceCents: 349,
    unitAmount: 1,
    unitType: 'lbs',
    unitCount: 1,
    sourceUrl: 'https://www.aldi.us/product/countryside-creamery-salted-butter-sticks-1-lb-0000000000001523',
    notes: null,
  },

  // Dish Soap
  {
    categorySlug: 'dish-soap',
    storeId: 'costco',
    name: 'Dawn Platinum Advanced Power Dish Soap',
    brand: 'Dawn',
    imageUrl: 'https://images.ctfassets.net/cj8g3qewem31/6JKE46q9xMifYlfh7ndTJE/8afbada1fd37bf46520c7a85e5e16700/00030772121832_C1N1.png',
    priceCents: 1099,
    unitAmount: 90,
    unitType: 'fl_oz',
    unitCount: 1,
    sourceUrl: 'https://www.costco.com/p/-/dawn-platinum-advanced-power-liquid-dish-soap-90-fl-oz/100371695',
    notes: null,
  },
  {
    categorySlug: 'dish-soap',
    storeId: 'aldi',
    name: 'Power Force Original Dishwashing Liquid',
    brand: 'Power Force',
    imageUrl: 'https://dm.cms.aldi.cx/is/image/prod1amer/product/jpg/scaleWidth/500/f8e19952-e19b-463e-a42c-cc39f6ebc264/Original%20Dishwashing%20Liquid%20Detergent%2024%20fl%20oz',
    priceCents: 235,
    unitAmount: 24,
    unitType: 'fl_oz',
    unitCount: 1,
    sourceUrl: 'https://www.aldi.us/product/power-force-original-dishwashing-liquid-detergent-24-fl-oz-0000000000070622',
    notes: null,
  },
]

console.log('Seeding store variants...')
for (const v of variantData) {
  const categoryId = catMap[v.categorySlug]
  if (!categoryId) {
    console.warn(`No category found for slug: ${v.categorySlug}`)
    continue
  }
  const { categorySlug: _slug, ...rest } = v
  await db.insert(storeVariants).values({
    ...rest,
    categoryId,
    unitAmount: String(rest.unitAmount),
    brand: rest.brand ?? null,
    sourceUrl: rest.sourceUrl ?? null,
    notes: rest.notes ?? null,
  })
}

console.log('✅ Seed complete.')
await pool.end()
