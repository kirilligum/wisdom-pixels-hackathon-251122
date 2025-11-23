import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

export default function BrandSetup() {
  const navigate = useNavigate();
  const [brandName, setBrandName] = useState('');
  const [domain, setDomain] = useState('');
  const [urls, setUrls] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setIsAnalyzing(true);

    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // For demo, navigate to FlowForm brand dashboard
    setIsAnalyzing(false);
    navigate('/brand/flowform');
  };

  return (
    <div style={{
      maxWidth: '600px',
      margin: '2rem auto',
      padding: '2rem',
      background: '#f8f9fa',
      borderRadius: '8px'
    }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Add Brand</h1>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="brandName" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Brand Name *
          </label>
          <input
            type="text"
            id="brandName"
            name="brandName"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.5rem',
              fontSize: '1rem',
              border: '1px solid #ced4da',
              borderRadius: '4px'
            }}
            placeholder="e.g., FlowForm Motion Suit"
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="domain" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Primary Domain *
          </label>
          <input
            type="text"
            id="domain"
            name="domain"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.5rem',
              fontSize: '1rem',
              border: '1px solid #ced4da',
              borderRadius: '4px'
            }}
            placeholder="e.g., flowform.io"
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="urls" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
            Marketing URLs *
          </label>
          <textarea
            id="urls"
            name="urls"
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            required
            rows={4}
            style={{
              width: '100%',
              padding: '0.5rem',
              fontSize: '1rem',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontFamily: 'inherit'
            }}
            placeholder="Enter landing page and marketing URLs (one per line)"
          />
          <small style={{ color: '#6c757d', fontSize: '0.875rem' }}>
            One URL per line. These will be analyzed to extract personas and content.
          </small>
        </div>

        <button
          type="submit"
          disabled={isAnalyzing}
          style={{
            width: '100%',
            padding: '0.75rem',
            fontSize: '1rem',
            fontWeight: 'bold',
            color: 'white',
            background: isAnalyzing ? '#6c757d' : '#007bff',
            border: 'none',
            borderRadius: '4px',
            cursor: isAnalyzing ? 'not-allowed' : 'pointer'
          }}
        >
          {isAnalyzing ? 'Analyzing content...' : 'Analyze Content'}
        </button>
      </form>

      {isAnalyzing && (
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: '#e7f3ff',
          borderRadius: '4px',
          color: '#004085'
        }}>
          <p style={{ margin: 0 }}>
            Extracting personas, environments, influencer archetypes, and value propositions...
          </p>
        </div>
      )}
    </div>
  );
}
