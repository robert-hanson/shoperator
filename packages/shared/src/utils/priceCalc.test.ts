import { describe, it, expect } from 'vitest'
import { calcNormalizedPrice, formatPrice, calcSavingsPercent } from './priceCalc.js'
import type { StoreVariant } from '../types/product.js'

const makeVariant = (overrides: Partial<StoreVariant> = {}): StoreVariant => ({
  id: 'v1',
  categoryId: 'c1',
  storeId: 'costco',
  name: 'Test Product',
  brand: 'Test Brand',
  imageUrl: null,
  priceCents: 1999,
  unitAmount: 32,
  unitType: 'fl_oz',
  unitCount: 1,
  sourceUrl: null,
  lastUpdated: new Date().toISOString(),
  isStale: false,
  notes: null,
  createdAt: new Date().toISOString(),
  ...overrides,
})

describe('calcNormalizedPrice', () => {
  it('calculates price per fl_oz for single unit', () => {
    // $19.99 / 32 fl oz = $0.62/fl oz
    const result = calcNormalizedPrice(makeVariant({ priceCents: 1999, unitAmount: 32, unitType: 'fl_oz', unitCount: 1 }), 'fl_oz')
    expect(result.priceCentsPerUnit).toBeCloseTo(1999 / 32, 2)
    expect(result.normalizedUnit).toBe('fl_oz')
    expect(result.displayString).toMatch(/\$0\.62 \/ fl oz/)
  })

  it('accounts for unit count (pack of 2)', () => {
    // $19.99 / (32 fl_oz * 2) = $0.31/fl oz
    const result = calcNormalizedPrice(
      makeVariant({ priceCents: 1999, unitAmount: 32, unitType: 'fl_oz', unitCount: 2 }),
      'fl_oz',
    )
    expect(result.priceCentsPerUnit).toBeCloseTo(1999 / 64, 2)
  })

  it('normalizes liter to fl_oz', () => {
    // $5.99 / (1 l = 33.814 fl_oz)
    const result = calcNormalizedPrice(
      makeVariant({ priceCents: 599, unitAmount: 1, unitType: 'l', unitCount: 1 }),
      'fl_oz',
    )
    expect(result.priceCentsPerUnit).toBeCloseTo(599 / 33.814, 2)
  })

  it('calculates price per count for wipes', () => {
    // $24.99 / 900 wipes
    const result = calcNormalizedPrice(
      makeVariant({ priceCents: 2499, unitAmount: 900, unitType: 'count', unitCount: 1 }),
      'count',
    )
    expect(result.priceCentsPerUnit).toBeCloseTo(2499 / 900, 4)
    expect(result.displayString).toMatch(/\/ count/)
  })
})

describe('formatPrice', () => {
  it('formats cents to dollar string', () => {
    expect(formatPrice(1999)).toBe('$19.99')
    expect(formatPrice(100)).toBe('$1.00')
    expect(formatPrice(0)).toBe('$0.00')
  })
})

describe('calcSavingsPercent', () => {
  it('returns correct percentage', () => {
    expect(calcSavingsPercent(75, 100)).toBe(25)
    expect(calcSavingsPercent(50, 100)).toBe(50)
  })

  it('returns 0 when loser is 0', () => {
    expect(calcSavingsPercent(10, 0)).toBe(0)
  })
})
