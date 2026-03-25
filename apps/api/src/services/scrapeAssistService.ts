import { load } from 'cheerio'
import type { NewStoreVariant, UnitType } from '@shoperator/shared'

interface ParsedUnit {
  unitAmount: number
  unitType: UnitType
  unitCount: number
}

/** Parse a unit string like "32 oz", "6 ct", "11 fl oz × 12-Count" into structured data */
export function parseUnitString(text: string): ParsedUnit | null {
  // Multi-pack: "11 fl oz × 12" / "11 fl oz x 12-pack" / "11 fl oz, 12-Count"
  const multiPack = text.match(
    /(\d+\.?\d*)\s*(fl\.?\s*oz|oz|lbs?|g|kg|ml|l)\s*[,x×]\s*(\d+)[\s-]?(?:ct|count|pack|pk)?/i,
  )
  if (multiPack) {
    const type = normalizeUnitType(multiPack[2] ?? '')
    if (type) {
      return {
        unitAmount: parseFloat(multiPack[1] ?? '0'),
        unitType: type,
        unitCount: parseInt(multiPack[3] ?? '1', 10),
      }
    }
  }

  // Count only: "6 ct", "12 count", "12-pack"
  const countOnly = text.match(/(\d+)\s*(?:ct|count|pack|pk|pc|pcs)\b/i)
  if (countOnly) {
    return { unitAmount: parseInt(countOnly[1] ?? '1', 10), unitType: 'count', unitCount: 1 }
  }

  // Weight / volume: "32 oz", "14.3 oz", "avg. 2 lb/package", "48 fl oz"
  const unitMatch = text.match(
    /(?:avg\.?\s+)?(\d+\.?\d*)\s*(fl\.?\s*oz|oz|lbs?|lb|g|kg|ml|l|sq\.?\s*ft|sheets?)\b/i,
  )
  if (unitMatch) {
    const type = normalizeUnitType(unitMatch[2] ?? '')
    if (type) {
      return { unitAmount: parseFloat(unitMatch[1] ?? '0'), unitType: type, unitCount: 1 }
    }
  }

  return null
}

function normalizeUnitType(raw: string): UnitType | null {
  const s = raw.toLowerCase().replace(/[\s.]+/g, '')
  if (s === 'floz') return 'fl_oz'
  if (s === 'oz') return 'oz'
  if (s === 'lb' || s === 'lbs') return 'lbs'
  if (s === 'g') return 'g'
  if (s === 'kg') return 'kg'
  if (s === 'ml') return 'ml'
  if (s === 'l') return 'l'
  if (s === 'sqft') return 'sq_ft'
  if (s.startsWith('sheet')) return 'sheets'
  return null
}

function detectStore(url: string): 'costco' | 'aldi' | null {
  try {
    const hostname = new URL(url).hostname.toLowerCase()
    if (hostname.includes('costco.com')) return 'costco'
    if (hostname.includes('aldi.us') || hostname.includes('aldi.com')) return 'aldi'
  } catch {
    // invalid URL
  }
  return null
}

interface JsonLdProduct {
  name?: string
  image?: string
  price?: number
  description?: string
}

/** Extract Product data from JSON-LD structured data if present */
function extractJsonLd(html: string): JsonLdProduct {
  const $ = load(html)
  const result: JsonLdProduct = {}

  $('script[type="application/ld+json"]').each((_, el) => {
    if (result.name) return // already found

    try {
      const parsed = JSON.parse($(el).html() ?? '') as Record<string, unknown>

      // Handle both direct Product and @graph arrays
      let product: Record<string, unknown> | null = null
      if (parsed['@type'] === 'Product') {
        product = parsed
      } else if (Array.isArray(parsed['@graph'])) {
        product =
          (parsed['@graph'] as Record<string, unknown>[]).find(
            (n) => n['@type'] === 'Product',
          ) ?? null
      }

      if (!product) return

      if (typeof product['name'] === 'string') result.name = product['name']
      if (typeof product['image'] === 'string') result.image = product['image']
      if (typeof product['description'] === 'string') result.description = product['description']

      const offers = product['offers'] as Record<string, unknown> | undefined
      if (offers) {
        const raw = offers['price']
        if (typeof raw === 'string') result.price = Math.round(parseFloat(raw) * 100)
        else if (typeof raw === 'number') result.price = Math.round(raw * 100)
      }
    } catch {
      // ignore malformed JSON-LD
    }
  })

  return result
}

/** Try store-specific CSS selectors to find unit/size text */
function extractUnitByStore(html: string, store: 'costco' | 'aldi'): ParsedUnit | null {
  const $ = load(html)

  const candidates: string[] = []

  if (store === 'aldi') {
    candidates.push(
      $('.product-hero__qty').text(),
      $('.product-detail__quantity').text(),
      $('[class*="quantity"]').first().text(),
      $('[class*="size"]').first().text(),
      $('[class*="unit"]').first().text(),
    )
  }

  if (store === 'costco') {
    candidates.push(
      $('[class*="packageType"]').text(),
      $('[class*="package-type"]').text(),
      $('.product-description .item-title').text(),
      $('[class*="product-detail"]').first().text(),
    )
  }

  for (const text of candidates) {
    const parsed = parseUnitString(text.trim())
    if (parsed) return parsed
  }

  return null
}

/**
 * Attempts to extract product information from a store product URL.
 * Returns partial StoreVariant data for human review — does NOT save to DB.
 */
export async function scrapeAssist(url: string): Promise<Partial<NewStoreVariant>> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) {
      return { sourceUrl: url }
    }

    const html = await response.text()
    const store = detectStore(url)

    // 1. JSON-LD structured data (most reliable)
    const jsonLd = extractJsonLd(html)

    // 2. Fallback: og: meta tags and regex
    const ogTitle = html.match(/<meta property="og:title" content="([^"]+)"/i)?.[1]
    const titleTag = html.match(/<title>([^<]+)<\/title>/i)?.[1]
    const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/i)?.[1]
    const priceMatch = html.match(/\$(\d+\.\d{2})/)?.[1]
    const regexPrice = priceMatch ? Math.round(parseFloat(priceMatch) * 100) : undefined

    const name = jsonLd.name ?? ogTitle ?? titleTag ?? undefined
    const imageUrl = jsonLd.image ?? ogImage ?? undefined
    const priceCents = jsonLd.price ?? regexPrice ?? undefined

    // 3. Unit extraction: store-specific selectors → parse from title → parse from description
    let unitData: ParsedUnit | null = null

    if (store) {
      unitData = extractUnitByStore(html, store)
    }
    if (!unitData && name) {
      unitData = parseUnitString(name)
    }
    if (!unitData && jsonLd.description) {
      unitData = parseUnitString(jsonLd.description)
    }

    const result: Partial<NewStoreVariant> = { sourceUrl: url }
    if (name) result.name = sanitizeText(name)
    if (imageUrl) result.imageUrl = imageUrl
    if (priceCents !== undefined) result.priceCents = priceCents
    if (unitData) {
      result.unitAmount = unitData.unitAmount
      result.unitType = unitData.unitType
      result.unitCount = unitData.unitCount
    }

    return result
  } catch {
    return { sourceUrl: url }
  }
}

function sanitizeText(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
}
