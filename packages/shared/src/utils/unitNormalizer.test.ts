import { describe, it, expect } from 'vitest'
import { conversionFactor, convertUnit, unitLabel } from './unitNormalizer.js'

describe('conversionFactor', () => {
  it('same unit → 1', () => {
    expect(conversionFactor('fl_oz', 'fl_oz')).toBe(1)
    expect(conversionFactor('oz', 'oz')).toBe(1)
    expect(conversionFactor('count', 'count')).toBe(1)
  })

  it('volume conversions', () => {
    expect(convertUnit(1, 'l', 'fl_oz')).toBeCloseTo(33.814, 2)
    expect(convertUnit(1000, 'ml', 'fl_oz')).toBeCloseTo(33.814, 2)
    expect(convertUnit(33.814, 'fl_oz', 'l')).toBeCloseTo(1, 3)
  })

  it('mass conversions', () => {
    expect(convertUnit(1, 'lbs', 'oz')).toBe(16)
    expect(convertUnit(1, 'kg', 'oz')).toBeCloseTo(35.274, 2)
    expect(convertUnit(1000, 'g', 'oz')).toBeCloseTo(35.274, 2)
  })

  it('throws on incompatible units', () => {
    expect(() => conversionFactor('oz', 'fl_oz')).toThrow()
    expect(() => conversionFactor('count', 'oz')).toThrow()
  })
})

describe('unitLabel', () => {
  it('returns human-readable labels', () => {
    expect(unitLabel('fl_oz')).toBe('fl oz')
    expect(unitLabel('sq_ft')).toBe('sq ft')
    expect(unitLabel('lbs')).toBe('lbs')
    expect(unitLabel('count')).toBe('count')
  })
})
