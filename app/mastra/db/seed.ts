import {
  brandsRepo,
  personasRepo,
  environmentsRepo,
  influencersRepo,
  cardsRepo,
} from './repositories';
import { generateActionImages, generateInfluencerImage } from './image-generation';

async function createInfluencerWithImages(data: { name: string; bio: string; domain: string; enabled?: boolean }) {
  const headshot = await generateInfluencerImage(data.name, data.domain);
  const actionImageUrls = await generateActionImages(headshot, data.name, data.domain);
  const safeActionImages = actionImageUrls && actionImageUrls.length >= 2 ? actionImageUrls : [headshot, headshot];

  return influencersRepo.create({
    ...data,
    enabled: data.enabled ?? true,
    imageUrl: headshot,
    actionImageUrls: safeActionImages,
  });
}

/**
 * Seed database with FlowForm brand data
 * Based on PRD Section 7.1 - Data Contract Examples
 */
async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // 1. Create FlowForm brand
    console.log('\n📦 Creating FlowForm brand...');

    // If a FlowForm brand already exists, remove it for idempotent seed
    const existing = await brandsRepo.findBySlug('flowform');
    if (existing) {
      console.log(`Found existing FlowForm brand (${existing.brandId}), deleting for fresh seed...`);
      await brandsRepo.delete(existing.brandId);
    }

    const brand = await brandsRepo.create({
      name: 'FlowForm',
      domain: 'Smart motion suit for movement form',
      description: 'FlowForm Motion Suit: smart motion suit with ~10 sensors providing real-time form feedback for yoga, light strength, and running—designed for desk-bound knowledge workers who want better movement.',
      productImages: [],
      urlSlug: 'flowform',
      contentSources: [
        'https://flowform.example.com/about',
        'https://flowform.example.com/features',
        'https://flowform.example.com/blog',
      ],
    });
    console.log(`✅ Brand created: ${brand.name} (${brand.brandId})`);

    // 2. Create 3+ personas
    console.log('\n👥 Creating personas...');
    const personas = await Promise.all([
      personasRepo.create({
        brandId: brand.brandId,
        label: 'Busy Project Manager',
        description: 'A professional managing multiple projects simultaneously, needs efficient tools to stay organized and meet deadlines.',
        tags: ['time-constrained', 'results-driven', 'team-leader'],
      }),
      personasRepo.create({
        brandId: brand.brandId,
        label: 'Remote Team Lead',
        description: 'Leads a distributed team across time zones, relies on async communication and collaboration tools.',
        tags: ['remote-first', 'communication-focused', 'flexible'],
      }),
      personasRepo.create({
        brandId: brand.brandId,
        label: 'Startup Founder',
        description: 'Building a company from scratch, needs cost-effective solutions that scale with growth.',
        tags: ['budget-conscious', 'growth-minded', 'agile'],
      }),
      personasRepo.create({
        brandId: brand.brandId,
        label: 'Freelance Consultant',
        description: 'Works with multiple clients, needs to track various projects and maintain professional organization.',
        tags: ['multi-client', 'professional', 'organized'],
      }),
    ]);
    console.log(`✅ Created ${personas.length} personas`);

    // 3. Create 3+ environments
    console.log('\n🏢 Creating environments...');
    const environments = await Promise.all([
      environmentsRepo.create({
        brandId: brand.brandId,
        label: 'Modern Office',
        description: 'Contemporary workspace with collaborative areas and private focus zones.',
        tags: ['professional', 'collaborative', 'hybrid-work'],
      }),
      environmentsRepo.create({
        brandId: brand.brandId,
        label: 'Home Office',
        description: 'Comfortable remote workspace with desk setup and video conferencing capabilities.',
        tags: ['remote', 'comfortable', 'focused'],
      }),
      environmentsRepo.create({
        brandId: brand.brandId,
        label: 'Coffee Shop',
        description: 'Casual working environment with laptop and coffee, showing flexibility of modern work.',
        tags: ['flexible', 'casual', 'mobile'],
      }),
      environmentsRepo.create({
        brandId: brand.brandId,
        label: 'Conference Room',
        description: 'Professional meeting space for team collaboration and presentations.',
        tags: ['formal', 'team-oriented', 'presentation'],
      }),
    ]);
    console.log(`✅ Created ${environments.length} environments`);

    console.log('\n⭐ Skipping demo influencers (per request)');
    console.log('\n🎴 Skipping demo cards (no test influencers)');

    // Summary
    console.log('\n✅ Seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Brands: 1`);
    console.log(`   - Personas: ${personas.length}`);
    console.log(`   - Environments: ${environments.length}`);
    console.log(`   - Influencers: 0 (add via Find New in the app)`);
    console.log(`   - Cards: 0`);
    console.log(`\n🎯 Next steps:`);
    console.log(`   - View brand: http://localhost:5173/brand/flowform`);
    console.log(`   - Generate more cards using workflows`);
    console.log(`   - Test REST API endpoints\n`);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

export { seed };

// Only run when executed directly (not on import)
if (process.argv[1]?.includes('seed.ts')) {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
