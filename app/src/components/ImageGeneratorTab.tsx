import { useState } from 'react';

export default function ImageGeneratorTab({ brandName }: { brandName: string }) {
  const [prompt, setPrompt] = useState('');
  const [generatedImages, setGeneratedImages] = useState<Array<{ url: string; prompt: string; timestamp: number }>>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const examplePrompts = [
    'Professional athlete wearing high-tech motion tracking suit, studio photography, clean background',
    'FlowForm motion suit with LED sensors, futuristic sports technology, dynamic pose',
    'Fitness trainer demonstrating motion capture suit, modern gym environment, sleek design',
    'Athletic model in smart motion tracking gear, product photography, premium quality'
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    // Get API key from environment variable
    const apiKey = import.meta.env.VITE_FALAI_API_KEY || import.meta.env.VITE_FAL_KEY;

    if (!apiKey) {
      setError('FAL API key not configured. Please add VITE_FALAI_API_KEY to your .env file.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const { fal } = await import('@fal-ai/client');

      // Configure fal client with API key from environment
      fal.config({
        credentials: apiKey
      });

      const result = await fal.subscribe('fal-ai/flux/schnell', {
        input: {
          prompt: prompt,
          image_size: 'landscape_4_3',
          num_inference_steps: 4
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === 'IN_PROGRESS') {
            console.log('Generating image...');
          }
        }
      });

      if (result.data && result.data.images && result.data.images.length > 0) {
        const newImage = {
          url: result.data.images[0].url,
          prompt: prompt,
          timestamp: Date.now()
        };
        setGeneratedImages(prev => [newImage, ...prev]);
        setPrompt(''); // Clear prompt after successful generation
      } else {
        setError('No image was generated. Please try again.');
      }
    } catch (err) {
      console.error('Image generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate image. Please check your API key and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1rem' }}>Generate Marketing Images</h2>
      <p style={{ color: '#6c757d', marginBottom: '1.5rem' }}>
        Create stunning product images for {brandName} using AI-powered image generation
      </p>

      {/* Example Prompts */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ marginBottom: '0.75rem' }}>Example Prompts:</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {examplePrompts.map((example, idx) => (
            <button
              key={idx}
              onClick={() => setPrompt(example)}
              disabled={isGenerating}
              style={{
                padding: '0.75rem',
                background: 'white',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                textAlign: 'left',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
                color: '#495057',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => {
                if (!isGenerating) {
                  e.currentTarget.style.background = '#f8f9fa';
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'white';
              }}
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt Input */}
      <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
          Image Prompt:
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the image you want to generate..."
          disabled={isGenerating}
          style={{
            width: '100%',
            minHeight: '100px',
            padding: '0.75rem',
            border: '1px solid #ced4da',
            borderRadius: '4px',
            fontSize: '1rem',
            fontFamily: 'inherit',
            resize: 'vertical'
          }}
        />

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          style={{
            marginTop: '1rem',
            padding: '0.75rem 2rem',
            background: isGenerating || !prompt.trim() ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isGenerating || !prompt.trim() ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold'
          }}
        >
          {isGenerating ? 'Generating...' : 'Generate Image'}
        </button>

        {error && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: '#f8d7da',
            color: '#721c24',
            borderRadius: '4px',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}
      </div>

      {/* Generated Images Gallery */}
      {generatedImages.length > 0 && (
        <div>
          <h3 style={{ marginBottom: '1rem' }}>Generated Images ({generatedImages.length})</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            {generatedImages.map((image, idx) => (
              <div
                key={idx}
                style={{
                  background: 'white',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <img
                  src={image.url}
                  alt={image.prompt}
                  style={{
                    width: '100%',
                    height: '250px',
                    objectFit: 'cover'
                  }}
                />
                <div style={{ padding: '1rem' }}>
                  <p style={{
                    margin: '0 0 0.5rem 0',
                    fontSize: '0.85rem',
                    color: '#495057',
                    lineHeight: '1.4'
                  }}>
                    {image.prompt}
                  </p>
                  <p style={{
                    margin: 0,
                    fontSize: '0.75rem',
                    color: '#6c757d'
                  }}>
                    {new Date(image.timestamp).toLocaleString()}
                  </p>
                  <a
                    href={image.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-block',
                      marginTop: '0.5rem',
                      padding: '0.5rem 1rem',
                      background: '#007bff',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '4px',
                      fontSize: '0.85rem'
                    }}
                  >
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
