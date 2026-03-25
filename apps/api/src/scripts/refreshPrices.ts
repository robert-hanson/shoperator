import 'dotenv/config'
import { runPriceRefresh } from '../jobs/priceRefreshJob.js'

async function main() {
  console.log('Starting manual price refresh...\n')
  const result = await runPriceRefresh()
  console.log(`\nDone: ${result.updated} updated, ${result.failed} failed (${result.durationMs}ms)`)
  process.exit(result.failed > 0 ? 1 : 0)
}

main().catch((err: unknown) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
