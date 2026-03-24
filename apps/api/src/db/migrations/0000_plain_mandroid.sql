CREATE TABLE IF NOT EXISTS "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"icon_emoji" text,
	"preferred_unit" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "store_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"store_id" text NOT NULL,
	"name" text NOT NULL,
	"brand" text,
	"image_url" text,
	"price_cents" integer NOT NULL,
	"unit_amount" numeric NOT NULL,
	"unit_type" text NOT NULL,
	"unit_count" integer DEFAULT 1 NOT NULL,
	"source_url" text,
	"last_updated" timestamp with time zone DEFAULT now() NOT NULL,
	"is_stale" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "store_variants" ADD CONSTRAINT "store_variants_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_variants_category" ON "store_variants" ("category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_variants_store" ON "store_variants" ("store_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_variants_stale" ON "store_variants" ("is_stale");