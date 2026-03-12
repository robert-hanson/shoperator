import type { StoreVariant, UnitType } from '../types/product.js'
import type { NormalizedPrice } from '../types/comparison.js'
import { convertUnit, unitLabel } from './unitNormalizer.js'

/**
 * Calculates the unit price for a store variant normalized to `targetUnit`.
 *
 * Formula:
 *   totalUnits = unitAmount * unitCount  (converted to targetUnit)
 *   priceCentsPerUnit = priceCents / totalUnits
 */
export function calcNormalizedPrice(variant: StoreVariant, targetUnit: UnitType): NormalizedPrice {
  const totalInTargetUnit = convertUnit(
    variant.unitAmount * variant.unitCount,
    variant.unitType,
    targetUnit,
  )

  if (totalInTargetUnit <= 0) {
    throw new Error(`Invalid total quantity for variant ${variant.id}`)
  }

  const priceCentsPerUnit = variant.priceCents / totalInTargetUnit

  const dollarsPerUnit = priceCentsPerUnit / 100
  const displayString = `$${dollarsPerUnit.toFixed(2)} / ${unitLabel(targetUnit)}`

  return {
    variantId: variant.id,
    priceCentsPerUnit,
    normalizedUnit: targetUnit,
    displayString,
  }
}

/**
 * Formats a price in cents to a dollar string.
 * e.g. 1999 → "$19.99"
 */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

/**
 * Calculates the savings percentage between the winner and loser.
 * Returns a positive number representing how much cheaper the winner is.
 * e.g. 23.5 means "winner is 23.5% cheaper"
 */
export function calcSavingsPercent(winnerCentsPerUnit: number, loserCentsPerUnit: number): number {
  if (loserCentsPerUnit <= 0) return 0
  return ((loserCentsPerUnit - winnerCentsPerUnit) / loserCentsPerUnit) * 100
}
