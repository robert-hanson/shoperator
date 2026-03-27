import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import { and, eq, notInArray } from 'drizzle-orm'
import pg from 'pg'
import { env } from '../config/env.js'
import { categories, storeVariants } from './schema.js'

const pool = new pg.Pool({ connectionString: env.DATABASE_URL })
const db = drizzle(pool)

// ─── Categories ────────────────────────────────────────────────────────────────
const categoryData = [
  { name: 'Cold Brew Coffee',    slug: 'cold-brew-coffee',    iconEmoji: '☕', preferredUnit: 'fl_oz'  },
  { name: 'Baby Wipes',          slug: 'baby-wipes',          iconEmoji: '🧻', preferredUnit: 'count'  },
  { name: 'Paper Towels',        slug: 'paper-towels',        iconEmoji: '🪣', preferredUnit: 'sheets' },
  { name: 'Olive Oil',           slug: 'olive-oil',           iconEmoji: '🫙', preferredUnit: 'fl_oz'  },
  { name: 'Eggs',                slug: 'eggs',                iconEmoji: '🥚', preferredUnit: 'count'  },
  { name: 'Butter',              slug: 'butter',              iconEmoji: '🧈', preferredUnit: 'oz'     },
  { name: 'Mixed Nuts',          slug: 'mixed-nuts',          iconEmoji: '🥜', preferredUnit: 'oz'     },
  { name: 'Laundry Detergent',   slug: 'laundry-detergent',   iconEmoji: '🫧', preferredUnit: 'fl_oz'  },
  { name: 'Dish Soap',           slug: 'dish-soap',           iconEmoji: '🧼', preferredUnit: 'fl_oz'  },
  { name: 'Trash Bags',          slug: 'trash-bags',          iconEmoji: '🗑️', preferredUnit: 'count'  },
  { name: 'Greek Yogurt',        slug: 'greek-yogurt',        iconEmoji: '🥛', preferredUnit: 'oz'     },
  { name: 'Pasta',               slug: 'pasta',               iconEmoji: '🍝', preferredUnit: 'lbs'    },
  { name: 'Shredded Cheese',     slug: 'shredded-cheese',     iconEmoji: '🧀', preferredUnit: 'oz'     },
  { name: 'Milk',                slug: 'milk',                iconEmoji: '🥛', preferredUnit: 'fl_oz'  },
  { name: 'Orange Juice',        slug: 'orange-juice',        iconEmoji: '🍊', preferredUnit: 'fl_oz'  },
  { name: 'Sparkling Water',     slug: 'sparkling-water',     iconEmoji: '💧', preferredUnit: 'fl_oz'  },
  { name: 'Coffee Pods',         slug: 'coffee-pods',         iconEmoji: '🫘', preferredUnit: 'count'  },
  { name: 'Peanut Butter',       slug: 'peanut-butter',       iconEmoji: '🥜', preferredUnit: 'oz'     },
  { name: 'Rice',                slug: 'rice',                iconEmoji: '🍚', preferredUnit: 'lbs'    },
  { name: 'Oats',                slug: 'oats',                iconEmoji: '🌾', preferredUnit: 'oz'     },
  { name: 'Toilet Paper',        slug: 'toilet-paper',        iconEmoji: '🧻', preferredUnit: 'sheets' },
  { name: 'Bread',               slug: 'bread',               iconEmoji: '🍞', preferredUnit: 'oz'     },
  { name: 'Cereal',              slug: 'cereal',              iconEmoji: '🥣', preferredUnit: 'oz'     },
  { name: 'Avocado Oil',         slug: 'avocado-oil',         iconEmoji: '🥑', preferredUnit: 'fl_oz'  },
  { name: 'Honey',               slug: 'honey',               iconEmoji: '🍯', preferredUnit: 'oz'     },
  { name: 'Almond Milk',         slug: 'almond-milk',         iconEmoji: '🥛', preferredUnit: 'fl_oz'  },
  { name: 'Frozen Pizza',        slug: 'frozen-pizza',        iconEmoji: '🍕', preferredUnit: 'oz'     },
  { name: 'Protein Bars',        slug: 'protein-bars',        iconEmoji: '💪', preferredUnit: 'oz'     },
  { name: 'Coffee (Ground)',     slug: 'ground-coffee',       iconEmoji: '☕', preferredUnit: 'oz'     },
  { name: 'Vitamins C',          slug: 'vitamins-c',          iconEmoji: '💊', preferredUnit: 'count'  },
] as const

console.log('Seeding categories...')
await db
  .insert(categories)
  .values(categoryData.map((c) => ({ ...c, preferredUnit: c.preferredUnit })))
  .onConflictDoNothing()

// Query all categories to build slug → id map
const allCategories = await db.select().from(categories)
const catMap = Object.fromEntries(allCategories.map((c) => [c.slug, c.id]))

