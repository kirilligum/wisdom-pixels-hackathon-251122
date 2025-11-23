export async function generateInfluencerImage(name: string, domain: string): Promise<string> {
  const falKey = process.env.FAL_KEY || process.env.FALAI_API_KEY;
  const placeholder = `https://placehold.co/400x400?text=${encodeURIComponent(name)}`;

  if (!falKey) return placeholder;

  try {
    const { fal } = await import('@fal-ai/client');
    fal.config({ credentials: falKey });

    const result: any = await fal.subscribe('fal-ai/alpha-image-232/text-to-image', {
      input: {
        prompt: `Photorealistic headshot of ${name}, ${domain} expert, professional studio lighting, neutral background, sharp focus`,
      },
      logs: false,
    });

    return result?.data?.images?.[0]?.url || placeholder;
  } catch (e) {
    console.error('Image generation failed, using placeholder:', e);
    return placeholder;
  }
}

export async function generateActionImages(headshotUrl: string, name: string, domain: string): Promise<string[]> {
  const falKey = process.env.FAL_KEY || process.env.FALAI_API_KEY;
  const placeholder = `https://placehold.co/600x800?text=${encodeURIComponent(name)}`;
  if (!falKey) return [placeholder, placeholder];

  try {
    const { fal } = await import('@fal-ai/client');
    fal.config({ credentials: falKey });

    const prompts = [
      `Full-body photo of ${name}, ${domain} influencer, working out in a modern gym, athletic wear, dynamic action, photorealistic, 4k`,
      `Full-body photo of ${name}, ${domain} influencer, outdoor fitness scene, natural light, running or stretching, photorealistic, 4k`,
    ];

    const results: string[] = [];
    for (const prompt of prompts) {
      try {
        const resp: any = await fal.subscribe('fal-ai/alpha-image-232/edit-image', {
          input: {
            prompt,
            image_urls: [headshotUrl],
          },
          logs: false,
        });
        const url = resp?.data?.images?.[0]?.url;
        results.push(url || placeholder);
      } catch {
        // If edit-image fails, keep the face reference by falling back to the headshot
        results.push(headshotUrl || placeholder);
      }
    }

    return results;
  } catch (e) {
    console.error('Action image generation failed, using placeholders:', e);
    return [placeholder, placeholder];
  }
}
