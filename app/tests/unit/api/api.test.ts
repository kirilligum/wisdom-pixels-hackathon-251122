import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express, { Express } from 'express';
import cors from 'cors';
import { z } from 'zod';
import { setupTestDb, type TestDatabase } from '../../helpers/db-test-helper';

/**
 * Phase M5: API Tests
 *
 * Tests for REST API endpoints
 * Note: These tests use a simplified test app without workflow integration
 * to avoid dependencies on external services
 */

describe('Phase M5: REST API', () => {
  let app: Express;
  let testDb: TestDatabase;
  let brandsRepo: TestDatabase['repos']['brands'];
  let personasRepo: TestDatabase['repos']['personas'];
  let environmentsRepo: TestDatabase['repos']['environments'];
  let cardsRepo: TestDatabase['repos']['cards'];
  let influencersRepo: TestDatabase['repos']['influencers'];

  beforeAll(() => {
    // Initialize isolated in-memory test DB
    testDb = setupTestDb();
    brandsRepo = testDb.repos.brands;
    personasRepo = testDb.repos.personas;
    environmentsRepo = testDb.repos.environments;
    cardsRepo = testDb.repos.cards;
    influencersRepo = testDb.repos.influencers;

    // Create a simplified test app
    app = express();
    app.use(cors());
    app.use(express.json());

    // Health endpoint
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', timestamp: Date.now() });
    });

    // Get brand
    app.get('/api/brands/:brandId', async (req, res) => {
      try {
        const brand = await brandsRepo.findById(req.params.brandId);
        if (!brand) {
          return res.status(404).json({ error: 'Brand not found' });
        }
        res.json({ brand });
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Get personas
    app.get('/api/brands/:brandId/personas', async (req, res) => {
      try {
        const personas = await personasRepo.findByBrandId(req.params.brandId);
        res.json({ personas });
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Get environments
    app.get('/api/brands/:brandId/environments', async (req, res) => {
      try {
        const environments = await environmentsRepo.findByBrandId(req.params.brandId);
        res.json({ environments });
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Get cards
    app.get('/api/brands/:brandId/cards', async (req, res) => {
      try {
        const filters = {
          status: req.query.status as string,
          influencerId: req.query.influencerId as string,
          personaId: req.query.personaId as string,
          environmentId: req.query.environmentId as string,
        };
        const cards = await cardsRepo.findByBrandId(req.params.brandId, filters);
        res.json({ cards });
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Get card
    app.get('/api/cards/:cardId', async (req, res) => {
      try {
        const card = await cardsRepo.findById(req.params.cardId);
        if (!card) {
          return res.status(404).json({ error: 'Card not found' });
        }
        res.json({ card });
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Upload product image (replace)
    app.post('/api/brands/:brandId/images', async (req, res) => {
      try {
        const url = req.body?.url;
        if (!url || typeof url !== 'string') {
          return res.status(400).json({ error: 'url is required' });
        }
        const brand = await brandsRepo.findById(req.params.brandId);
        if (!brand) {
          return res.status(404).json({ error: 'Brand not found' });
        }
        const updated = await brandsRepo.update(req.params.brandId, { productImages: [url] });
        res.json({ brand: updated });
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  });

  afterAll(() => {
    testDb.cleanup();
  });

  describe('Health Check', () => {
    test('TEST-M5-101: GET /api/health should return ok status', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('Brand Endpoints', () => {
    test('TEST-M5-201: GET /api/brands/:brandId should return brand', async () => {
      // Create test brand
      const brand = await brandsRepo.create({
        name: 'Test Brand',
        domain: 'Test Domain',
        urlSlug: `test-brand-api-${Date.now()}`,
        contentSources: ['https://test.com'],
      });

      const response = await request(app).get(`/api/brands/${brand.brandId}`);

      expect(response.status).toBe(200);
      expect(response.body.brand).toBeDefined();
      expect(response.body.brand.name).toBe('Test Brand');
      expect(response.body.brand.brandId).toBe(brand.brandId);
    });

    test('TEST-M5-202: GET /api/brands/:brandId should return 404 for nonexistent brand', async () => {
      const response = await request(app).get('/api/brands/nonexistent-id');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Brand not found');
    });

    test('TEST-M5-203: GET /api/brands/:brandId/personas should return personas', async () => {
      const brand = await brandsRepo.create({
        name: 'Test Brand 2',
        domain: 'Domain',
        urlSlug: `test-brand-2-api-${Date.now()}`,
        contentSources: [],
      });

      await personasRepo.create({
        brandId: brand.brandId,
        label: 'Persona 1',
        description: 'Description',
        tags: ['tag1'],
      });

      await personasRepo.create({
        brandId: brand.brandId,
        label: 'Persona 2',
        description: 'Description',
        tags: ['tag2'],
      });

      const response = await request(app).get(`/api/brands/${brand.brandId}/personas`);

      expect(response.status).toBe(200);
      expect(response.body.personas).toBeDefined();
      expect(response.body.personas).toHaveLength(2);
    });

    test('TEST-M5-204: GET /api/brands/:brandId/environments should return environments', async () => {
      const brand = await brandsRepo.create({
        name: 'Test Brand 3',
        domain: 'Domain',
        urlSlug: `test-brand-3-api-${Date.now()}`,
        contentSources: [],
      });

      await environmentsRepo.create({
        brandId: brand.brandId,
        label: 'Environment 1',
        description: 'Description',
        tags: ['tag1'],
      });

      const response = await request(app).get(`/api/brands/${brand.brandId}/environments`);

      expect(response.status).toBe(200);
      expect(response.body.environments).toBeDefined();
      expect(response.body.environments.length).toBeGreaterThan(0);
    });

    test('TEST-M5-205: GET /api/brands/:brandId/cards should return cards with filters', async () => {
      const brand = await brandsRepo.create({
        name: 'Test Brand 4',
        domain: 'Domain',
        urlSlug: `test-brand-4-api-${Date.now()}`,
        contentSources: [],
      });

      const influencer = await influencersRepo.create({
        name: 'Test Influencer',
        bio: 'Bio',
        domain: 'Domain',
        imageUrl: 'url',
      });

      await cardsRepo.create({
        brandId: brand.brandId,
        influencerId: influencer.influencerId,
        query: 'Question 1',
        response: 'Answer 1',
        imageUrl: 'url',
        imageBrief: 'brief',
      });

      await cardsRepo.create({
        brandId: brand.brandId,
        influencerId: influencer.influencerId,
        query: 'Question 2',
        response: 'Answer 2',
        imageUrl: 'url',
        imageBrief: 'brief',
      });

      const response = await request(app).get(`/api/brands/${brand.brandId}/cards?status=draft`);

      expect(response.status).toBe(200);
      expect(response.body.cards).toBeDefined();
      expect(response.body.cards.length).toBeGreaterThanOrEqual(2);
    });

    test('TEST-M5-206: POST /api/brands/:brandId/images should overwrite product image', async () => {
      const brand = await brandsRepo.create({
        name: 'Test Brand Upload',
        domain: 'Domain',
        urlSlug: `test-brand-upload-${Date.now()}`,
        contentSources: [],
      });

      // first upload
      let response = await request(app)
        .post(`/api/brands/${brand.brandId}/images`)
        .send({ url: 'data:image/png;base64,AAA' });

      expect(response.status).toBe(200);
      expect(response.body.brand.productImages).toEqual(['data:image/png;base64,AAA']);

      // second upload should replace the first
      response = await request(app)
        .post(`/api/brands/${brand.brandId}/images`)
        .send({ url: 'data:image/png;base64,BBB' });

      expect(response.status).toBe(200);
      expect(response.body.brand.productImages).toEqual(['data:image/png;base64,BBB']);
    });
  });

  describe('Card Endpoints', () => {
    test('TEST-M5-301: GET /api/cards/:cardId should return card', async () => {
      const brand = await brandsRepo.create({
        name: 'Test Brand 5',
        domain: 'Domain',
        urlSlug: `test-brand-5-api-${Date.now()}`,
        contentSources: [],
      });

      const influencer = await influencersRepo.create({
        name: 'Test Influencer 2',
        bio: 'Bio',
        domain: 'Domain',
        imageUrl: 'url',
      });

      const card = await cardsRepo.create({
        brandId: brand.brandId,
        influencerId: influencer.influencerId,
        query: 'Test Question',
        response: 'Test Answer',
        imageUrl: 'url',
        imageBrief: 'brief',
      });

      const response = await request(app).get(`/api/cards/${card.cardId}`);

      expect(response.status).toBe(200);
      expect(response.body.card).toBeDefined();
      expect(response.body.card.query).toBe('Test Question');
      expect(response.body.card.cardId).toBe(card.cardId);
    });

    test('TEST-M5-302: GET /api/cards/:cardId should return 404 for nonexistent card', async () => {
      const response = await request(app).get('/api/cards/nonexistent-card-id');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Card not found');
    });
  });

  describe('Error Handling', () => {
    test('TEST-M5-401: Should handle invalid route with 404', async () => {
      const response = await request(app).get('/api/invalid-route');

      expect(response.status).toBe(404);
    });
  });
});
