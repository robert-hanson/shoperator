import type { NewStoreVariant } from '@shoperator/shared'

/**
 * Attempts to extract product information from a store product URL.
 * Returns partial StoreVariant data for human review — does NOT save to DB.
 *
 * Uses a simple HTML fetch + regex approach for reliability.
 * Falls back gracefully if extraction fails.
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

    // Extract og:title or <title>
    const ogTitle = html.match(/<meta property="og:title" content="([^"]+)"/i)?.[1]
    const titleTag = html.match(/<title>([^<]+)<\/title>/i)?.[1]
    const name = ogTitle ?? titleTag ?? undefined

    // Extract og:image
    const imageUrl =
      html.match(/<meta property="og:image" content="([^"]+)"/i)?.[1] ?? undefined

    // Extract price — look for common patterns like $XX.XX
    const priceMatch = html.match(/\$(\d+\.\d{2})/)?.[1]
    const priceCents = priceMatch ? Math.round(parseFloat(priceMatch) * 100) : undefined

    const result: Record<string, unknown> = { sourceUrl: url }
    if (name) result['name'] = sanitizeText(name)
    if (imageUrl) result['imageUrl'] = imageUrl
    if (priceCents !== undefined) result['priceCents'] = priceCents
    return result as Partial<NewStoreVariant>
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