// ─── Store Variants ──────────────────────────────────────────────────────────
// Uses onConflictDoNothing on (categoryId, storeId, name) — safe to re-run.
// Costco products have sourceUrl: null because costco.com requires JS rendering
// and sameday.costco.com requires auth — prices are admin-managed for Costco.
// Aldi products use aldi.us sourceUrls so the weekly price refresh can update them.

type VariantSeed = {
  categorySlug: string
  storeId: string
  name: string
  brand: string | null
  imageUrl: string | null
  priceCents: number
  unitAmount: number
  unitType: string
  unitCount: number
  sourceUrl: string | null
  notes: string | null
}

const variantData: VariantSeed[] = [
  // ── Cold Brew Coffee ─────────────────────────────────────────────────────
  {
    categorySlug: 'cold-brew-coffee', storeId: 'costco',
    name: 'Kirkland Signature Cold Brew Coffee',
    brand: 'Kirkland Signature',
    imageUrl: 'https://costcofan.com/wp-content/uploads/2020/08/Costco-Cold-Brew-Kirkland-Signature-Main.jpg',
    priceCents: 1799, unitAmount: 11, unitType: 'fl_oz', unitCount: 12,
    sourceUrl: null, notes: 'Ready-to-drink cans. Price needs manual verification.',
  },
  {
    categorySlug: 'cold-brew-coffee', storeId: 'aldi',
    name: 'Barissimo Organic Cold Brew Coffee',
    brand: 'Barissimo',
    imageUrl: 'https://dm.cms.aldi.cx/is/image/prod1amer/product/jpg/scaleWidth/500/6f684b0a-439e-4d4c-a379-342e28856d06/Organic%20Cold%20Brew%20Medium%20Roast%20Coffee%2048%20fl%20oz',
    priceCents: 399, unitAmount: 48, unitType: 'fl_oz', unitCount: 1,
    sourceUrl: 'https://www.aldi.us/product/barissimo-organic-cold-brew-medium-roast-coffee-48-fl-oz-0000000000063526',
    notes: null,
  },
  {
    categorySlug: 'cold-brew-coffee', storeId: 'aldi',
    name: 'SToK Cold Brew Coffee Unsweetened',
    brand: 'SToK',
    imageUrl: 'https://dm.cms.aldi.cx/is/image/prod1amer/product/jpg/scaleWidth/500/005a7e27-0fa7-4661-9477-b599a0bcfbfa/Cold%20Brew%20Black%20Coffee%20Unsweetened%2048%20fl%20oz',
    priceCents: 659, unitAmount: 48, unitType: 'fl_oz', unitCount: 1,
    sourceUrl: 'https://www.aldi.us/product/stok-cold-brew-black-coffee-unsweetened-48-fl-oz-0000000000003087',
    notes: null,
  },

  // ── Baby Wipes ────────────────────────────────────────────────────────────
  {
    categorySlug: 'baby-wipes', storeId: 'costco',
    name: 'Kirkland Signature Baby Wipes Fragrance Free',
    brand: 'Kirkland Signature',
    imageUrl: 'https://brandsforlessusa.com/cdn/shop/files/KirklandSignatureBabyWipesFragranceFree_900-count1_5d593bfb-a6e5-4cf8-ad4d-c3eabd29fe8a.jpg?v=1770285957',
    priceCents: 2499, unitAmount: 900, unitType: 'count', unitCount: 1,
    sourceUrl: null, notes: 'Price needs manual verification.',
  },
  {
    categorySlug: 'baby-wipes', storeId: 'aldi',
    name: 'Little Journey Sensitive Baby Wipes',
    brand: 'Little Journey',
    imageUrl: 'https://d2lnr5mha7bycj.cloudfront.net/product-image/file/large_eec38e54-d844-485c-9aff-eb23f23a631d.jpg',
    priceCents: 549, unitAmount: 192, unitType: 'count', unitCount: 1,
    sourceUrl: 'https://shop.aldi.us/store/aldi/products/19876332-little-journey-sensitive-baby-wipes-192-ct',
    notes: null,
  },

  // ── Paper Towels ──────────────────────────────────────────────────────────
  {
    categorySlug: 'paper-towels', storeId: 'costco',
    name: 'Kirkland Signature Paper Towels',
    brand: 'Kirkland Signature',
    imageUrl: null,
    priceCents: 2799, unitAmount: 160, unitType: 'sheets', unitCount: 12,
    sourceUrl: null, notes: '12 rolls, 160 sheets per roll. Price needs manual verification.',
  },
  {
    categorySlug: 'paper-towels', storeId: 'aldi',
    name: 'Plenty Ultra Strong Paper Towels',
    brand: 'Plenty',
    imageUrl: null,
    priceCents: 899, unitAmount: 110, unitType: 'sheets', unitCount: 6,
    sourceUrl: 'https://www.aldi.us/product/plenty-ultra-strong-paper-towels-6-count-0000000000079753',
    notes: '6 rolls, 110 sheets per roll.',
  },

  // ── Olive Oil ─────────────────────────────────────────────────────────────
  {
    categorySlug: 'olive-oil', storeId: 'costco',
    name: 'Kirkland Signature Organic Extra Virgin Olive Oil',
    brand: 'Kirkland Signature',
    imageUrl: null,
    priceCents: 1799, unitAmount: 67.6, unitType: 'fl_oz', unitCount: 1,
    sourceUrl: null, notes: '2 L bottle. Price needs manual verification.',
  },
  {
    categorySlug: 'olive-oil', storeId: 'aldi',
    name: 'Simply Nature Organic Extra Virgin Olive Oil',
    brand: 'Simply Nature',
    imageUrl: 'https://dm.cms.aldi.cx/is/image/prod1amer/product/jpg/scaleWidth/500/2e520fdf-48e1-4d54-97e2-b9ada53af6fb/Organic%20Extra%20Virgin%20Olive%20Oil%2016.9%20fl%20oz',
    priceCents: 799, unitAmount: 16.9, unitType: 'fl_oz', unitCount: 1,
    sourceUrl: 'https://www.aldi.us/product/simply-nature-organic-extra-virgin-olive-oil-16-9-fl-oz-0000000000002151',
    notes: null,
  },

  // ── Eggs ──────────────────────────────────────────────────────────────────
  {
    categorySlug: 'eggs', storeId: 'costco',
    name: 'Kirkland Signature Cage Free Large Eggs',
    brand: 'Kirkland Signature',
    imageUrl: 'https://picgrocery.com/wp-content/uploads/2023/04/Kirkland-Signature-Extra-Large-White-Eggs-Cage-Free-2-dozen.webp',
    priceCents: 999, unitAmount: 24, unitType: 'count', unitCount: 1,
    sourceUrl: null, notes: 'Price needs manual verification — eggs fluctuate frequently.',
  },
  {
    categorySlug: 'eggs', storeId: 'aldi',
    name: 'Goldhen Grade A Large White Eggs',
    brand: 'Goldhen',
    imageUrl: 'https://dm.cms.aldi.cx/is/image/prod1amer/product/jpg/scaleWidth/500/0da9bf82-a41d-40b1-8935-63b64f0602b3/Grade%20%20A%20Large%20White%20Eggs%201%20dozen',
    priceCents: 185, unitAmount: 12, unitType: 'count', unitCount: 1,
    sourceUrl: 'https://www.aldi.us/product/goldhen-grade-a-large-white-eggs-1-dozen-0000000000001719',
    notes: 'Price fluctuates frequently — check regularly.',
  },

  // ── Butter ────────────────────────────────────────────────────────────────
  {
    categorySlug: 'butter', storeId: 'costco',
    name: 'Kirkland Signature Salted Butter',
    brand: 'Kirkland Signature',
    imageUrl: 'https://cdn.shoplightspeed.com/shops/621581/files/32208428/650x650x2/kirkland-salted-cream-butter-1-lb-4-ct.jpg',
    priceCents: 1299, unitAmount: 64, unitType: 'oz', unitCount: 1,
    sourceUrl: null, notes: '4 × 1 lb quarters = 64 oz. Price needs manual verification.',
  },
  {
    categorySlug: 'butter', storeId: 'aldi',
    name: 'Countryside Creamery Salted Butter Sticks',
    brand: 'Countryside Creamery',
    imageUrl: 'https://dm.cms.aldi.cx/is/image/prod1amer/product/jpg/scaleWidth/500/64a0dda2-edb4-4d7f-9974-8b3b9baf64b9/Salted%20Butter%20Sticks%201%20lb',
    priceCents: 349, unitAmount: 16, unitType: 'oz', unitCount: 1,
    sourceUrl: 'https://www.aldi.us/product/countryside-creamery-salted-butter-sticks-1-lb-0000000000001523',
    notes: '1 lb = 16 oz.',
  },

  // ── Mixed Nuts ────────────────────────────────────────────────────────────
  {
    categorySlug: 'mixed-nuts', storeId: 'costco',
    name: 'Kirkland Signature Mixed Nuts',
    brand: 'Kirkland Signature',
    imageUrl: null,
    priceCents: 1799, unitAmount: 40, unitType: 'oz', unitCount: 1,
    sourceUrl: null, notes: 'Price needs manual verification.',
  },
  {
    categorySlug: 'mixed-nuts', storeId: 'aldi',
    name: 'Southern Grove Deluxe Mixed Nuts',
    brand: 'Southern Grove',
    imageUrl: null,
    priceCents: 599, unitAmount: 14, unitType: 'oz', unitCount: 1,
    sourceUrl: 'https://www.aldi.us/product/southern-grove-deluxe-mixed-nuts-14-oz-0000000000008010',
    notes: null,
  },

  // ── Laundry Detergent ─────────────────────────────────────────────────────
  {
    categorySlug: 'laundry-detergent', storeId: 'costco',
    name: 'Kirkland Signature Ultra Clean Liquid Laundry Detergent',
    brand: 'Kirkland Signature',
    imageUrl: null,
    priceCents: 2199, unitAmount: 194, unitType: 'fl_oz', unitCount: 1,
    sourceUrl: null, notes: 'Price needs manual verification.',
  },
  {
    categorySlug: 'laundry-detergent', storeId: 'aldi',
    name: 'Tandil Ultra Plus Laundry Detergent',
    brand: 'Tandil',
    imageUrl: null,
    priceCents: 899, unitAmount: 100, unitType: 'fl_oz', unitCount: 1,
    sourceUrl: 'https://www.aldi.us/product/tandil-ultra-plus-liquid-laundry-detergent-100-fl-oz-0000000000071636',
    notes: null,
  },

  // ── Dish Soap ─────────────────────────────────────────────────────────────
  {
    categorySlug: 'dish-soap', storeId: 'costco',
    name: 'Dawn Platinum Advanced Power Dish Soap',
    brand: 'Dawn',
    imageUrl: 'https://images.ctfassets.net/cj8g3qewem31/6JKE46q9xMifYlfh7ndTJE/8afbada1fd37bf46520c7a85e5e16700/00030772121832_C1N1.png',
    priceCents: 1099, unitAmount: 90, unitType: 'fl_oz', unitCount: 1,
    sourceUrl: null, notes: 'Price needs manual verification.',
  },
  {
    categorySlug: 'dish-soap', storeId: 'aldi',
    name: 'Power Force Original Dishwashing Liquid',
    brand: 'Power Force',
    imageUrl: 'https://dm.cms.aldi.cx/is/image/prod1amer/product/jpg/scaleWidth/500/f8e19952-e19b-463e-a42c-cc39f6ebc264/Original%20Dishwashing%20Liquid%20Detergent%2024%20fl%20oz',
    priceCents: 235, unitAmount: 24, unitType: 'fl_oz', unitCount: 1,
    sourceUrl: 'https://www.aldi.us/product/power-force-original-dishwashing-liquid-detergent-24-fl-oz-0000000000070622',
    notes: null,
  },

  // ── Trash Bags ────────────────────────────────────────────────────────────
  {
    categorySlug: 'trash-bags', storeId: 'costco',
    name: 'Kirkland Signature Flex-Tech Kitchen Trash Bags',
    brand: 'Kirkland Signature',
    imageUrl: null,
    priceCents: 2499, unitAmount: 200, unitType: 'count', unitCount: 1,
    sourceUrl: null, notes: '13-gallon, 200 count. Price needs manual verification.',
  },
  {
    categorySlug: 'trash-bags', storeId: 'aldi',
    name: 'Briarwood Tall Kitchen Trash Bags',
    brand: 'Briarwood',
    imageUrl: null,
    priceCents: 449, unitAmount: 40, unitType: 'count', unitCount: 1,
    sourceUrl: 'https://www.aldi.us/product/briarwood-tall-kitchen-drawstring-trash-bags-40-count-0000000000065030',
    notes: '13-gallon, 40 count.',
  },

  // ── Greek Yogurt ─────────────────────────────────────────────────────────
  {
    categorySlug: 'greek-yogurt', storeId: 'costco',
    name: 'Kirkland Signature Plain Non-Fat Greek Yogurt',
    brand: 'Kirkland Signature',
    imageUrl: null,
    priceCents: 799, unitAmount: 48, unitType: 'oz', unitCount: 1,
    sourceUrl: null, notes: 'Price needs manual verification.',
  },
  {
    categorySlug: 'greek-yogurt', storeId: 'aldi',
    name: 'Friendly Farms Plain Nonfat Greek Yogurt',
    brand: 'Friendly Farms',
    imageUrl: null,
    priceCents: 399, unitAmount: 32, unitType: 'oz', unitCount: 1,
    sourceUrl: 'https://www.aldi.us/product/friendly-farms-plain-nonfat-greek-yogurt-32-oz-0000000000074992',
    notes: null,
  },

  // ── Pasta ─────────────────────────────────────────────────────────────────
  {
    categorySlug: 'pasta', storeId: 'costco',
    name: 'Kirkland Signature Penne Rigate Pasta',
    brand: 'Kirkland Signature',
    imageUrl: null,
    priceCents: 899, unitAmount: 6, unitType: 'lbs', unitCount: 1,
    sourceUrl: null, notes: '6 lbs total. Price needs manual verification.',
  },
  {
    categorySlug: 'pasta', storeId: 'aldi',
    name: 'Priano Penne Rigate',
    brand: 'Priano',
    imageUrl: null,
    priceCents: 149, unitAmount: 1, unitType: 'lbs', unitCount: 1,
    sourceUrl: 'https://www.aldi.us/product/priano-penne-rigate-pasta-1-lb-0000000000014995',
    notes: '1 lb box.',
  },

  // ── Shredded Cheese ───────────────────────────────────────────────────────
  {
    categorySlug: 'shredded-cheese', storeId: 'costco',
    name: 'Kirkland Signature Shredded Mexican Blend Cheese',
    brand: 'Kirkland Signature',
    imageUrl: null,
    priceCents: 1699, unitAmount: 80, unitType: 'oz', unitCount: 1,
    sourceUrl: null, notes: '5 lbs = 80 oz. Price needs manual verification.',
  },
  {
    categorySlug: 'shredded-cheese', storeId: 'aldi',
    name: 'Happy Farms Finely Shredded Mexican Blend Cheese',
    brand: 'Happy Farms',
    imageUrl: null,
    priceCents: 399, unitAmount: 16, unitType: 'oz', unitCount: 1,
    sourceUrl: 'https://www.aldi.us/product/happy-farms-finely-shredded-mexican-blend-cheese-16-oz-0000000000044389',
    notes: null,
  },

  // ── Milk ─────────────────────────────────────────────────────────────────
  {
    categorySlug: 'milk', storeId: 'costco',
    name: 'Organic Valley Whole Milk',
    brand: 'Organic Valley',
    imageUrl: null,
    priceCents: 999, unitAmount: 64, unitType: 'fl_oz', unitCount: 2,
    sourceUrl: null, notes: '2 × half gallon. Price needs manual verification.',
  },
  {
    categorySlug: 'milk', storeId: 'aldi',
    name: 'Friendly Farms Whole Milk',
    brand: 'Friendly Farms',
    imageUrl: null,
    priceCents: 399, unitAmount: 128, unitType: 'fl_oz', unitCount: 1,
    sourceUrl: 'https://www.aldi.us/product/friendly-farms-whole-milk-1-gallon-0000000000010742',
    notes: '1 gallon = 128 fl oz.',
  },

  // ── Orange Juice ──────────────────────────────────────────────────────────
  {
    categorySlug: 'orange-juice', storeId: 'costco',
    name: 'Tropicana Pure Premium Orange Juice',
    brand: 'Tropicana',
    imageUrl: null,
    priceCents: 1199, unitAmount: 89, unitType: 'fl_oz', unitCount: 2,
    sourceUrl: null, notes: '2 × 89 fl oz. Price needs manual verification.',
  },
  {
    categorySlug: 'orange-juice', storeId: 'aldi',
    name: "Nature's Nectar 100% Orange Juice",
    brand: "Nature's Nectar",
    imageUrl: null,
    priceCents: 399, unitAmount: 52, unitType: 'fl_oz', unitCount: 1,
    sourceUrl: 'https://www.aldi.us/product/natures-nectar-100-percent-orange-juice-52-fl-oz-0000000000020940',
    notes: null,
  },

  // ── Sparkling Water ───────────────────────────────────────────────────────
  {
    categorySlug: 'sparkling-water', storeId: 'costco',
    name: 'LaCroix Sparkling Water Variety Pack',
    brand: 'LaCroix',
    imageUrl: null,
    priceCents: 1599, unitAmount: 12, unitType: 'fl_oz', unitCount: 30,
    sourceUrl: null, notes: '30-pack × 12 fl oz cans. Price needs manual verification.',
  },
  {
    categorySlug: 'sparkling-water', storeId: 'aldi',
    name: 'Just Sparkling Water Variety Pack',
    brand: 'Just Sparkling',
    imageUrl: null,
    priceCents: 399, unitAmount: 12, unitType: 'fl_oz', unitCount: 12,
    sourceUrl: 'https://www.aldi.us/product/just-sparkling-water-variety-pack-12-count-0000000000053088',
    notes: '12-pack × 12 fl oz cans.',
  },

  // ── Coffee Pods ───────────────────────────────────────────────────────────
  {
    categorySlug: 'coffee-pods', storeId: 'costco',
    name: 'Kirkland Signature House Blend Coffee Pods',
    brand: 'Kirkland Signature',
    imageUrl: null,
    priceCents: 2799, unitAmount: 120, unitType: 'count', unitCount: 1,
    sourceUrl: null, notes: '120 K-Cup pods. Price needs manual verification.',
  },
  {
    categorySlug: 'coffee-pods', storeId: 'aldi',
    name: 'Barissimo Classic Roast Coffee Pods',
    brand: 'Barissimo',
    imageUrl: null,
    priceCents: 499, unitAmount: 18, unitType: 'count', unitCount: 1,
    sourceUrl: 'https://www.aldi.us/product/barissimo-classic-roast-medium-coffee-pods-18-count-0000000000062019',
    notes: '18 K-Cup pods.',
  },

  // ── Peanut Butter ─────────────────────────────────────────────────────────
  {
    categorySlug: 'peanut-butter', storeId: 'costco',
    name: 'Kirkland Signature Creamy Peanut Butter',
    brand: 'Kirkland Signature',
    imageUrl: null,
    priceCents: 1299, unitAmount: 96, unitType: 'oz', unitCount: 1,
    sourceUrl: null, notes: '6 lbs = 96 oz. Price needs manual verification.',
  },
  {
    categorySlug: 'peanut-butter', storeId: 'aldi',
    name: 'Peanut Delight Creamy Peanut Butter',
    brand: 'Peanut Delight',
    imageUrl: null,
    priceCents: 449, unitAmount: 40, unitType: 'oz', unitCount: 1,
    sourceUrl: 'https://www.aldi.us/product/peanut-delight-creamy-peanut-butter-40-oz-0000000000040027',
    notes: null,
  },

  // ── Rice ──────────────────────────────────────────────────────────────────
  {
    categorySlug: 'rice', storeId: 'costco',
    name: 'Kirkland Signature Jasmine Rice',
    brand: 'Kirkland Signature',
    imageUrl: null,
    priceCents: 1799, unitAmount: 25, unitType: 'lbs', unitCount: 1,
    sourceUrl: null, notes: '25 lb bag. Price needs manual verification.',
  },
  {
    categorySlug: 'rice', storeId: 'aldi',
    name: 'Chef\'s Cupboard Long Grain White Rice',
    brand: "Chef's Cupboard",
    imageUrl: null,
    priceCents: 299, unitAmount: 5, unitType: 'lbs', unitCount: 1,
    sourceUrl: 'https://www.aldi.us/product/chefs-cupboard-long-grain-white-rice-5-lb-0000000000025895',
    notes: '5 lb bag.',
  },

  // ── Oats ──────────────────────────────────────────────────────────────────
  {
    categorySlug: 'oats', storeId: 'costco',
    name: 'Kirkland Signature Steel Cut Oats',
    brand: 'Kirkland Signature',
    imageUrl: null,
    priceCents: 1099, unitAmount: 160, unitType: 'oz', unitCount: 1,
    sourceUrl: null, notes: '10 lbs = 160 oz. Price needs manual verification.',
  },
  {
    categorySlug: 'oats', storeId: 'aldi',
    name: 'Millville Old Fashioned Oats',
    brand: 'Millville',
    imageUrl: null,
    priceCents: 279, unitAmount: 42, unitType: 'oz', unitCount: 1,
    sourceUrl: 'https://www.aldi.us/product/millville-old-fashioned-oats-42-oz-0000000000073302',
    notes: null,
  },

  // ── Toilet Paper ─────────────────────────────────────────────────────────
  {
    categorySlug: 'toilet-paper', storeId: 'costco',
    name: 'Kirkland Signature Bath Tissue',
    brand: 'Kirkland Signature',
    imageUrl: null,
    priceCents: 2999, unitAmount: 380, unitType: 'sheets', unitCount: 30,
    sourceUrl: null, notes: '30 rolls × 380 sheets. Price needs manual verification.',
  },
  {
    categorySlug: 'toilet-paper', storeId: 'aldi',
    name: 'Petal Soft Bath Tissue',
    brand: 'Petal',
    imageUrl: null,
    priceCents: 599, unitAmount: 200, unitType: 'sheets', unitCount: 6,
    sourceUrl: 'https://www.aldi.us/product/petal-soft-2-ply-bath-tissue-6-rolls-0000000000054494',
    notes: '6 rolls × 200 sheets.',
  },

  // ── Bread ─────────────────────────────────────────────────────────────────
  {
    categorySlug: 'bread', storeId: 'costco',
    name: 'Sara Lee Artesano Bakery Bread',
    brand: 'Sara Lee',
    imageUrl: null,
    priceCents: 799, unitAmount: 20, unitType: 'oz', unitCount: 2,
    sourceUrl: null, notes: '2 × 20 oz loaves. Price needs manual verification.',
  },
  {
    categorySlug: 'bread', storeId: 'aldi',
    name: 'L\'oven Fresh White Sandwich Bread',
    brand: "L'oven Fresh",
    imageUrl: null,
    priceCents: 249, unitAmount: 20, unitType: 'oz', unitCount: 1,
    sourceUrl: 'https://www.aldi.us/product/loven-fresh-white-sandwich-bread-20-oz-0000000000028882',
    notes: null,
  },

  // ── Cereal ────────────────────────────────────────────────────────────────
  {
    categorySlug: 'cereal', storeId: 'costco',
    name: "Honey Bunches of Oats Honey Roasted Cereal",
    brand: 'Honey Bunches of Oats',
    imageUrl: null,
    priceCents: 999, unitAmount: 64, unitType: 'oz', unitCount: 1,
    sourceUrl: null, notes: '4 lb bag. Price needs manual verification.',
  },
  {
    categorySlug: 'cereal', storeId: 'aldi',
    name: 'Millville Honey and Oats Granola Cereal',
    brand: 'Millville',
    imageUrl: null,
    priceCents: 299, unitAmount: 16, unitType: 'oz', unitCount: 1,
    sourceUrl: 'https://www.aldi.us/product/millville-honey-and-oats-granola-cereal-16-oz-0000000000013478',
    notes: null,
  },

  // ── Avocado Oil ───────────────────────────────────────────────────────────
  {
    categorySlug: 'avocado-oil', storeId: 'costco',
    name: 'Chosen Foods Avocado Oil Spray',
    brand: 'Chosen Foods',
    imageUrl: null,
    priceCents: 1299, unitAmount: 13.5, unitType: 'fl_oz', unitCount: 2,
    sourceUrl: null, notes: '2 × 13.5 fl oz spray bottles. Price needs manual verification.',
  },
  {
    categorySlug: 'avocado-oil', storeId: 'aldi',
    name: 'Simply Nature Avocado Oil',
    brand: 'Simply Nature',
    imageUrl: null,
    priceCents: 599, unitAmount: 16.9, unitType: 'fl_oz', unitCount: 1,
    sourceUrl: 'https://www.aldi.us/product/simply-nature-avocado-oil-16-9-fl-oz-0000000000053082',
    notes: null,
  },

  // ── Honey ─────────────────────────────────────────────────────────────────
  {
    categorySlug: 'honey', storeId: 'costco',
    name: 'Kirkland Signature Raw Wildflower Honey',
    brand: 'Kirkland Signature',
    imageUrl: null,
    priceCents: 1499, unitAmount: 80, unitType: 'oz', unitCount: 1,
    sourceUrl: null, notes: '5 lbs = 80 oz. Price needs manual verification.',
  },
  {
    categorySlug: 'honey', storeId: 'aldi',
    name: 'Simply Nature Raw Unfiltered Honey',
    brand: 'Simply Nature',
    imageUrl: null,
    priceCents: 399, unitAmount: 16, unitType: 'oz', unitCount: 1,
    sourceUrl: 'https://www.aldi.us/product/simply-nature-raw-unfiltered-honey-16-oz-0000000000046895',
    notes: null,
  },

  // ── Almond Milk ───────────────────────────────────────────────────────────
  {
    categorySlug: 'almond-milk', storeId: 'costco',
    name: 'Silk Unsweetened Almond Milk',
    brand: 'Silk',
    imageUrl: null,
    priceCents: 1099, unitAmount: 96, unitType: 'fl_oz', unitCount: 1,
    sourceUrl: null, notes: '3 × 32 fl oz cartons. Price needs manual verification.',
  },
  {
    categorySlug: 'almond-milk', storeId: 'aldi',
    name: 'Friendly Farms Original Almond Milk',
    brand: 'Friendly Farms',
    imageUrl: null,
    priceCents: 249, unitAmount: 32, unitType: 'fl_oz', unitCount: 1,
    sourceUrl: 'https://www.aldi.us/product/friendly-farms-original-unsweetened-almondmilk-32-fl-oz-0000000000073320',
    notes: null,
  },

  // ── Frozen Pizza ─────────────────────────────────────────────────────────
  {
    categorySlug: 'frozen-pizza', storeId: 'costco',
    name: "Kirkland Signature Pepperoni Pizza",
    brand: 'Kirkland Signature',
    imageUrl: null,
    priceCents: 1599, unitAmount: 47, unitType: 'oz', unitCount: 2,
    sourceUrl: null, notes: '2 × 47 oz pizzas. Price needs manual verification.',
  },
  {
    categorySlug: 'frozen-pizza', storeId: 'aldi',
    name: 'Mama Cozzi\'s Pepperoni Rising Crust Pizza',
    brand: "Mama Cozzi's",
    imageUrl: null,
    priceCents: 599, unitAmount: 30, unitType: 'oz', unitCount: 1,
    sourceUrl: 'https://www.aldi.us/product/mama-cozzis-rising-crust-pepperoni-pizza-30-4-oz-0000000000069540',
    notes: null,
  },

  // ── Protein Bars ─────────────────────────────────────────────────────────
  {
    categorySlug: 'protein-bars', storeId: 'costco',
    name: 'Quest Protein Bars Variety Pack',
    brand: 'Quest',
    imageUrl: null,
    priceCents: 2999, unitAmount: 2.12, unitType: 'oz', unitCount: 24,
    sourceUrl: null, notes: '24 bars × 2.12 oz. Price needs manual verification.',
  },
  {
    categorySlug: 'protein-bars', storeId: 'aldi',
    name: 'Elevation by Millville Chocolate Peanut Butter Protein Bars',
    brand: 'Elevation by Millville',
    imageUrl: null,
    priceCents: 599, unitAmount: 1.59, unitType: 'oz', unitCount: 5,
    sourceUrl: 'https://www.aldi.us/product/elevation-by-millville-chocolate-peanut-butter-protein-bars-5-count-0000000000061839',
    notes: '5 bars × 1.59 oz.',
  },

  // ── Ground Coffee ─────────────────────────────────────────────────────────
  {
    categorySlug: 'ground-coffee', storeId: 'costco',
    name: 'Kirkland Signature House Blend Ground Coffee',
    brand: 'Kirkland Signature',
    imageUrl: null,
    priceCents: 1699, unitAmount: 40, unitType: 'oz', unitCount: 1,
    sourceUrl: null, notes: '2.5 lb bag = 40 oz. Price needs manual verification.',
  },
  {
    categorySlug: 'ground-coffee', storeId: 'aldi',
    name: 'Barissimo House Blend Ground Coffee',
    brand: 'Barissimo',
    imageUrl: null,
    priceCents: 699, unitAmount: 30.5, unitType: 'oz', unitCount: 1,
    sourceUrl: 'https://www.aldi.us/product/barissimo-house-blend-medium-roast-ground-coffee-30-5-oz-0000000000062014',
    notes: null,
  },

  // ── Vitamins C ────────────────────────────────────────────────────────────
  {
    categorySlug: 'vitamins-c', storeId: 'costco',
    name: 'Kirkland Signature Vitamin C 1000mg',
    brand: 'Kirkland Signature',
    imageUrl: null,
    priceCents: 1499, unitAmount: 500, unitType: 'count', unitCount: 1,
    sourceUrl: null, notes: '500 count. Price needs manual verification.',
  },
  {
    categorySlug: 'vitamins-c', storeId: 'aldi',
    name: 'Savoritz Vitamin C 500mg Chewable Tablets',
    brand: 'Savoritz',
    imageUrl: null,
    priceCents: 399, unitAmount: 100, unitType: 'count', unitCount: 1,
    sourceUrl: 'https://www.aldi.us/product/savoritz-vitamin-c-500mg-chewable-tablets-100-count-0000000000032547',
    notes: null,
  },
]

