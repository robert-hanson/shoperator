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
const insertedCategories = await db
  .insert(categories)
  .values(categoryData.map((c) => ({ ...c, preferredUnit: c.preferredUnit })))
  .onConflictDoNothing()
  .returning()

const catMap = Object.fromEntries(insertedCategories.map((c) => [c.slug, c.id]))

// ─── Store Variants ─────────────────────────────────────────────────────────
const variantData = [
  // Cold Brew Coffee
  {
    categorySlug: 'cold-brew-coffee',
    storeId: 'costco',
    name: 'Kirkland Signature Cold Brew Coffee Concentrate',
    brand: 'Kirkland Signature',
    priceCents: 1799,
    unitAmount: 32,
    unitType: 'fl_oz',
    unitCount: 2,
    sourceUrl: 'https://www.costco.com',
    notes: 'Concentrate — dilute 1:1 with water',
  },
  {
    categorySlug: 'cold-brew-coffee',
    storeId: 'aldi',
    name: 'Barissimo Cold Brew Coffee',
    brand: 'Barissimo',
    priceCents: 399,
    unitAmount: 48,
    unitType: 'fl_oz',
    unitCount: 1,
    sourceUrl: 'https://www.aldi.us',
    notes: null,
  },

  // Baby Wipes
  {
    categorySlug: 'baby-wipes',
    storeId: 'costco',
    name: 'Kirkland Signature Baby Wipes',
    brand: 'Kirkland Signature',
    priceCents: 2499,
    unitAmount: 900,
    unitType: 'count',
    unitCount: 1,
    sourceUrl: 'https://www.costco.com',
    notes: null,
  },
  {
    categorySlug: 'baby-wipes',
    storeId: 'aldi',
    name: 'Mamia Baby Wipes Sensitive',
    brand: 'Mamia',
    priceCents: 299,
    unitAmount: 80,
    unitType: 'count',
    unitCount: 1,
    sourceUrl: 'https://www.aldi.us',
    notes: null,
  },

  // Olive Oil
  {
    categorySlug: 'olive-oil',
    storeId: 'costco',
    name: 'Kirkland Signature Organic Extra Virgin Olive Oil',
    brand: 'Kirkland Signature',
    priceCents: 1799,
    unitAmount: 101.4,
    unitType: 'fl_oz',
    unitCount: 1,
    sourceUrl: 'https://www.costco.com',
    notes: null,
  },
  {
    categorySlug: 'olive-oil',
    storeId: 'aldi',
    name: 'Simply Nature Organic Extra Virgin Olive Oil',
    brand: 'Simply Nature',
    priceCents: 599,
    unitAmount: 16.9,
    unitType: 'fl_oz',
    unitCount: 1,
    sourceUrl: 'https://www.aldi.us',
    notes: null,
  },

  // Eggs
  {
    categorySlug: 'eggs',
    storeId: 'costco',
    name: 'Kirkland Signature Large Grade AA Eggs',
    brand: 'Kirkland Signature',
    priceCents: 999,
    unitAmount: 24,
    unitType: 'count',
    unitCount: 1,
    sourceUrl: 'https://www.costco.com',
    notes: null,
  },
  {
    categorySlug: 'eggs',
    storeId: 'aldi',
    name: 'Goldhen Large Grade A Eggs',
    brand: 'Goldhen',
    priceCents: 299,
    unitAmount: 12,
    unitType: 'count',
    unitCount: 1,
    sourceUrl: 'https://www.aldi.us',
    notes: null,
  },

  // Butter
  {
    categorySlug: 'butter',
    storeId: 'costco',
    name: 'Kirkland Signature Salted Butter',
    brand: 'Kirkland Signature',
    priceCents: 1299,
    unitAmount: 4,
    unitType: 'lbs',
    unitCount: 1,
    sourceUrl: 'https://www.costco.com',
    notes: null,
  },
  {
    categorySlug: 'butter',
    storeId: 'aldi',
    name: 'Countryside Creamery Salted Butter',
    brand: 'Countryside Creamery',
    priceCents: 349,
    unitAmount: 1,
    unitType: 'lbs',
    unitCount: 1,
    sourceUrl: 'https://www.aldi.us',
    notes: null,
  },

  // Dish Soap
  {
    categorySlug: 'dish-soap',
    storeId: 'costco',
    name: 'Dawn Ultra Dishwashing Liquid',
    brand: 'Dawn',
    priceCents: 1099,
    unitAmount: 90,
    unitType: 'fl_oz',
    unitCount: 1,
    sourceUrl: 'https://www.costco.com',
    notes: null,
  },
  {
    categorySlug: 'dish-soap',
    storeId: 'aldi',
    name: 'Tandil Dish Soap',
    brand: 'Tandil',
    priceCents: 149,
    unitAmount: 24,
    unitType: 'fl_oz',
    unitCount: 1,
    sourceUrl: 'https://www.aldi.us',
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
