import {
  brandsRepo,
  personasRepo,
  environmentsRepo,
  influencersRepo,
  cardsRepo,
} from './repositories';

/**
 * Seed database with FlowForm brand data
 * Based on PRD Section 7.1 - Data Contract Examples
 */
async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // 1. Create FlowForm brand
    console.log('\n📦 Creating FlowForm brand...');
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
      influencersRepo.create({
        name: 'Sarah Chen',
        bio: 'Tech entrepreneur and productivity expert with 15 years of experience building successful SaaS products.',
        domain: 'SaaS & Productivity',
        imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
        enabled: true,
      }),
      influencersRepo.create({
        name: 'Marcus Johnson',
        bio: 'Former Fortune 500 project manager turned business consultant, helping companies optimize workflows.',
        domain: 'Project Management',
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        enabled: true,
      }),
      influencersRepo.create({
        name: 'Dr. Emily Rodriguez',
        bio: 'Organizational psychologist specializing in team dynamics and remote work effectiveness.',
        domain: 'Team Psychology',
        imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
        enabled: true,
      }),
      influencersRepo.create({
        name: 'Alex Tanaka',
        bio: 'Serial entrepreneur and startup advisor, founder of three successful tech companies.',
        domain: 'Startups & Growth',
        imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
        enabled: true,
      }),
      influencersRepo.create({
        name: 'Lisa Williams',
        bio: 'Digital transformation expert helping enterprises adopt modern collaboration tools.',
        domain: 'Enterprise Tech',
        imageUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400',
        enabled: true,
      }),
    ]);
    console.log(`✅ Created ${influencers.length} influencers`);

    // 5. Create sample cards (5 initial cards)
    console.log('\n🎴 Creating sample cards...');
    const cards = await Promise.all([
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
      cardsRepo.create({
        brandId: brand.brandId,
        influencerId: influencers[3].influencerId,
        personaId: personas[3].personaId,
        environmentId: environments[3].environmentId,
        query: 'Can FlowForm handle multiple client projects simultaneously?',
        response: 'Alex Tanaka manages over 20 client projects using FlowForm. The multi-workspace feature and client portal make it perfect for consultants juggling various engagements.',
        imageUrl: 'https://placeholder-image.com/flowform-card-4.jpg',
        imageBrief: 'Professional person presenting FlowForm project overview in conference room with multiple client workspaces visible on large screen, engaged audience',
        status: 'draft',
      }),
      cardsRepo.create({
        brandId: brand.brandId,
        influencerId: influencers[4].influencerId,
        personaId: personas[0].personaId,
        environmentId: environments[0].environmentId,
        query: 'How does FlowForm integrate with existing enterprise tools?',
        response: 'Lisa Williams has helped Fortune 500 companies adopt FlowForm seamlessly. With 50+ integrations including Slack, Microsoft Teams, and Salesforce, it fits right into your existing workflow.',
        imageUrl: 'https://placeholder-image.com/flowform-card-5.jpg',
        imageBrief: 'Professional woman in corporate office demonstrating FlowForm enterprise integrations on multiple monitors, showing connected tools and workflows',
        status: 'draft',
      }),
    ]);
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

// Run seed if executed directly
seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
