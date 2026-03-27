CREATE UNIQUE INDEX IF NOT EXISTS "idx_variants_category_store_name"
  ON "store_variants" ("category_id", "store_id", "name");
