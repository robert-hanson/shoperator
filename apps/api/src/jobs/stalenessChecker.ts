import cron from 'node-cron'
import { lt, eq, and, sql } from 'drizzle-orm'
import { db } from '../config/database.js'
import { storeVariants } from '../db/schema.js'

const STALE_AFTER_DAYS = 7

export function startStalenessChecker() {
  // Runs every day at 2am
  cron.schedule('0 2 * * *', async () => {
    try {
      const threshold = new Date()
      threshold.setDate(threshold.getDate() - STALE_AFTER_DAYS)

      const result = await db
        .update(storeVariants)
        .set({ isStale: true })
        .where(
          and(
            eq(storeVariants.isStale, false),
            lt(storeVariants.lastUpdated, threshold),
          ),
        )
        .returning({ id: storeVariants.id })

      if (result.length > 0) {
        console.log(`[staleness] Marked ${result.length} variant(s) as stale.`)
      }
    } catch (err) {
      console.error('[staleness] Error during staleness check:', err)
    }
  })

  console.log('[staleness] Cron job scheduled (daily at 2am).')
}
