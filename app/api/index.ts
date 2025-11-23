#!/usr/bin/env ts-node

/**
 * Wisdom Pixels REST API Entry Point (Hono + hot reload via tsx watch)
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { z } from 'zod';
import { cors } from 'hono/cors';
import { mastra } from '../mastra/index.js';
import { contentAgent } from '../mastra/agents/content-agent.js';
import { BrandsRepository } from '../mastra/db/repositories/brands.repository.js';
import { PersonasRepository } from '../mastra/db/repositories/personas.repository.js';
import { EnvironmentsRepository } from '../mastra/db/repositories/environments.repository.js';
import { CardsRepository } from '../mastra/db/repositories/cards.repository.js';
import { InfluencersRepository } from '../mastra/db/repositories/influencers.repository.js';
import { db } from '../mastra/db/client.js';
import { generateInfluencerImage, generateActionImages } from '../mastra/db/image-generation.js';
import type { Influencer } from '../mastra/db/schema.js';

const app = new Hono();
app.use('*', cors());

const brandsRepo = new BrandsRepository(db);
const personasRepo = new PersonasRepository(db);
const environmentsRepo = new EnvironmentsRepository(db);
const cardsRepo = new CardsRepository(db);
const influencersRepo = new InfluencersRepository(db);
const placeholderActions = (name: string) => [
  `https://placehold.co/600x800?text=${encodeURIComponent(name)}+A`,
  `https://placehold.co/600x800?text=${encodeURIComponent(name)}+B`,
];

async function ensureInfluencerGallery(inf: Influencer) {
  let headshot = inf.imageUrl;
  let actionImages = inf.actionImageUrls ?? [];

  if (!headshot) {
    headshot = await generateInfluencerImage(inf.name, inf.domain);
  }

  if (!actionImages || actionImages.length === 0) {
    try {
      actionImages = await generateActionImages(headshot, inf.name, inf.domain);
    } catch {
      actionImages = placeholderActions(inf.name);
    }
    await influencersRepo.update(inf.influencerId, { imageUrl: headshot, actionImageUrls: actionImages });
  }

  return { headshot, actionImages };
}

async function createInfluencerWithImages(data: { name: string; bio: string; domain: string }) {
  const headshot = await generateInfluencerImage(data.name, data.domain);
  const actionImageUrls = await generateActionImages(headshot, data.name, data.domain);
  return influencersRepo.create({ ...data, enabled: true, imageUrl: headshot, actionImageUrls });
}

const createBrandSchema = z.object({
  name: z.string().min(1),
  domain: z.string().min(1),
  contentSources: z.array(z.string()).optional().default([]),
});

const publishCardsSchema = z.object({
  cardIds: z.array(z.string().uuid()),
});

const updateInfluencerEnabledSchema = z.object({
  enabled: z.boolean(),
});

// Helpers
const parse = <T>(schema: z.ZodSchema<T>, data: unknown) => {
  const result = schema.safeParse(data);
  if (!result.success) throw new Error(JSON.stringify(result.error.issues));
  return result.data;
};

// Routes
app.post('/api/brands', async (c) => {
  const body = await c.req.json();
  const { name, domain, contentSources } = parse(createBrandSchema, body);

  const workflow = mastra.getWorkflow('brandOnboardingWorkflow');
  const run = await workflow.createRunAsync();
  const result = await run.start({ inputData: { brandName: name, domain, contentSources } });

  if (result.status !== 'succeeded') {
    return c.json({ error: 'Brand onboarding workflow failed', details: result.error }, 500);
  }

  const { brandId, personaCount, environmentCount, message } = result.result;
  const brand = await brandsRepo.findById(brandId);
  return c.json({ brand, personaCount, environmentCount, message }, 201);
});

app.get('/api/brands', async () => {
  const brands = await brandsRepo.findAll();
  return new Response(JSON.stringify({ brands }), { status: 200, headers: { 'Content-Type': 'application/json' } });
});

app.get('/api/brands/:brandId', async (c) => {
  const brandId = c.req.param('brandId');
  const brand = await brandsRepo.findById(brandId);
  if (!brand) return c.json({ error: 'Brand not found' }, 404);
  return c.json({ brand });
});

app.get('/api/brands/slug/:slug', async (c) => {
  const slug = c.req.param('slug');
  const brand = await brandsRepo.findBySlug(slug);
  if (!brand) return c.json({ error: 'Brand not found' }, 404);
  return c.json({ brand });
});

app.get('/api/brands/:brandId/personas', async (c) => {
  const brandId = c.req.param('brandId');
  const brand = await brandsRepo.findById(brandId);
  if (!brand) return c.json({ error: 'Brand not found' }, 404);
  const personas = await personasRepo.findByBrandId(brandId);
  return c.json({ personas });
});

app.get('/api/brands/:brandId/environments', async (c) => {
  const brandId = c.req.param('brandId');
  const brand = await brandsRepo.findById(brandId);
  if (!brand) return c.json({ error: 'Brand not found' }, 404);
  const environments = await environmentsRepo.findByBrandId(brandId);
  return c.json({ environments });
});
app.post('/api/brands/:brandId/images', async (c) => {
  const brandId = c.req.param('brandId');
  const body = await c.req.json();
  const url = body?.url;
  if (!url || typeof url !== 'string') return c.json({ error: 'url is required' }, 400);
  const brand = await brandsRepo.findById(brandId);
  if (!brand) return c.json({ error: 'Brand not found' }, 404);
  const updated = await brandsRepo.update(brandId, { productImages: [url] });
  return c.json({ brand: updated });
});

app.post('/api/brands/:brandId/cards/generate', async (c) => {
  const brandId = c.req.param('brandId');
  const brand = await brandsRepo.findById(brandId);
  if (!brand) return c.json({ error: 'Brand not found' }, 404);

  const workflow = mastra.getWorkflow('cardGenerationWorkflow');
  const run = await workflow.createRunAsync();
  const result = await run.start({ inputData: { brandId } });

  if (result.status !== 'succeeded') {
    return c.json({ error: 'Card generation workflow failed', details: result.error }, 500);
  }

  const { cardIds, totalGenerated, totalSkipped, message } = result.result;
  return c.json({ cardIds, totalGenerated, totalSkipped, message }, 201);
});

app.get('/api/brands/:brandId/cards', async (c) => {
  const brandId = c.req.param('brandId');
  const brand = await brandsRepo.findById(brandId);
  if (!brand) return c.json({ error: 'Brand not found' }, 404);
  const cards = await cardsRepo.findByBrandId(brandId, {});
  return c.json({ cards });
});

app.get('/api/cards/:cardId', async (c) => {
  const cardId = c.req.param('cardId');
  const card = await cardsRepo.findById(cardId);
  if (!card) return c.json({ error: 'Card not found' }, 404);
  return c.json({ card });
});

app.post('/api/cards/publish', async (c) => {
  const body = await c.req.json();
  const { cardIds } = parse(publishCardsSchema, body);

  const workflow = mastra.getWorkflow('publishingWorkflow');
  const run = await workflow.createRunAsync();
  const result = await run.start({ inputData: { cardIds } });

  if (result.status !== 'succeeded') {
    return c.json({ error: 'Publishing workflow failed', details: result.error }, 500);
  }

  const { publishedCount, failedCount, invalidCount, publishedCardIds, message } = result.result;
  return c.json({ publishedCount, failedCount, invalidCount, publishedCardIds, message });
});

app.post('/api/content/generate', async (c) => {
  const { prompt } = await c.req.json();
  if (!prompt || typeof prompt !== 'string') return c.json({ error: 'Prompt is required' }, 400);

  const response = await contentAgent.generate([{ role: 'user', content: prompt }]);
  return c.json({ text: response.text });
});

app.get('/api/influencers', async () => {
  const influencers = await influencersRepo.findAll();
  return new Response(JSON.stringify({ influencers }), { status: 200, headers: { 'Content-Type': 'application/json' } });
});

app.get('/api/influencers/:influencerId/gallery', async (c) => {
  const influencerId = c.req.param('influencerId');
  const inf = await influencersRepo.findById(influencerId);
  if (!inf) return c.json({ error: 'Influencer not found' }, 404);

  const { headshot, actionImages } = await ensureInfluencerGallery(inf);

  return c.json({ headshot, actionImages });
});

app.delete('/api/influencers/:influencerId', async (c) => {
  const influencerId = c.req.param('influencerId');
  const existing = await influencersRepo.findById(influencerId);
  if (!existing) return c.json({ error: 'Influencer not found' }, 404);
  // Remove dependent cards first to satisfy FK constraint
  await cardsRepo.deleteByInfluencerId(influencerId);
  await influencersRepo.delete(influencerId);
  return c.json({ success: true });
});

app.patch('/api/influencers/:influencerId/enabled', async (c) => {
  const influencerId = c.req.param('influencerId');
  const body = await c.req.json();
  const { enabled } = parse(updateInfluencerEnabledSchema, body);
  const updated = await influencersRepo.update(influencerId, { enabled });
  if (!updated) return c.json({ error: 'Influencer not found' }, 404);
  return c.json({ influencer: updated });
});

app.post('/api/influencers/find-new', async () => {
  console.log('[find-new] request received');
  const additionsPool = [
    {
      name: 'Jordan Lee',
      bio: 'Strength & conditioning coach focused on wearable-driven training plans.',
      domain: 'Strength & Conditioning',
    },
    {
      name: 'Priya Nair',
      bio: 'Fitness content creator specializing in mobility and injury prevention.',
      domain: 'Mobility & Recovery',
    },
    {
      name: 'Diego Alvarez',
      bio: 'Endurance athlete coaching runners on recovery and injury-free training.',
      domain: 'Endurance & Recovery',
    },
    {
      name: 'Mia Patel',
      bio: 'Yoga and mobility instructor focused on sustainable performance.',
      domain: 'Yoga & Mobility',
    },
  ];

  const all = await influencersRepo.findAll();
  console.log('[find-new] existing count', all.length);
  const existingNames = new Set(all.map(i => i.name));

  // Add exactly one new influencer per click if available
  const newCandidate = additionsPool.find((info) => !existingNames.has(info.name));
  if (newCandidate) {
    console.log('[find-new] adding new candidate', newCandidate.name);
    await createInfluencerWithImages(newCandidate);
  } else {
    console.log('[find-new] no new candidate available; returning current list');
  }

  const finalList = await influencersRepo.findEnabled();
  console.log('[find-new] final enabled count', finalList.length);
  return new Response(JSON.stringify({ influencers: finalList }), { status: 200, headers: { 'Content-Type': 'application/json' } });
});

app.get('/api/health', () => new Response(JSON.stringify({ status: 'ok', timestamp: Date.now() }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

app.onError((err, c) => {
  console.error('API Error:', err);
  return c.json({ error: 'Internal server error', message: err.message }, 500);
});

const port = Number(process.env.API_PORT || 3001);
console.log(`🚀 Hono API starting on http://localhost:${port}`);
serve({ fetch: app.fetch, port });
