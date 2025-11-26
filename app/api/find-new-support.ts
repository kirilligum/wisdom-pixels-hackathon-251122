import { z } from 'zod';

export const findNewRequestSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  domain: z.string().min(3).max(120).optional(),
  bio: z.string().min(10).max(400).optional(),
  brief: z.string().min(6).max(400).optional(),
});

const randomNames = [
  'Taylor Brooks',
  'Jasmine Carter',
  'Lena Ortiz',
  'Noah Kim',
  'Riley Thompson',
  'Aria Shah',
  'Mason Blake',
  'Kai Morgan',
  'Nova Quinn',
  'Sloane Hart',
];

const randomDomains = [
  'Wearable Training',
  'Recovery & Mobility',
  'Strength & Conditioning',
  'Endurance Coaching',
  'Functional Fitness',
  'Sports Physical Therapy',
  'Biomechanics & Form',
  'CrossFit Performance',
];

const defaultBriefs = [
  'evidence-based coaching that mixes wearables and smart recovery',
  'building sustainable training plans with motion capture feedback',
  'helping athletes avoid injury with mobility + strength programming',
  'pairing nutrition, sleep, and movement for performance gains',
  'using wearable sensors to coach form and cadence in real time',
];

export const buildBio = (name: string, domain: string, brief?: string) =>
  `${name} is a ${domain} creator focused on ${brief || 'using wearable motion feedback to drive safer, stronger training.'}`;

export const ensureUniqueName = (raw: string, existing: Set<string>) => {
  let name = raw.trim();
  let suffix = 2;
  while (existing.has(name.toLowerCase())) {
    name = `${raw.trim()} ${suffix++}`;
  }
  existing.add(name.toLowerCase());
  return name;
};

export const pickRandomCandidate = (existing: Set<string>) => {
  const raw = randomNames[Math.floor(Math.random() * randomNames.length)];
  const name = ensureUniqueName(raw, existing);
  const domain = randomDomains[Math.floor(Math.random() * randomDomains.length)];
  const brief = defaultBriefs[Math.floor(Math.random() * defaultBriefs.length)];
  return {
    name,
    domain,
    bio: buildBio(name, domain, brief),
  };
};
