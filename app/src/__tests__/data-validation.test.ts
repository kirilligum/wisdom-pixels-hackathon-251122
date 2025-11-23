/**
 * Data validation tests for FlowForm seed data
 * TEST-301 to TEST-306: Verify all data integrity constraints
 */

import flowformData from '../data/flowform-seed.json';
import type { BrandData, Card, Influencer } from '../types';

const data = flowformData as BrandData;

describe('Data Validation Tests', () => {
  describe('TEST-301: Card references are valid', () => {
    test('all card personaIds reference existing personas', () => {
      const personaIds = new Set(data.personas.map(p => p.id));

      data.cards.forEach(card => {
        expect(personaIds.has(card.personaId)).toBe(true);
        expect(card.personaId).toBeTruthy();
      });
    });

    test('all card influencerIds reference existing influencers', () => {
      const influencerIds = new Set(data.influencers.map(i => i.id));

      data.cards.forEach(card => {
        expect(influencerIds.has(card.influencerId)).toBe(true);
        expect(card.influencerId).toBeTruthy();
      });
    });

    test('all card environmentIds (if present) reference existing environments', () => {
      const environmentIds = new Set(data.environments.map(e => e.id));

      data.cards.forEach(card => {
        if (card.environmentId) {
          expect(environmentIds.has(card.environmentId)).toBe(true);
        }
      });
    });

    test('all cards reference the correct brandId', () => {
      const brandId = data.brand.id;

      data.cards.forEach(card => {
        expect(card.brandId).toBe(brandId);
      });
    });
  });

  describe('TEST-302: Card queries mention influencer names', () => {
    test('every card query contains the influencer name', () => {
      data.cards.forEach(card => {
        const influencer = data.influencers.find(i => i.id === card.influencerId);
        expect(influencer).toBeDefined();

        if (influencer) {
          // Case-insensitive check for influencer name in query
          const queryLower = card.query.toLowerCase();
          const nameLower = influencer.name.toLowerCase();

          expect(queryLower).toContain(nameLower);
        }
      });
    });
  });

  describe('TEST-303: Card image URLs are non-empty', () => {
    test('all card imageUrls are non-empty strings', () => {
      data.cards.forEach(card => {
        expect(card.imageUrl).toBeTruthy();
        expect(typeof card.imageUrl).toBe('string');
        expect(card.imageUrl.length).toBeGreaterThan(0);
      });
    });

    test('all card imageUrls are valid paths', () => {
      data.cards.forEach(card => {
        // Check that imageUrl looks like a path (starts with / or http)
        expect(
          card.imageUrl.startsWith('/') ||
          card.imageUrl.startsWith('http')
        ).toBe(true);
      });
    });
  });

  describe('TEST-304: Card URLs are unique and stable', () => {
    test('all card URLs are unique', () => {
      const urls = data.cards.map(c => c.url);
      const uniqueUrls = new Set(urls);

      expect(uniqueUrls.size).toBe(urls.length);
    });

    test('all card URLs follow the expected pattern', () => {
      data.cards.forEach(card => {
        // URLs should be in format /cards/{cardId}
        expect(card.url).toMatch(/^\/cards\/[a-zA-Z0-9_-]+$/);
      });
    });

    test('card URLs match card IDs', () => {
      data.cards.forEach(card => {
        const expectedUrl = `/cards/${card.id}`;
        expect(card.url).toBe(expectedUrl);
      });
    });
  });

  describe('TEST-305: Influencer ages and profiles are diverse and synthetic', () => {
    test('all influencers are marked as synthetic', () => {
      data.influencers.forEach(influencer => {
        expect(influencer.synthetic).toBe(true);
      });
    });

    test('first influencer is in 30s age range', () => {
      const firstInfluencer = data.influencers[0];
      expect(firstInfluencer).toBeDefined();
      expect(firstInfluencer.ageRange).toMatch(/3[0-9]/); // Contains 30-something
    });

    test('influencers have diverse age ranges', () => {
      const ageRanges = data.influencers.map(i => i.ageRange);
      const uniqueAgeRanges = new Set(ageRanges);

      // Should have at least 4 different age ranges for diversity
      expect(uniqueAgeRanges.size).toBeGreaterThanOrEqual(4);
    });

    test('all influencers have required profile fields', () => {
      data.influencers.forEach(influencer => {
        expect(influencer.name).toBeTruthy();
        expect(influencer.ageRange).toBeTruthy();
        expect(influencer.role).toBeTruthy();
        expect(influencer.bioShort).toBeTruthy();
        expect(Array.isArray(influencer.tags)).toBe(true);
        expect(influencer.tags.length).toBeGreaterThan(0);
      });
    });

    test('at least 5 influencer instances exist', () => {
      expect(data.influencers.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('TEST-306: No medical claims in text', () => {
    const medicalClaimWords = [
      '\\bcure\\b', '\\bcures\\b', '\\bcuring\\b',
      '\\btreat\\b', '\\btreats\\b', '\\btreatment\\b', '\\btreating\\b',
      '\\bdiagnose\\b', '\\bdiagnosis\\b',
      '\\bdisease\\b', '\\bdiseases\\b',
      '\\bheal\\b', '\\bheals\\b', '\\bhealing\\b',
      '\\btherapy\\b', '\\btherapies\\b',
      'medical condition'
    ];

    test('card queries contain no medical claims', () => {
      data.cards.forEach(card => {
        const queryLower = card.query.toLowerCase();

        medicalClaimWords.forEach(pattern => {
          const regex = new RegExp(pattern, 'i');
          expect(regex.test(queryLower)).toBe(false);
        });
      });
    });

    test('card responses contain no medical claims', () => {
      data.cards.forEach(card => {
        const responseLower = card.response.toLowerCase();

        medicalClaimWords.forEach(pattern => {
          const regex = new RegExp(pattern, 'i');
          expect(regex.test(responseLower)).toBe(false);
        });
      });
    });

    test('responses emphasize awareness and feedback, not treatment', () => {
      // Check that responses use appropriate language
      const appropriateTerms = ['awareness', 'feedback', 'form', 'notice', 'movement'];

      data.cards.forEach(card => {
        const responseLower = card.response.toLowerCase();

        // At least one appropriate term should be present
        const hasAppropriateTerm = appropriateTerms.some(term =>
          responseLower.includes(term)
        );

        expect(hasAppropriateTerm).toBe(true);
      });
    });
  });

  describe('Additional data integrity checks', () => {
    test('exactly 20 cards exist as per requirement REQ-014', () => {
      expect(data.cards.length).toBe(20);
    });

    test('exactly 4 personas exist', () => {
      expect(data.personas.length).toBe(4);
    });

    test('at least 3 environments exist', () => {
      expect(data.environments.length).toBeGreaterThanOrEqual(3);
    });

    test('all required data structures are present', () => {
      expect(data.brand).toBeDefined();
      expect(data.personas).toBeDefined();
      expect(data.environments).toBeDefined();
      expect(data.influencers).toBeDefined();
      expect(data.cards).toBeDefined();
    });
  });
});
