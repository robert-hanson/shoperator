import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { env } from './config/env.js'
import { errorHandler } from './middleware/errorHandler.js'
import { categoriesRouter } from './routes/categories.js'
import { variantsRouter } from './routes/variants.js'
import { comparisonRouter } from './routes/comparison.js'
import { adminRouter } from './routes/admin.js'
import { startStalenessChecker } from './jobs/stalenessChecker.js'

const app = express()

app.use(cors({ origin: env.CORS_ORIGIN }))
app.use(express.json())

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API routes
app.use('/api/v1/categories', categoriesRouter)
app.use('/api/v1/categories', variantsRouter)
app.use('/api/v1/comparison', comparisonRouter)
app.use('/api/v1/admin', adminRouter)

app.use(errorHandler)

app.listen(env.PORT, () => {
  console.log(`🛒 Shoperator API running on http://localhost:${env.PORT}`)
})

if (env.NODE_ENV !== 'test') {
  startStalenessChecker()
}
