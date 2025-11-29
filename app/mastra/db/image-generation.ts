const pickImageUrl = (img: any) => {
  const candidates = [img?.url, img?.image_url, img?.imageUrl, img?.data];
  for (const candidate of candidates) {
    if (typeof candidate !== 'string') continue;
    const trimmed = candidate.trim();
    if (!trimmed) continue;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
  }
  return null;
};

export async function generateInfluencerImage(name: string, domain: string, falKey?: string): Promise<string> {
  falKey = falKey || process.env.FAL_KEY || process.env.FALAI_API_KEY;
  if (!falKey) throw new Error('FAL key required for headshot');

  try {
    console.log(`[image-gen] headshot start for ${name} (${domain})`);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45000);
    const resp = await fetch('https://fal.run/fal-ai/nano-banana-pro', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${falKey}`,
      },
      body: JSON.stringify({
        prompt: `Photorealistic headshot portrait of ${name}, ${domain} expert, shoulders-up, single subject, neutral backdrop, sharp focus, high quality`,
        num_images: 1,
        aspect_ratio: '1:1',
        output_format: 'png',
        resolution: '1K',
        sync_mode: true,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!resp.ok) {
      const text = await resp.text().catch(() => resp.statusText);
      throw new Error(`fal headshot failed: ${resp.status} ${text}`);
    }
    const result: any = await resp.json();

    // Historical note:
    // This helper originally used FLUX 2 / Alpha Image 232 with a
    // flux/schnell → alpha-image-232 fallback. That endpoint is no
    // longer available; the old calls are kept here as commented
    // reference for potential future re-enablement.
    //
    // let result: any;
    // try {
    //   result = await fal.subscribe('fal-ai/flux/schnell', {
    //     input: {
    //       prompt: `Photorealistic headshot portrait of ${name}, ${domain} expert, professional studio lighting, neutral background, sharp focus, high quality`,
    //       image_size: 'square',
    //       num_images: 1,
    //     },
    //     logs: false,
    //   });
    // } catch (fluxError) {
    //   console.warn(`[image-gen] flux/schnell failed for ${name}, trying alpha-image-232:`, fluxError);
    //   result = await fal.subscribe('fal-ai/alpha-image-232/text-to-image', {
    //     input: {
    //       prompt: `Photorealistic headshot of ${name}, ${domain} expert, professional studio lighting, neutral background, sharp focus`,
    //     },
    //     logs: false,
    //   });
    // }

    const img = result?.data?.images?.[0] || result?.images?.[0];
    const url = pickImageUrl(img);
    if (!url) throw new Error('Headshot URL missing from fal response');
    console.log(`[image-gen] headshot done for ${name}: ${url}`);
    return url;
  } catch (e) {
    console.error('Image generation failed:', e);
    throw e;
  }
}

// Combined helper to fetch portrait + action variants in a single call to stay
// within edge subrequest limits. Returns [portrait, ...actions].
export async function generateInfluencerImageSet(
  name: string,
  domain: string,
  falKey?: string,
  count: number = 3
): Promise<string[]> {
  falKey = falKey || process.env.FAL_KEY || process.env.FALAI_API_KEY;
  if (!falKey) throw new Error('FAL key required for influencer images');
  const numImages = Math.max(1, Math.min(count, 4));
  const prompt = `Photorealistic set of ${numImages} standalone images of ${name}, a ${domain} creator wearing a wearable motion suit. Each output must be a single continuous frame (no collage, no split panels, no grid). Image 1: tight portrait/headshot, shoulders-up, single subject, neutral backdrop, sharp. Remaining images: full-body single-subject action in gym/park/yoga contexts, one person only, no multi-panel, no collage, clear view of suit sensors. High detail, sharp, 4k.`;

  const { fal } = await import('@fal-ai/client');
  fal.config({ credentials: falKey });

  const result: any = await fal.subscribe('fal-ai/nano-banana-pro', {
    input: {
      prompt,
      num_images: numImages,
      aspect_ratio: '1:1',
      output_format: 'png',
      resolution: '1K',
    },
    logs: false,
  });

  const imgs = result?.data?.images || result?.images || [];
  const urls =
    imgs.length > 0
      ? (imgs.map((i: any) => pickImageUrl(i)).filter(Boolean) as string[])
      : [];
  if (urls.length === 0) throw new Error('Influencer image set missing URLs');
  return urls;
}

export async function generateActionImages(headshotUrl: string, name: string, domain: string, falKey?: string): Promise<string[]> {
  falKey = falKey || process.env.FAL_KEY || process.env.FALAI_API_KEY;
  if (!falKey) throw new Error('FAL key required for action images');
  if (!headshotUrl) throw new Error('Headshot required for action images');

  try {
    console.log(`[image-gen] action start (2 edits) for ${name}`);
    const prompts = [
      `Full-body photo of ${name}, ${domain} influencer, wearing a wearable motion suit, modern gym scene, dynamic strength move, single subject, single frame, no collage, no split panels, photorealistic, 4k`,
      `Full-body photo of ${name}, ${domain} influencer, wearing a wearable motion suit, outdoor fitness (park/yoga/run), natural light, single subject, single frame, no collage, no split panels, photorealistic, 4k`,
    ];
    const urls: string[] = [];
    for (const prompt of prompts) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 45000);
      try {
        const resp = await fetch('https://fal.run/fal-ai/nano-banana-pro/edit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Key ${falKey}`,
          },
          body: JSON.stringify({
            prompt,
            num_images: 1,
            aspect_ratio: 'auto',
            output_format: 'png',
            resolution: '1K',
            image_urls: [headshotUrl],
            sync_mode: true,
          }),
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (!resp.ok) {
          const text = await resp.text().catch(() => resp.statusText);
          throw new Error(`fal action failed: ${resp.status} ${text}`);
        }
        const json: any = await resp.json();
        const img = json?.images?.[0] || json?.data?.images?.[0];
        const url = pickImageUrl(img);
        if (!url) throw new Error('no action url returned');
        urls.push(url);
      } finally {
        // timeout cleared above
      }
    }
    console.log(`[image-gen] action images success for ${name}: ${urls.length} images`);
    return urls;
  } catch (e) {
    console.error('Action image generation failed:', e);
    throw e;
  }
}

