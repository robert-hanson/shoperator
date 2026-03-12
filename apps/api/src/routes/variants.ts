import { Router } from 'express'
import { and, eq } from 'drizzle-orm'
import { db } from '../config/database.js'
import { categories, storeVariants } from '../db/schema.js'
import type { StoreId } from '@shoperator/shared'

import type { Router as RouterType } from "express"
export const variantsRouter: RouterType = Router()

// GET /api/v1/categories/:slug/variants?store=costco,aldi
variantsRouter.get('/:slug/variants', async (req, res, next) => {
  try {
    const slug = req.params['slug'] ?? ''
    const storeFilter = req.query['store'] as string | undefined

    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1)

    if (!category) {
      res.status(404).json({ error: 'Category not found' })
      return
    }

    const storeIds = storeFilter
      ? (storeFilter.split(',').filter(Boolean) as StoreId[])
      : undefined

    const conditions = [eq(storeVariants.categoryId, category.id)]
    if (storeIds && storeIds.length > 0) {
      // Filter by multiple stores using OR — simple enough at this scale
      const rows = await db
        .select()
        .from(storeVariants)
        .where(and(...conditions))
        .then((all) => all.filter((v) => storeIds.includes(v.storeId as StoreId)))
      res.json(rows)
      return
    }

    const rows = await db
      .select()
      .from(storeVariants)
      .where(and(...conditions))
      .orderBy(storeVariants.storeId, storeVariants.name)

    res.json(rows)
  } catch (err) {
    next(err)
  }
})
