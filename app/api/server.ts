import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { z } from 'zod';
import { mastra } from '../mastra/index.js';
import { contentAgent } from '../mastra/agents/content-agent.js';
import { BrandsRepository } from '../mastra/db/repositories/brands.repository.js';
import { PersonasRepository } from '../mastra/db/repositories/personas.repository.js';
import { EnvironmentsRepository } from '../mastra/db/repositories/environments.repository.js';
import { CardsRepository } from '../mastra/db/repositories/cards.repository.js';
import { InfluencersRepository } from '../mastra/db/repositories/influencers.repository.js';
import { db } from '../mastra/db/client.js';

/**
 * REST API Server for Wisdom Pixels
 *
 * 10 Endpoints:
 * 1. POST /api/brands - Create brand + run BrandOnboardingWorkflow
 * 2. GET /api/brands/:brandId - Get brand details
 * 3. GET /api/brands/:brandId/personas - List personas
 * 4. GET /api/brands/:brandId/environments - List environments
 * 5. POST /api/brands/:brandId/cards/generate - Run CardGenerationWorkflow
 * 6. GET /api/brands/:brandId/cards - List cards (with filters)
 * 7. GET /api/cards/:cardId - Get card details
 * 8. POST /api/cards/publish - Run PublishingWorkflow
 * 9. POST /api/content/generate - Proxy content agent for frontend
 * 10. GET /api/influencers - List influencers
 */

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize repositories
const brandsRepo = new BrandsRepository(db);
const personasRepo = new PersonasRepository(db);
const environmentsRepo = new EnvironmentsRepository(db);
const cardsRepo = new CardsRepository(db);
const influencersRepo = new InfluencersRepository(db);

// Zod schemas for validation
const createBrandSchema = z.object({
  name: z.string().min(1),
  domain: z.string().min(1),
  contentSources: z.array(z.string()).optional().default([]),
});

// Optional slug lookup
const slugSchema = z.object({ slug: z.string().min(1) });

const generateCardsSchema = z.object({
  brandId: z.string().uuid(),
});

const publishCardsSchema = z.object({
  cardIds: z.array(z.string().uuid()),
});

// Error handling middleware
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 1. POST /api/brands - Create brand + run BrandOnboardingWorkflow
app.post('/api/brands', asyncHandler(async (req: Request, res: Response) => {
  const validation = createBrandSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: validation.error.errors,
    });
  }

  const { name, domain, contentSources } = validation.data;

  // Get workflow and create run
  const workflow = mastra.getWorkflow('brandOnboardingWorkflow');
  const run = await workflow.createRunAsync();

  // Start workflow
  const result = await run.start({
    inputData: {
      brandName: name,
      domain,
      contentSources,
    },
  });

  if (result.status === 'failed') {
    return res.status(500).json({
      error: 'Brand onboarding workflow failed',
      details: result.error,
    });
  }

  if (result.status === 'suspended') {
    return res.status(500).json({
      error: 'Workflow suspended unexpectedly',
    });
  }

  // Get the brand from the result
  const { brandId, personaCount, environmentCount, message } = result.result;

  const brand = await brandsRepo.findById(brandId);

  return res.status(201).json({
    brand,
    personaCount,
    environmentCount,
    message,
  });
}));

// 2. GET /api/brands/:brandId - Get brand details
app.get('/api/brands/:brandId', asyncHandler(async (req: Request, res: Response) => {
  const { brandId } = req.params;

  const brand = await brandsRepo.findById(brandId);

  if (!brand) {
    return res.status(404).json({
      error: 'Brand not found',
    });
  }

  return res.json({ brand });
}));

// 2b. GET /api/brands - list all brands
app.get('/api/brands', asyncHandler(async (_req: Request, res: Response) => {
  const brands = await brandsRepo.findAll();
  return res.json({ brands });
}));

// 2c. GET /api/brands/slug/:slug - find brand by slug
app.get('/api/brands/slug/:slug', asyncHandler(async (req: Request, res: Response) => {
  const validation = slugSchema.safeParse(req.params);
  if (!validation.success) {
    return res.status(400).json({ error: 'Invalid slug' });
  }

  const brand = await brandsRepo.findBySlug(validation.data.slug);
  if (!brand) {
    return res.status(404).json({ error: 'Brand not found' });
  }

  return res.json({ brand });
}));

