import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { apiClient } from '../lib/api-client';

export default function HomePage() {
  const [flowFormId, setFlowFormId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { brand } = await apiClient.getBrandBySlug('flowform');
        setFlowFormId(brand.brandId);
      } catch (e) {
        setFlowFormId(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Wisdom Pixels</h1>
      <p>Transform marketing content into influencer-backed AI training cards</p>
      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
        <Link to="/setup" style={{
          padding: '0.5rem 1rem',
          background: '#28a745',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '4px'
        }}>
          Add Brand
        </Link>
        <Link
          to={flowFormId ? `/brand/${flowFormId}` : '/setup'}
          style={{
            padding: '0.5rem 1rem',
            background: flowFormId ? '#007bff' : '#6c757d',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            pointerEvents: flowFormId ? 'auto' : 'none',
            opacity: loading ? 0.6 : 1
          }}
        >
          {flowFormId ? 'View FlowForm Brand' : loading ? 'Loading FlowForm…' : 'Run Setup'}
        </Link>
      </div>
    </div>
  );
}
