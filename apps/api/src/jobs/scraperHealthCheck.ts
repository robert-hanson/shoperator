import cron from 'node-cron'
import { eq, isNotNull, and } from 'drizzle-orm'
import { db } from '../config/database.js'
import { storeVariants } from '../db/schema.js'
import { scrapeAssist } from '../services/scrapeAssistService.js'

interface StoreHealth {
  healthy: boolean
  lastChecked: string | null
  error?: string
}

interface ScraperHealth {
  costco: StoreHealth
  aldi: StoreHealth
}

// In-memory health state — structured to support future alerting (email/Slack/webhook)
// without changing the shape of this object.
const health: ScraperHealth = {
  costco: { healthy: true, lastChecked: null },
  aldi: { healthy: true, lastChecked: null },
}

export function getScraperHealth(): ScraperHealth {
  return health
}

async function checkStore(storeId: 'costco' | 'aldi'): Promise<void> {
  const [variant] = await db
    .select()
    .from(storeVariants)
    .where(and(eq(storeVariants.storeId, storeId), isNotNull(storeVariants.sourceUrl)))
    .limit(1)

  if (!variant?.sourceUrl) {
    // No testable variant for this store — skip silently
    return
  }

  try {
    const result = await scrapeAssist(variant.sourceUrl)
    const isHealthy = !!result.name && !!result.priceCents

    health[storeId] = {
      healthy: isHealthy,
      lastChecked: new Date().toISOString(),
      ...(isHealthy ? {} : { error: 'Scraper returned incomplete data (missing name or price)' }),
    }
  } catch (err) {
    health[storeId] = {
      healthy: false,
      lastChecked: new Date().toISOString(),
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

async function runHealthCheck(): Promise<void> {
  console.log('[scraper-health] Running health check...')
  try {
    await checkStore('costco')
    await checkStore('aldi')
    const costcoStatus = health.costco.healthy ? 'OK' : `FAIL (${health.costco.error})`
    const aldiStatus = health.aldi.healthy ? 'OK' : `FAIL (${health.aldi.error})`
    console.log(`[scraper-health] Costco: ${costcoStatus} | Aldi: ${aldiStatus}`)
  } catch (err) {
    console.error('[scraper-health] Health check failed:', err)
  }
}

export function startScraperHealthCheck() {
  // Runs every Sunday at 4am (after weekly price refresh at 3am)
  cron.schedule('0 4 * * 0', () => {
    void runHealthCheck()
  })

  // Run once on startup so health status is immediately available
  void runHealthCheck()

  console.log('[scraper-health] Health check scheduled (weekly, Sunday at 4am).')
}