// 3. GET /api/brands/:brandId/personas - List personas
app.get('/api/brands/:brandId/personas', asyncHandler(async (req: Request, res: Response) => {
  const { brandId } = req.params;

  // Check brand exists
  const brand = await brandsRepo.findById(brandId);
  if (!brand) {
    return res.status(404).json({
      error: 'Brand not found',
    });
  }

  const personas = await personasRepo.findByBrandId(brandId);

  return res.json({ personas });
}));

// 4. GET /api/brands/:brandId/environments - List environments
app.get('/api/brands/:brandId/environments', asyncHandler(async (req: Request, res: Response) => {
  const { brandId } = req.params;

  // Check brand exists
  const brand = await brandsRepo.findById(brandId);
  if (!brand) {
    return res.status(404).json({
      error: 'Brand not found',
    });
  }

  const environments = await environmentsRepo.findByBrandId(brandId);

  return res.json({ environments });
}));

// 5. POST /api/brands/:brandId/cards/generate - Run CardGenerationWorkflow
app.post('/api/brands/:brandId/cards/generate', asyncHandler(async (req: Request, res: Response) => {
  const { brandId } = req.params;

  // Check brand exists
  const brand = await brandsRepo.findById(brandId);
  if (!brand) {
    return res.status(404).json({
      error: 'Brand not found',
    });
  }

  // Get workflow and create run
  const workflow = mastra.getWorkflow('cardGenerationWorkflow');
  const run = await workflow.createRunAsync();

  // Start workflow
  const result = await run.start({
    inputData: {
      brandId,
    },
  });

  if (result.status === 'failed') {
    return res.status(500).json({
      error: 'Card generation workflow failed',
      details: result.error,
    });
  }

  if (result.status === 'suspended') {
    return res.status(500).json({
      error: 'Workflow suspended unexpectedly',
    });
  }

  const { cardIds, totalGenerated, totalSkipped, message } = result.result;

  return res.status(201).json({
    cardIds,
    totalGenerated,
    totalSkipped,
    message,
  });
}));

// 6. GET /api/brands/:brandId/cards - List cards (with filters)
app.get('/api/brands/:brandId/cards', asyncHandler(async (req: Request, res: Response) => {
  const { brandId } = req.params;
  const { status, influencerId, personaId, environmentId } = req.query;

  // Check brand exists
  const brand = await brandsRepo.findById(brandId);
  if (!brand) {
    return res.status(404).json({
      error: 'Brand not found',
    });
  }

  const cards = await cardsRepo.findByBrandId(brandId, {
    status: status as string | undefined,
    influencerId: influencerId as string | undefined,
    personaId: personaId as string | undefined,
    environmentId: environmentId as string | undefined,
  });

  return res.json({ cards });
}));

// 7. GET /api/cards/:cardId - Get card details
app.get('/api/cards/:cardId', asyncHandler(async (req: Request, res: Response) => {
  const { cardId } = req.params;

  const card = await cardsRepo.findById(cardId);

  if (!card) {
    return res.status(404).json({
      error: 'Card not found',
    });
  }

  return res.json({ card });
}));

// 8. POST /api/cards/publish - Run PublishingWorkflow
app.post('/api/cards/publish', asyncHandler(async (req: Request, res: Response) => {
  const validation = publishCardsSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: validation.error.errors,
    });
  }

  const { cardIds } = validation.data;

  // Get workflow and create run
  const workflow = mastra.getWorkflow('publishingWorkflow');
  const run = await workflow.createRunAsync();

  // Start workflow
  const result = await run.start({
    inputData: {
      cardIds,
    },
  });

  if (result.status === 'failed') {
    return res.status(500).json({
      error: 'Publishing workflow failed',
      details: result.error,
    });
  }

  if (result.status === 'suspended') {
    return res.status(500).json({
      error: 'Workflow suspended unexpectedly',
    });
  }

  const { publishedCount, failedCount, invalidCount, publishedCardIds, message } = result.result;

  return res.json({
    publishedCount,
    failedCount,
    invalidCount,
    publishedCardIds,
    message,
  });
}));

// 9. POST /api/content/generate - simple proxy to contentAgent for FE AI tab
app.post('/api/content/generate', asyncHandler(async (req: Request, res: Response) => {
  const { prompt } = req.body ?? {};

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const response = await contentAgent.generate([
    { role: 'user', content: prompt },
  ]);

  return res.json({ text: response.text });
}));

// 10. GET /api/influencers - list all influencers
app.get('/api/influencers', asyncHandler(async (_req: Request, res: Response) => {
  const influencers = await influencersRepo.findAll();
  return res.json({ influencers });
}));

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('API Error:', err);

  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
const PORT = process.env.API_PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`🚀 Wisdom Pixels API server running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
});

export { app, server };
