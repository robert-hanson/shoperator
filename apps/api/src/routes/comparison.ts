import { Router } from 'express'
import { inArray } from 'drizzle-orm'
import { db } from '../config/database.js'
import { categories, storeVariants } from '../db/schema.js'
import { calcNormalizedPrice, calcSavingsPercent } from '@shoperator/shared'
import type { StoreVariant, UnitType } from '@shoperator/shared'

import type { Router as RouterType } from "express"
export const comparisonRouter: RouterType = Router()

// GET /api/v1/comparison?variantIds=uuid1,uuid2
comparisonRouter.get('/', async (req, res, next) => {
  try {
    const idsParam = req.query['variantIds'] as string | undefined
    if (!idsParam) {
      res.status(400).json({ error: 'variantIds query parameter is required' })
      return
    }

    const ids = idsParam.split(',').filter(Boolean)
    if (ids.length < 2) {
      res.status(400).json({ error: 'At least 2 variant IDs are required' })
      return
    }

    const variantRows = await db
      .select()
      .from(storeVariants)
      .where(inArray(storeVariants.id, ids))

    if (variantRows.length < 2) {
      res.status(404).json({ error: 'One or more variants not found' })
      return
    }

    // All variants should share the same category
    const categoryIds = [...new Set(variantRows.map((v) => v.categoryId))]
    if (categoryIds.length > 1) {
      res.status(400).json({ error: 'All variants must belong to the same category' })
      return
    }

    const [category] = await db
      .select()
      .from(categories)
      .where(inArray(categories.id, categoryIds))
      .limit(1)

    if (!category) {
      res.status(404).json({ error: 'Category not found' })
      return
    }

    // Map DB rows to shared StoreVariant type
    const variants: StoreVariant[] = variantRows.map((r) => ({
      id: r.id,
      categoryId: r.categoryId,
      storeId: r.storeId as StoreVariant['storeId'],
      name: r.name,
      brand: r.brand ?? '',
      imageUrl: r.imageUrl ?? null,
      priceCents: r.priceCents,
      unitAmount: Number(r.unitAmount),
      unitType: r.unitType as UnitType,
      unitCount: r.unitCount,
      sourceUrl: r.sourceUrl ?? null,
      lastUpdated: r.lastUpdated.toISOString(),
      isStale: r.isStale,
      notes: r.notes ?? null,
      createdAt: r.createdAt.toISOString(),
    }))

    const targetUnit = category.preferredUnit as UnitType
    const normalizedPrices = variants.map((v) => calcNormalizedPrice(v, targetUnit))

    const winner = normalizedPrices.reduce((a, b) =>
      a.priceCentsPerUnit < b.priceCentsPerUnit ? a : b,
    )
    const loser = normalizedPrices.find((p) => p.variantId !== winner.variantId)!

    const savingsPercent = calcSavingsPercent(winner.priceCentsPerUnit, loser.priceCentsPerUnit)

    res.json({
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        iconEmoji: category.iconEmoji ?? '',
        preferredUnit: category.preferredUnit,
        createdAt: category.createdAt.toISOString(),
      },
      variants,
      normalizedPrices,
      winnerId: winner.variantId,
      savingsPercent: Math.round(savingsPercent * 10) / 10,
    })
  } catch (err) {
    next(err)
  }
})
