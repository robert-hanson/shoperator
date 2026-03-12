import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  iconEmoji: text('icon_emoji'),
  preferredUnit: text('preferred_unit').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const storeVariants = pgTable(
  'store_variants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    storeId: text('store_id').notNull(),
    name: text('name').notNull(),
    brand: text('brand'),
    imageUrl: text('image_url'),
    priceCents: integer('price_cents').notNull(),
    unitAmount: numeric('unit_amount').notNull(),
    unitType: text('unit_type').notNull(),
    unitCount: integer('unit_count').notNull().default(1),
    sourceUrl: text('source_url'),
    lastUpdated: timestamp('last_updated', { withTimezone: true }).defaultNow().notNull(),
    isStale: boolean('is_stale').notNull().default(false),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    categoryIdx: index('idx_variants_category').on(table.categoryId),
    storeIdx: index('idx_variants_store').on(table.storeId),
    staleIdx: index('idx_variants_stale').on(table.isStale),
  }),
)

export const categoriesRelations = relations(categories, ({ many }) => ({
  variants: many(storeVariants),
}))

export const storeVariantsRelations = relations(storeVariants, ({ one }) => ({
  category: one(categories, {
    fields: [storeVariants.categoryId],
    references: [categories.id],
  }),
}))

export type CategoryRow = typeof categories.$inferSelect
export type NewCategoryRow = typeof categories.$inferInsert
export type StoreVariantRow = typeof storeVariants.$inferSelect
export type NewStoreVariantRow = typeof storeVariants.$inferInsert
