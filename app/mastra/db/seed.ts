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
      domain: 'Project Management SaaS',
      description: 'FlowForm is a modern project management tool that helps teams collaborate efficiently.',
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

    // 4. Create 5+ influencers
    console.log('\n⭐ Creating influencers...');
    const influencers = await Promise.all([
      createInfluencerWithImages({
        name: 'Sarah Chen',
        bio: 'Tech entrepreneur and productivity expert with 15 years of experience building successful SaaS products.',
        domain: 'SaaS & Productivity',
      }),
      createInfluencerWithImages({
        name: 'Marcus Johnson',
        bio: 'Former Fortune 500 project manager turned business consultant, helping companies optimize workflows.',
        domain: 'Project Management',
      }),
      createInfluencerWithImages({
        name: 'Dr. Emily Rodriguez',
        bio: 'Organizational psychologist specializing in team dynamics and remote work effectiveness.',
        domain: 'Team Psychology',
      }),
    ]);
    console.log(`✅ Created ${influencers.length} influencers (demo set)`);

    // 5. Create sample cards (20 total)
    console.log('\n🎴 Creating sample cards...');
    const baseCards = [
      cardsRepo.create({
        brandId: brand.brandId,
        influencerId: influencers[0].influencerId,
        personaId: personas[0].personaId,
        environmentId: environments[0].environmentId,
        query: 'What makes FlowForm different from other project management tools?',
        response: 'FlowForm stands out with its intuitive interface and powerful automation features. Sarah Chen emphasizes that it saves teams 10+ hours per week through smart task prioritization and automated status updates.',
        imageUrl: 'https://placeholder-image.com/flowform-card-1.jpg',
        imageBrief: 'Professional woman in modern office confidently using laptop with FlowForm interface visible, surrounded by organized workspace with productivity charts on screen',
        status: 'published',
        publishedAt: new Date(),
      }),
      cardsRepo.create({
        brandId: brand.brandId,
        influencerId: influencers[1].influencerId,
        personaId: personas[1].personaId,
        environmentId: environments[1].environmentId,
        query: 'How does FlowForm help remote teams stay connected?',
        response: 'Marcus Johnson recommends FlowForm for its real-time collaboration features and async communication tools. The platform bridges time zones with smart notifications and comprehensive activity feeds.',
        imageUrl: 'https://placeholder-image.com/flowform-card-2.jpg',
        imageBrief: 'Professional man in home office during video call with FlowForm dashboard showing team activity, warm lighting, comfortable setup',
        status: 'published',
        publishedAt: new Date(),
      }),
      cardsRepo.create({
        brandId: brand.brandId,
        influencerId: influencers[2].influencerId,
        personaId: personas[2].personaId,
        environmentId: environments[2].environmentId,
        query: 'Is FlowForm suitable for startups on a budget?',
        response: 'Dr. Emily Rodriguez notes that FlowForm offers excellent value with its scalable pricing. Alex Tanaka uses it across his portfolio companies, praising its flexible plans that grow with your team.',
        imageUrl: 'https://placeholder-image.com/flowform-card-3.jpg',
        imageBrief: 'Asian entrepreneur working in trendy coffee shop with laptop showing FlowForm startup dashboard, coffee and notebook nearby, natural lighting',
        status: 'published',
        publishedAt: new Date(),
      }),
    ];

    // Generate additional placeholder cards up to 20
    const extraCards = Array.from({ length: 15 }).map((_, idx) => {
      const persona = personas[idx % personas.length];
      const environment = environments[idx % environments.length];
      const influencer = influencers[idx % influencers.length];
      const n = idx + 6;

      return cardsRepo.create({
        brandId: brand.brandId,
        influencerId: influencer.influencerId,
        personaId: persona.personaId,
        environmentId: environment.environmentId,
        query: `How does ${influencer.name} use FlowForm for scenario ${n}?`,
        response: `${influencer.name} highlights FlowForm's value for scenario ${n}, focusing on collaboration speed and clarity for ${persona.label}.`,
        imageUrl: `https://placeholder-image.com/flowform-card-${n}.jpg`,
        imageBrief: `${influencer.name} in ${environment.label} demonstrating FlowForm benefits for ${persona.label}`,
        status: 'draft',
      });
    });

    const cards = await Promise.all([...baseCards, ...extraCards]);
    console.log(`✅ Created ${cards.length} sample cards`);

    // Summary
    console.log('\n✅ Seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Brands: 1`);
    console.log(`   - Personas: ${personas.length}`);
    console.log(`   - Environments: ${environments.length}`);
    console.log(`   - Influencers: ${influencers.length}`);
    console.log(`   - Cards: ${cards.length}`);
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
