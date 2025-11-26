import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { apiClient } from '../lib/api-client';
import flowformSeed from '../data/flowform-seed.json';

export default function HomePage() {
  const [flowFormId, setFlowFormId] = useState<string | null>(null);
  const [brandName, setBrandName] = useState<string>('Wisdom Pixels');
  const [loading, setLoading] = useState(true);
  const seedMode = import.meta.env.VITE_USE_SEED === '1';

  useEffect(() => {
    const load = async () => {
      try {
        if (seedMode) {
          setFlowFormId('flowform');
          setBrandName(flowformSeed.brand.name || 'FlowForm Motion Suit');
          return;
        }
        const { brand } = await apiClient.getBrandBySlug('flowform');
        setFlowFormId(brand.brandId);
        setBrandName(brand.name);
      } catch {
        try {
          const list = await apiClient.listBrands();
          const flow = list.brands?.find((b) => b.urlSlug === 'flowform');
          if (flow) {
            setFlowFormId(flow.brandId);
            setBrandName(flow.name);
          } else {
            setFlowFormId(null);
          }
        } catch {
          // Fall back to bundled seed
          setFlowFormId('flowform');
          setBrandName(flowformSeed.brand.name || 'FlowForm Motion Suit');
        }
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
          pointerEvents: loading ? 'none' : 'auto',
          opacity: loading ? 0.6 : 1
        }}
        >
          {flowFormId ? `View ${brandName}` : loading ? 'Loading FlowForm…' : 'Run Setup'}
        </Link>
      </div>
    </div>
  );
}
