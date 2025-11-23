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

    // 2. Create FlowForm-specific personas (ideal customers)
    console.log('\n👥 Creating personas...');
    const personas = await Promise.all([
      personasRepo.create({
        brandId: brand.brandId,
        label: 'WFH Yoga Creative',
        description:
          'Remote designer or content creator working from a small city apartment, using yoga and short flows to stay sane after long laptop days.',
        tags: ['remote-work', 'yoga-first', 'small-apartment', 'creative'],
      }),
      personasRepo.create({
        brandId: brand.brandId,
        label: 'Mid-Career Desk Worker with Stiff Back',
        description:
          '35–50 year old knowledge worker who sits in meetings all day, wants to fix a stiff back and tight hips with safer yoga and light strength.',
        tags: ['desk-bound', 'back-pain', 'light-strength', 'posture'],
      }),
      personasRepo.create({
        brandId: brand.brandId,
        label: 'Beginner Runner Who Loves Yoga',
        description:
          'Office worker training for a first 10K, already does yoga and wants their running form to feel as aligned and mindful as their mat practice.',
        tags: ['beginner-runner', 'yoga-cross-training', 'injury-prevention'],
      }),
      personasRepo.create({
        brandId: brand.brandId,
        label: 'Young Parent or Caregiver Squeezing In Workouts',
        description:
          'Juggling kids, caregiving, and work; can only manage short sessions at home and wants each 10–20 minutes of yoga or strength to be safe and effective.',
        tags: ['time-poor', 'home-workouts', 'efficiency', 'caregiver'],
      }),
    ]);
    console.log(`✅ Created ${personas.length} personas`);

    // 3. Create FlowForm-specific environments
    console.log('\n🏢 Creating environments...');
    const environments = await Promise.all([
      environmentsRepo.create({
        brandId: brand.brandId,
        label: 'NYC Apartment Yoga Corner',
        description:
          'A small New York City apartment living room with a yoga mat between the couch and coffee table, plants by the window, and just enough space to flow.',
        tags: ['nyc-apartment', 'small-space', 'yoga', 'indoor'],
      }),
      environmentsRepo.create({
        brandId: brand.brandId,
        label: 'City Track and Park Loop',
        description:
          'An urban running track and nearby park loop in the city, with skyline views and mixed pavement and path surfaces for easy runs and form drills.',
        tags: ['city-track', 'park-loop', 'running', 'outdoor'],
      }),
      environmentsRepo.create({
        brandId: brand.brandId,
        label: 'Clinic or Research Office with Standing Desk',
        description:
          'A bright clinic or research office where a movement specialist uses a standing desk, screens with simple joint diagrams, and a mat for demonstrations.',
        tags: ['clinic', 'research', 'standing-desk', 'demo-space'],
      }),
      environmentsRepo.create({
        brandId: brand.brandId,
        label: 'Compact Home Strength Corner',
        description:
          'A corner of a living room or garage with a mat, a few dumbbells, and a small rack—just enough space for squats, hinges, and simple strength circuits.',
        tags: ['home-gym', 'strength-corner', 'compact', 'indoor'],
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