// Seeded variants are the canonical baseline. On conflict we update price/unit
// data so that re-running the seed always restores known-good prices for seeded
// products — without touching admin-added variants (which aren't in variantData).
console.log('Seeding store variants (upsert — updates price/units for existing seeded records)...')
let inserted = 0
let updated = 0

for (const v of variantData) {
  const categoryId = catMap[v.categorySlug]
  if (!categoryId) {
    console.warn(`  No category found for slug: ${v.categorySlug}`)
    continue
  }

  const existing = await db
    .select({ id: storeVariants.id })
    .from(storeVariants)
    .where(
      and(
        eq(storeVariants.categoryId, categoryId),
        eq(storeVariants.storeId, v.storeId),
        eq(storeVariants.name, v.name),
      ),
    )
    .limit(1)

  const { categorySlug: _slug, ...rest } = v

  if (existing.length > 0) {
    // Update price, unit, and sourceUrl back to the known-good seed values
    await db
      .update(storeVariants)
      .set({
        priceCents: rest.priceCents,
        unitAmount: String(rest.unitAmount),
        unitType: rest.unitType,
        unitCount: rest.unitCount,
        sourceUrl: rest.sourceUrl,
        isStale: false,
      })
      .where(eq(storeVariants.id, existing[0]!.id))
    updated++
  } else {
    await db.insert(storeVariants).values({
      ...rest,
      categoryId,
      unitAmount: String(rest.unitAmount),
    })
    inserted++
  }
}

