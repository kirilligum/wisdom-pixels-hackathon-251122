import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

/**
 * Brand table - represents a company/organization using the platform
 * REQ-101: System shall store brand profiles with unique URL slugs
 */
export const brands = sqliteTable('brands', {
  brandId: text('brand_id').primaryKey(),
  name: text('name').notNull(),
  domain: text('domain').notNull(),
  description: text('description'),
  urlSlug: text('url_slug').notNull().unique(),
  contentSources: text('content_sources', { mode: 'json' }).$type<string[]>().notNull().default(sql`'[]'`),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

/**
 * Persona table - customer archetypes extracted from brand content
 * REQ-102: System shall extract 3+ personas per brand
 */
export const personas = sqliteTable('personas', {
  personaId: text('persona_id').primaryKey(),
  brandId: text('brand_id').notNull().references(() => brands.brandId, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  description: text('description').notNull(),
  tags: text('tags', { mode: 'json' }).$type<string[]>().notNull().default(sql`'[]'`),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

/**
 * Environment table - physical/virtual settings extracted from brand content
 * REQ-103: System shall extract 3+ environments per brand
 */
export const environments = sqliteTable('environments', {
  environmentId: text('environment_id').primaryKey(),
  brandId: text('brand_id').notNull().references(() => brands.brandId, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  description: text('description').notNull(),
  tags: text('tags', { mode: 'json' }).$type<string[]>().notNull().default(sql`'[]'`),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

/**
 * Influencer table - preset influencers available for card generation
 * REQ-104: System shall provide 5+ influencers with reference images
 */
export const influencers = sqliteTable('influencers', {
  influencerId: text('influencer_id').primaryKey(),
  name: text('name').notNull(),
  bio: text('bio').notNull(),
  domain: text('domain').notNull(),
  imageUrl: text('image_url').notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

/**
 * Card table - generated training cards with Q&A and images
 * REQ-105: System shall generate 20+ cards per brand
 * REQ-201: Cards must have non-empty imageUrl from FLUX
 */
export const cards = sqliteTable('cards', {
  cardId: text('card_id').primaryKey(),
  brandId: text('brand_id').notNull().references(() => brands.brandId, { onDelete: 'cascade' }),
  influencerId: text('influencer_id').notNull().references(() => influencers.influencerId),
  personaId: text('persona_id').references(() => personas.personaId),
  environmentId: text('environment_id').references(() => environments.environmentId),
  query: text('query').notNull(),
  response: text('response').notNull(),
  imageUrl: text('image_url').notNull(),
  imageBrief: text('image_brief').notNull(),
  status: text('status').notNull().default('draft'), // draft, published, archived
  viewCount: integer('view_count').notNull().default(0),
  shareCount: integer('share_count').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
});

/**
 * WorkflowRun table - tracks execution of Mastra workflows
 * REQ-003: System shall track workflow execution and persistence
 */
export const workflowRuns = sqliteTable('workflow_runs', {
  runId: text('run_id').primaryKey(),
  workflowName: text('workflow_name').notNull(), // BrandOnboarding, CardGeneration, Publishing
  brandId: text('brand_id').references(() => brands.brandId, { onDelete: 'cascade' }),
  status: text('status').notNull(), // running, completed, failed
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  durationMs: integer('duration_ms'),
  input: text('input', { mode: 'json' }).$type<Record<string, any>>(),
  output: text('output', { mode: 'json' }).$type<Record<string, any>>(),
  error: text('error'),
});

// Type exports for TypeScript
export type Brand = typeof brands.$inferSelect;
export type NewBrand = typeof brands.$inferInsert;

export type Persona = typeof personas.$inferSelect;
export type NewPersona = typeof personas.$inferInsert;

export type Environment = typeof environments.$inferSelect;
export type NewEnvironment = typeof environments.$inferInsert;

export type Influencer = typeof influencers.$inferSelect;
export type NewInfluencer = typeof influencers.$inferInsert;

export type Card = typeof cards.$inferSelect;
export type NewCard = typeof cards.$inferInsert;

export type WorkflowRun = typeof workflowRuns.$inferSelect;
export type NewWorkflowRun = typeof workflowRuns.$inferInsert;
