import { useState } from 'react';
import { mastraClient } from '../lib/mastra';

export default function ContentGeneratorTab({ brandName }: { brandName: string }) {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const examplePrompts = [
    `Generate a customer persona for ${brandName} targeting fitness enthusiasts`,
    `Create a training environment description for ${brandName} motion tracking products`,
    `Generate an AI training card about the benefits of motion capture technology`,
    `Create a persona for professional athletes using ${brandName} equipment`
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const agent = mastraClient.getAgent('contentAgent');

      const response = await agent.generate({
        messages: [{ role: 'user', content: prompt }]
      });

      setResult(response.text);
      setPrompt(''); // Clear prompt after successful generation
    } catch (err) {
      console.error('Content generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate content. Make sure the Mastra server is running (npm run dev:mastra).');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1rem' }}>AI Content Generation</h2>
      <p style={{ color: '#6c757d', marginBottom: '1.5rem' }}>
        Generate personas, environments, and training card content using AI for {brandName}
      </p>

      <div style={{
        background: '#d1ecf1',
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '1.5rem',
        border: '1px solid #bee5eb'
      }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#0c5460' }}>Mastra Backend Required</h4>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#0c5460' }}>
          Run <code style={{ background: 'rgba(0,0,0,0.1)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>npm run dev:mastra</code> in a separate terminal to start the Mastra agent server.
        </p>
      </div>

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
          Content Generation Prompt:
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask the AI to generate personas, environments, or training cards..."
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
            background: isGenerating || !prompt.trim() ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isGenerating || !prompt.trim() ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: 'bold'
          }}
        >
          {isGenerating ? 'Generating...' : 'Generate Content'}
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

      {/* Generated Content */}
      {result && (
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid #28a745'
        }}>
          <h3 style={{ marginBottom: '1rem', color: '#28a745' }}>Generated Content</h3>
          <pre style={{
            whiteSpace: 'pre-wrap',
            fontSize: '0.9rem',
            lineHeight: '1.6',
            margin: 0,
            fontFamily: 'inherit'
          }}>
            {result}
          </pre>
        </div>
      )}
    </div>
  );
}
