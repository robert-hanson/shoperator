import { eq } from 'drizzle-orm'
import { db } from '../config/database.js'
import { categories, storeVariants } from '../db/schema.js'
import { scrapeAssist } from './scrapeAssistService.js'
import type { NewStoreVariant, UnitType } from '@shoperator/shared'

export interface DiscoveryCandidate {
  sourceUrl: string
  store: 'costco' | 'aldi' | 'unknown'
  scraped: Partial<NewStoreVariant>
  isDuplicate: boolean
  valid: boolean
  warning?: string
}

export interface DiscoveryResult {
  candidates: DiscoveryCandidate[]
  skippedUrls: string[]
}

function detectStore(url: string): 'costco' | 'aldi' | 'unknown' {
  try {
    const host = new URL(url).hostname.toLowerCase()
    if (host.includes('costco.com')) return 'costco'
    if (host.includes('aldi.us') || host.includes('aldi.com')) return 'aldi'
  } catch {
    // invalid URL
  }
  return 'unknown'
}

function validateCandidate(
  scraped: Partial<NewStoreVariant>,
  preferredUnit: UnitType,
): { valid: boolean; warning?: string } {
  if (!scraped.priceCents) {
    return { valid: false, warning: 'No price extracted — check URL or update manually after adding.' }
  }
  if (scraped.priceCents < 1 || scraped.priceCents > 100_000) {
    return { valid: false, warning: `Price out of range: $${(scraped.priceCents / 100).toFixed(2)}` }
  }
  if (scraped.unitType && scraped.unitType !== preferredUnit) {
    return {
      valid: true,
      warning: `Unit mismatch: scraped "${scraped.unitType}", category expects "${preferredUnit}". Verify before adding.`,
    }
  }
  if (!scraped.unitAmount) {
    return { valid: true, warning: 'Unit size not extracted — fill in manually before comparing.' }
  }
  return { valid: true }
}

/**
 * Scrapes a list of product URLs, validates them against the given category,
 * and returns candidates for admin review. Nothing is saved to the DB.
 */
export async function discoverProducts(
  urls: string[],
  categorySlug: string,
): Promise<DiscoveryResult> {
  // Load category for validation
  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, categorySlug))
    .limit(1)

  if (!category) {
    throw new Error(`Category not found: ${categorySlug}`)
  }

  // Load all existing sourceUrls for deduplication
  const existingUrls = new Set(
    (
      await db
        .select({ sourceUrl: storeVariants.sourceUrl })
        .from(storeVariants)
        .where(eq(storeVariants.categoryId, category.id))
    )
      .map((r) => r.sourceUrl)
      .filter((u): u is string => u !== null),
  )

  const candidates: DiscoveryCandidate[] = []
  const skippedUrls: string[] = []

  for (const url of urls) {
    const trimmed = url.trim()
    if (!trimmed) continue

    // Basic URL validation
    try {
      new URL(trimmed)
    } catch {
      skippedUrls.push(trimmed)
      continue
    }

    const store = detectStore(trimmed)

    try {
      const scraped = await scrapeAssist(trimmed)
      const { valid, warning } = validateCandidate(scraped, category.preferredUnit as UnitType)
      const isDuplicate = existingUrls.has(trimmed)

      const candidate: DiscoveryCandidate = { sourceUrl: trimmed, store, scraped, isDuplicate, valid }
      if (warning) candidate.warning = warning
      candidates.push(candidate)
    } catch {
      candidates.push({
        sourceUrl: trimmed,
        store,
        scraped: { sourceUrl: trimmed },
        isDuplicate: existingUrls.has(trimmed),
        valid: false,
        warning: 'Failed to fetch — check URL is accessible.',
      })
    }

    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 400))
  }

  return { candidates, skippedUrls }
}
