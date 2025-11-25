import { imageGenerationTool } from '../../../mastra/tools/image-generation-tool';
import { fal } from '@fal-ai/client';

jest.mock('@fal-ai/client');

describe('ImageGenerationTool', () => {
  test('uses edit endpoint with reference images and prompt', async () => {
    (fal.subscribe as jest.Mock).mockClear();
    process.env.FALAI_API_KEY = 'test-key';

    const prompt = 'Influencer using product in gym, photorealistic';
    const referenceImageUrls = [
      'https://example.com/headshot.png',
      'https://example.com/product.png',
    ];

    const result = await imageGenerationTool.execute({
      prompt,
      referenceImageUrls,
      imageSize: 'landscape_4_3',
    });

    expect(result.success).toBe(true);
    expect(result.imageUrl).toBe('https://example.com/mock-image.png');

    expect((fal.subscribe as jest.Mock).mock.calls.length).toBe(1);
    const [endpoint, options] = (fal.subscribe as jest.Mock).mock.calls[0];

    expect(endpoint).toBe('fal-ai/nano-banana-pro/edit');
    expect(options.input.prompt).toBe(prompt);
    expect(options.input.image_urls).toEqual(referenceImageUrls);
    expect(options.input.aspect_ratio).toBe('4:3');
  });
});
