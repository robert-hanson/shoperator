import { Router } from 'express'
import { eq, sql } from 'drizzle-orm'
import { db } from '../config/database.js'
import { storeVariants } from '../db/schema.js'
import { adminAuth } from '../middleware/adminAuth.js'
import { scrapeAssist } from '../services/scrapeAssistService.js'

import type { Router as RouterType } from "express"
export const adminRouter: RouterType = Router()

// All admin routes require auth
adminRouter.use(adminAuth)

// GET /api/v1/admin/stale
adminRouter.get('/stale', async (_req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(storeVariants)
      .where(eq(storeVariants.isStale, true))
      .orderBy(storeVariants.lastUpdated)
    res.json(rows)
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/admin/variants
adminRouter.post('/variants', async (req, res, next) => {
  try {
    const body = req.body as Record<string, unknown>
    const [inserted] = await db
      .insert(storeVariants)
      .values({
        categoryId: body['categoryId'] as string,
        storeId: body['storeId'] as string,
        name: body['name'] as string,
        brand: (body['brand'] as string) ?? null,
        imageUrl: (body['imageUrl'] as string) ?? null,
        priceCents: body['priceCents'] as number,
        unitAmount: String(body['unitAmount']),
        unitType: body['unitType'] as string,
        unitCount: (body['unitCount'] as number) ?? 1,
        sourceUrl: (body['sourceUrl'] as string) ?? null,
        notes: (body['notes'] as string) ?? null,
      })
      .returning()
    res.status(201).json(inserted)
  } catch (err) {
    next(err)
  }
})

// PATCH /api/v1/admin/variants/:id
adminRouter.patch('/variants/:id', async (req, res, next) => {
  try {
    const id = req.params['id'] ?? ''
    const body = req.body as Record<string, unknown>

    const updates: Record<string, unknown> = {
      lastUpdated: sql`now()`,
    }

    if ('priceCents' in body) updates['priceCents'] = body['priceCents']
    if ('name' in body) updates['name'] = body['name']
    if ('brand' in body) updates['brand'] = body['brand']
    if ('imageUrl' in body) updates['imageUrl'] = body['imageUrl']
    if ('unitAmount' in body) updates['unitAmount'] = String(body['unitAmount'])
    if ('unitType' in body) updates['unitType'] = body['unitType']
    if ('unitCount' in body) updates['unitCount'] = body['unitCount']
    if ('sourceUrl' in body) updates['sourceUrl'] = body['sourceUrl']
    if ('notes' in body) updates['notes'] = body['notes']
    if ('isStale' in body) updates['isStale'] = body['isStale']

    const [updated] = await db
      .update(storeVariants)
      .set(updates)
      .where(eq(storeVariants.id, id))
      .returning()

    if (!updated) {
      res.status(404).json({ error: 'Variant not found' })
      return
    }
    res.json(updated)
  } catch (err) {
    next(err)
  }
})

// DELETE /api/v1/admin/variants/:id
adminRouter.delete('/variants/:id', async (req, res, next) => {
  try {
    const id = req.params['id'] ?? ''
    await db.delete(storeVariants).where(eq(storeVariants.id, id))
    res.status(204).send()
  } catch (err) {
    next(err)
  }
})

// POST /api/v1/admin/scrape-assist
adminRouter.post('/scrape-assist', async (req, res, next) => {
  try {
    const { url } = req.body as { url?: string }
    if (!url) {
      res.status(400).json({ error: 'url is required' })
      return
    }
    const suggestion = await scrapeAssist(url)
    res.json(suggestion)
  } catch (err) {
    next(err)
  }
})
