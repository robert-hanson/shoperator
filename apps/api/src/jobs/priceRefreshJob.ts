import cron from 'node-cron'
import { eq, isNotNull, sql } from 'drizzle-orm'
import { db } from '../config/database.js'
import { storeVariants } from '../db/schema.js'
import { scrapeAssist } from '../services/scrapeAssistService.js'

export interface RefreshFailure {
  name: string
  storeId: string
  sourceUrl: string
  reason: string
}

export interface RefreshResult {
  updated: number
  failed: number
  durationMs: number
  failures: RefreshFailure[]
}

/**
 * Scrapes fresh prices for all variants that have a sourceUrl and updates the DB.
 * Reused by the weekly cron, the admin API endpoint, and the local CLI script.
 */
export async function runPriceRefresh(): Promise<RefreshResult> {
  const start = Date.now()
  let updated = 0
  let failed = 0
  const failures: RefreshFailure[] = []

  const variants = await db
    .select()
    .from(storeVariants)
    .where(isNotNull(storeVariants.sourceUrl))

  console.log(`[price-refresh] Refreshing ${variants.length} variant(s)...`)

  for (const variant of variants) {
    try {
      const data = await scrapeAssist(variant.sourceUrl!)

      if (!data.priceCents) {
        const reason = 'No price extracted'
        console.warn(`[price-refresh] ${reason} for "${variant.name}" — skipping. (${variant.sourceUrl})`)
        failures.push({ name: variant.name, storeId: variant.storeId, sourceUrl: variant.sourceUrl!, reason })
        failed++
        continue
      }

      const updates: Record<string, unknown> = {
        priceCents: data.priceCents,
        lastUpdated: sql`now()`,
        isStale: false,
      }
      if (data.name) updates['name'] = data.name
      if (data.imageUrl) updates['imageUrl'] = data.imageUrl
      if (data.unitAmount !== undefined) updates['unitAmount'] = String(data.unitAmount)
      if (data.unitType) updates['unitType'] = data.unitType
      if (data.unitCount !== undefined) updates['unitCount'] = data.unitCount

      await db.update(storeVariants).set(updates).where(eq(storeVariants.id, variant.id))

      console.log(`[price-refresh] Updated: ${variant.name}`)
      updated++
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Unknown error'
      console.error(`[price-refresh] Failed to update "${variant.name}":`, err)
      failures.push({ name: variant.name, storeId: variant.storeId, sourceUrl: variant.sourceUrl!, reason })
      failed++
    }
  }

  const durationMs = Date.now() - start
  console.log(
    `[price-refresh] Done. Updated: ${updated}, Failed: ${failed}, Time: ${durationMs}ms`,
  )

  return { updated, failed, durationMs, failures }
}

export function startPriceRefreshJob() {
  // Runs every Sunday at 3am
  cron.schedule('0 3 * * 0', () => {
    console.log('[price-refresh] Weekly refresh starting...')
    void runPriceRefresh()
  })

  console.log('[price-refresh] Cron job scheduled (weekly, Sunday at 3am).')
}
