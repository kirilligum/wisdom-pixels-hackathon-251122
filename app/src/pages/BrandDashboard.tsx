import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { BrandData, Persona, Environment } from '../types';
import flowformData from '../data/flowform-seed.json';
import CardGallery from '../components/CardGallery';

type TabType = 'personas' | 'environments' | 'influencers' | 'cards';

export default function BrandDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('personas');
  const [data, setData] = useState<BrandData | null>(null);

  useEffect(() => {
    // Load FlowForm data
    setData(flowformData as BrandData);
  }, []);

  if (!data) {
    return <div style={{ padding: '2rem' }}>Loading...</div>;
  }

  const tabStyle = (isActive: boolean) => ({
    padding: '0.75rem 1.5rem',
    background: isActive ? '#007bff' : '#e9ecef',
    color: isActive ? 'white' : '#495057',
    border: 'none',
    borderRadius: '4px 4px 0 0',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: isActive ? 'bold' : 'normal',
  });

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1>{data.brand.name}</h1>
        <p style={{ color: '#6c757d' }}>{data.brand.domain}</p>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '2px solid #dee2e6' }}>
        <button
          onClick={() => setActiveTab('personas')}
          style={tabStyle(activeTab === 'personas')}
        >
          Personas
        </button>
        <button
          onClick={() => setActiveTab('environments')}
          style={tabStyle(activeTab === 'environments')}
        >
          Environments
        </button>
        <button
          onClick={() => setActiveTab('influencers')}
          style={tabStyle(activeTab === 'influencers')}
        >
          Influencers
        </button>
        <button
          onClick={() => setActiveTab('cards')}
          style={tabStyle(activeTab === 'cards')}
        >
          Cards
        </button>
      </div>

      {/* Tab Content */}
      <div style={{ padding: '1.5rem', background: '#f8f9fa', borderRadius: '0 4px 4px 4px', minHeight: '400px' }}>
        {activeTab === 'personas' && (
          <PersonasTab personas={data.personas} />
        )}
        {activeTab === 'environments' && (
          <EnvironmentsTab environments={data.environments} />
        )}
        {activeTab === 'influencers' && (
          <InfluencersTab influencers={data.influencers} />
        )}
        {activeTab === 'cards' && (
          <CardGallery
            cards={data.cards}
            influencers={data.influencers}
            personas={data.personas}
          />
        )}
      </div>

      <div style={{ marginTop: '2rem' }}>
        <Link to="/" style={{
          padding: '0.5rem 1rem',
          background: '#6c757d',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '4px'
        }}>
          Back to Home
        </Link>
      </div>
    </div>
  );
}

function PersonasTab({ personas }: { personas: Persona[] }) {
  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Customer Personas</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {personas.map((persona) => (
          <div
            key={persona.id}
            data-testid="persona-card"
            style={{
              padding: '1.5rem',
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <h3 style={{ marginBottom: '0.75rem', color: '#007bff' }}>{persona.label}</h3>
            <p style={{ marginBottom: '1rem', color: '#495057', fontSize: '0.95rem' }}>
              {persona.description}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {persona.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: '0.25rem 0.75rem',
                    background: '#e7f3ff',
                    color: '#004085',
                    borderRadius: '12px',
                    fontSize: '0.85rem'
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EnvironmentsTab({ environments }: { environments: Environment[] }) {
  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Environments</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {environments.map((env) => (
          <div
            key={env.id}
            data-testid="environment-card"
            style={{
              padding: '1.5rem',
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <h3 style={{ marginBottom: '0.5rem', color: '#28a745' }}>{env.label}</h3>
            <p style={{
              marginBottom: '0.75rem',
              padding: '0.25rem 0.75rem',
              background: '#d4edda',
              color: '#155724',
              borderRadius: '4px',
              fontSize: '0.85rem',
              display: 'inline-block'
            }}>
              {env.type}
            </p>
            <p style={{ color: '#495057', fontSize: '0.95rem', marginTop: '0.75rem' }}>
              {env.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function InfluencersTab({ influencers }: { influencers: any[] }) {
  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Influencer Profiles</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {influencers.map((influencer) => (
          <div
            key={influencer.id}
            data-testid="influencer-card"
            style={{
              padding: '1.5rem',
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <h3 style={{ marginBottom: '0.5rem', color: '#6f42c1' }}>{influencer.name}</h3>
            <p style={{ marginBottom: '0.5rem', color: '#6c757d', fontSize: '0.9rem' }}>
              Age: {influencer.ageRange} • {influencer.role}
            </p>
            <p style={{ marginBottom: '1rem', color: '#495057', fontSize: '0.95rem' }}>
              {influencer.bioShort}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {influencer.tags.map((tag: string) => (
                <span
                  key={tag}
                  style={{
                    padding: '0.25rem 0.75rem',
                    background: '#f3e5ff',
                    color: '#6f42c1',
                    borderRadius: '12px',
                    fontSize: '0.85rem'
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
