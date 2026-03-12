import { Router } from 'express'
import { eq } from 'drizzle-orm'
import { db } from '../config/database.js'
import { categories } from '../db/schema.js'

import type { Router as RouterType } from "express"
export const categoriesRouter: RouterType = Router()

// GET /api/v1/categories
categoriesRouter.get('/', async (_req, res, next) => {
  try {
    const rows = await db.select().from(categories).orderBy(categories.name)
    res.json(rows)
  } catch (err) {
    next(err)
  }
})

// GET /api/v1/categories/:slug
categoriesRouter.get('/:slug', async (req, res, next) => {
  try {
    const [row] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, req.params['slug'] ?? ''))
      .limit(1)

    if (!row) {
      res.status(404).json({ error: 'Category not found' })
      return
    }
    res.json(row)
  } catch (err) {
    next(err)
  }
})
