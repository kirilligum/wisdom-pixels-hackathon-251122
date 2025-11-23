import type { Config } from 'drizzle-kit';

export default {
  schema: './mastra/db/schema.ts',
  out: './mastra/db/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'file:./.data/wisdom-pixels.db',
  },
} satisfies Config;