console.log(`  Inserted ${inserted} new, updated ${updated} existing.`)

// Clean up orphaned variants — scraper-corrupted or renamed records that no longer
// match any seeded name within the same (category, store) pair.
console.log('Cleaning up orphaned variants for seeded (category, store) pairs...')
let deleted = 0

// Group seed names by (categorySlug, storeId)
const seedIndex = new Map<string, string[]>()
for (const v of variantData) {
  const key = `${v.categorySlug}::${v.storeId}`
  const names = seedIndex.get(key) ?? []
  names.push(v.name)
  seedIndex.set(key, names)
}

for (const [key, names] of seedIndex) {
  const [categorySlug, storeId] = key.split('::') as [string, string]
  const categoryId = catMap[categorySlug]
  if (!categoryId) continue

  const orphans = await db
    .select({ id: storeVariants.id, name: storeVariants.name })
    .from(storeVariants)
    .where(
      and(
        eq(storeVariants.categoryId, categoryId),
        eq(storeVariants.storeId, storeId),
        notInArray(storeVariants.name, names),
      ),
    )

  if (orphans.length > 0) {
    for (const o of orphans) {
      console.log(`  Deleting orphan: "${o.name}" (${storeId} / ${categorySlug})`)
    }
    await db.delete(storeVariants).where(
      and(
        eq(storeVariants.categoryId, categoryId),
        eq(storeVariants.storeId, storeId),
        notInArray(storeVariants.name, names),
      ),
    )
    deleted += orphans.length
  }
}

console.log(`  Deleted ${deleted} orphaned variant(s).`)
console.log('✅ Seed complete.')
await pool.end()
