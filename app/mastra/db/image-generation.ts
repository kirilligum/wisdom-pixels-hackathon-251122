export async function generateInfluencerImage(name: string, domain: string): Promise<string> {
  const falKey = process.env.FAL_KEY || process.env.FALAI_API_KEY;
  const placeholder = `https://placehold.co/400x400?text=${encodeURIComponent(name)}`;

  if (!falKey) return placeholder;

  try {
    console.log(`[image-gen] headshot start for ${name} (${domain})`);
    const { fal } = await import('@fal-ai/client');
    fal.config({ credentials: falKey });

    // Default: Nano Banana Pro text-to-image for headshots
    const result: any = await fal.subscribe('fal-ai/nano-banana-pro', {
      input: {
        prompt: `Photorealistic headshot portrait of ${name}, ${domain} expert, professional studio lighting, neutral background, sharp focus, high quality`,
        num_images: 1,
        aspect_ratio: '1:1',
        output_format: 'png',
        resolution: '1K',
      },
      logs: false,
    });

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

    const url = result?.data?.images?.[0]?.url || placeholder;
    console.log(`[image-gen] headshot done for ${name}: ${url}`);
    return url;
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
    console.log(`[image-gen] action start for ${name}`);
    const { fal } = await import('@fal-ai/client');
    fal.config({ credentials: falKey });

    const prompts = [
      `Full-body photo of ${name}, ${domain} influencer, working out in a modern gym, athletic wear, dynamic action, photorealistic, 4k`,
      `Full-body photo of ${name}, ${domain} influencer, outdoor fitness scene, natural light, running or stretching, photorealistic, 4k`,
    ];

    const results: string[] = [];
    for (const prompt of prompts) {
      try {
        console.log(`[image-gen] generating action image for ${name}`);
        // Use Nano Banana Pro for full‑body influencer scenes
        const resp: any = await fal.subscribe('fal-ai/nano-banana-pro', {
          input: {
            prompt,
            num_images: 1,
            aspect_ratio: '3:4',
            output_format: 'png',
            resolution: '1K',
          },
          logs: false,
        });

        // Historical FLUX 2 / alpha-image-232 fallback (now disabled):
        //
        // let resp: any;
        // try {
        //   resp = await fal.subscribe('fal-ai/flux/schnell', {
        //     input: {
        //       prompt,
        //       image_size: 'portrait_4_3',
        //       num_images: 1,
        //     },
        //     logs: false,
        //   });
        // } catch (fluxError) {
        //   console.warn(`[image-gen] flux action failed for ${name}, trying edit-image:`, fluxError);
        //   // Fall back to edit-image with the headshot
        //   resp = await fal.subscribe('fal-ai/alpha-image-232/edit-image', {
        //     input: {
        //       prompt,
        //       image_urls: [headshotUrl],
        //     },
        //     logs: false,
        //   });
        // }
        const url = resp?.data?.images?.[0]?.url;
        console.log(`[image-gen] action image success for ${name}: ${url}`);
        results.push(url || headshotUrl || placeholder);
      } catch (error) {
        // If all methods fail, use the headshot as fallback to maintain consistency
        console.warn(`[image-gen] all action image methods failed for ${name}, using headshot:`, error);
        results.push(headshotUrl || placeholder);
      }
    }

    return results;
  } catch (e) {
    console.error('Action image generation failed, using placeholders:', e);
    return [placeholder, placeholder];
  }
}