export async function generateCardImage(params: {
  influencerName: string;
  influencerDomain: string;
  brandName: string;
  brandDescription?: string;
  query: string;
  falKey?: string;
}): Promise<string> {
  const falKey = params.falKey || process.env.FAL_KEY || process.env.FALAI_API_KEY;
  if (!falKey) throw new Error('FAL key required for card image');
  const { influencerName, influencerDomain, brandName, brandDescription, query } = params;

  const prompt = `Photorealistic cinematic action shot of ${influencerName}, a ${influencerDomain} creator, using the ${brandName} wearable motion suit in the environment implied by: "${query}". Show the product clearly (sensors, suit detail) and the environment context. Include cues from: ${brandDescription || 'motion capture suit for training and recovery'}. Dynamic lighting, sharp detail, 4k.`;

  try {
    const { fal } = await import('@fal-ai/client');
    fal.config({ credentials: falKey });
    const result: any = await fal.subscribe('fal-ai/nano-banana-pro', {
      input: {
        prompt,
        num_images: 1,
        aspect_ratio: '16:9',
        output_format: 'png',
        resolution: '1K',
      },
      logs: false,
    });
    const url = pickImageUrl(result?.data?.images?.[0] || result?.images?.[0]);
    if (!url) throw new Error('Card image URL missing from fal response');
    return url;
  } catch (err) {
    console.error('[card-image] generation failed', err);
    throw err;
  }
}

// Simple text-to-image helper for ad-hoc UI testing (Nano Banana Pro)
export async function generateAdhocImage(prompt: string, falKey?: string): Promise<string> {
  falKey = falKey || process.env.FAL_KEY || process.env.FALAI_API_KEY;
  if (!falKey) throw new Error('FAL key required for image generation');
  if (!prompt?.trim()) throw new Error('Prompt required');

  const { fal } = await import('@fal-ai/client');
  fal.config({ credentials: falKey });

  const result: any = await fal.subscribe('fal-ai/nano-banana-pro', {
    input: {
      prompt,
      num_images: 1,
      aspect_ratio: '1:1',
      output_format: 'png',
      resolution: '1K',
    },
    logs: false,
  });

  const url = pickImageUrl(result?.data?.images?.[0] || result?.images?.[0]);
  if (!url) throw new Error('Image URL missing from fal response');
  return url;
}
