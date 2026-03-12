import type { UnitType } from '../types/product.js'

/**
 * Conversion factors to normalize each unit to its base unit.
 *
 * Base units:
 *   Volume  → fl_oz
 *   Mass    → oz
 *   Count   → count
 *   Area    → sq_ft
 *   Sheets  → sheets
 */
const TO_BASE: Record<UnitType, number> = {
  // Volume → fl_oz
  fl_oz: 1,
  ml: 0.033814,
  l: 33.814,

  // Mass → oz
  oz: 1,
  g: 0.035274,
  kg: 35.274,
  lbs: 16,

  // Count → count
  count: 1,

  // Area → sq_ft
  sq_ft: 1,

  // Sheets → sheets
  sheets: 1,
}

/**
 * Returns a conversion factor to go from `from` to `to`.
 * Throws if the two units are incompatible (different dimension).
 */
export function conversionFactor(from: UnitType, to: UnitType): number {
  const fromBase = TO_BASE[from]
  const toBase = TO_BASE[to]

  if (fromBase === undefined || toBase === undefined) {
    throw new Error(`Unknown unit: ${from} or ${to}`)
  }

  // Validate that the units share the same dimension
  const volumeUnits: UnitType[] = ['fl_oz', 'ml', 'l']
  const massUnits: UnitType[] = ['oz', 'g', 'kg', 'lbs']
  const countUnits: UnitType[] = ['count']
  const areaUnits: UnitType[] = ['sq_ft']
  const sheetUnits: UnitType[] = ['sheets']

  const dimensions = [volumeUnits, massUnits, countUnits, areaUnits, sheetUnits]
  const fromDim = dimensions.find((d) => d.includes(from))
  const toDim = dimensions.find((d) => d.includes(to))

  if (fromDim !== toDim) {
    throw new Error(`Incompatible units: cannot convert ${from} to ${to}`)
  }

  return fromBase / toBase
}

/**
 * Converts a quantity from one unit to another.
 */
export function convertUnit(amount: number, from: UnitType, to: UnitType): number {
  return amount * conversionFactor(from, to)
}

/**
 * Returns the display label for a unit type.
 */
export function unitLabel(unit: UnitType): string {
  const labels: Record<UnitType, string> = {
    fl_oz: 'fl oz',
    ml: 'ml',
    l: 'L',
    oz: 'oz',
    g: 'g',
    kg: 'kg',
    lbs: 'lbs',
    count: 'count',
    sq_ft: 'sq ft',
    sheets: 'sheets',
  }
  return labels[unit]
}
