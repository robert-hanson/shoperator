import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  ADMIN_TOKEN: z.string().min(8),
  PORT: z.coerce.number().default(3001),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Invalid environment variables:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
