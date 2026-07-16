import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  PORT: z.coerce.number().default(4000),
  CRON_ENABLED: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
  INTERNAL_CRON_SECRET: z.string().default(""),
  CORS_ORIGINS: z.string().default("http://localhost:3000"),
});

export const config = envSchema.parse(process.env);

export const corsOrigins = config.CORS_ORIGINS.split(",").map((s) => s.trim());
