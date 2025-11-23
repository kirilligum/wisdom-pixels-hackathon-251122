import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { BrandData, Persona, Environment, Influencer, Card } from '../types';
import CardGallery from '../components/CardGallery';
import ImageGeneratorTab from '../components/ImageGeneratorTab';
import ContentGeneratorTab from '../components/ContentGeneratorTab';
import { apiClient } from '../lib/api-client';

type TabType = 'personas' | 'environments' | 'influencers' | 'cards' | 'publish' | 'images' | 'ai-content';

export default function BrandDashboard() {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('personas');
  const [data, setData] = useState<BrandData | null>(null);
  const [influencerStates, setInfluencerStates] = useState<Record<string, { enabled: boolean; isDefault: boolean }>>({});
  const [cardStatuses, setCardStatuses] = useState<Record<string, 'draft' | 'ready' | 'published'>>({});
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!brandId) {
        setError('Missing brandId');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [brandRes, personasRes, environmentsRes, cardsRes, influencersRes] = await Promise.all([
          apiClient.getBrand(brandId),
          apiClient.getPersonas(brandId),
          apiClient.getEnvironments(brandId),
          apiClient.getCards(brandId),
          apiClient.getInfluencers(),
        ]);

        const brandData: BrandData = {
          brand: brandRes.brand,
          personas: personasRes.personas,
          environments: environmentsRes.environments,
          influencers: influencersRes.influencers || [],
          cards: cardsRes.cards,
        };

        setData(brandData);

        const initialStates: Record<string, { enabled: boolean; isDefault: boolean }> = {};
        brandData.influencers.forEach((inf) => {
          initialStates[inf.influencerId] = {
            enabled: inf.enabled,
            isDefault: false,
          };
        });
        setInfluencerStates(initialStates);

        const initialCardStatuses: Record<string, 'draft' | 'ready' | 'published'> = {};
        brandData.cards.forEach((card) => {
          initialCardStatuses[card.cardId] = (card.status as 'draft' | 'ready' | 'published') ?? 'draft';
        });
        setCardStatuses(initialCardStatuses);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load brand data');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [brandId]);

  const handleToggleInfluencer = (influencerId: string) => {
    setInfluencerStates(prev => ({
      ...prev,
      [influencerId]: {
        ...prev[influencerId],
        enabled: !prev[influencerId].enabled
      }
    }));
  };

  const handleSetDefault = (influencerId: string) => {
    // Set all to non-default first, then set the selected one as default
    const newStates = { ...influencerStates };
    Object.keys(newStates).forEach(id => {
      newStates[id] = { ...newStates[id], isDefault: false };
    });
    newStates[influencerId] = { ...newStates[influencerId], isDefault: true };
    setInfluencerStates(newStates);
  };

  const handleToggleCardSelection = (cardId: string) => {
    setSelectedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  const handlePublishSelected = async () => {
    if (selectedCards.size === 0) return;
    try {
      await apiClient.publishCards(Array.from(selectedCards));
      const newStatuses = { ...cardStatuses };
      selectedCards.forEach(cardId => {
        newStatuses[cardId] = 'published';
      });
      setCardStatuses(newStatuses);
      setSelectedCards(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to publish cards');
    }
  };

  const handleGenerateCards = async () => {
    if (!brandId) return;
    try {
      await apiClient.generateCards(brandId);
      // reload cards after generation
      const cardsRes = await apiClient.getCards(brandId);
      setData(prev => prev ? { ...prev, cards: cardsRes.cards } : prev);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate cards');
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading...</div>;
  }

  if (error || !data) {
    return <div style={{ padding: '2rem' }}>
      <p style={{ color: '#c0392b' }}>{error || 'Failed to load brand'}</p>
      <button onClick={() => navigate('/')} style={{ padding: '0.5rem 1rem' }}>Back</button>
    </div>;
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
        <button
          onClick={() => setActiveTab('publish')}
          style={tabStyle(activeTab === 'publish')}
        >
          Publish
        </button>
        <button
          onClick={() => setActiveTab('images')}
          style={tabStyle(activeTab === 'images')}
        >
          Generate Images
        </button>
        <button
          onClick={() => setActiveTab('ai-content')}
          style={tabStyle(activeTab === 'ai-content')}
        >
          AI Content
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
          <InfluencersTab
            influencers={data.influencers}
            influencerStates={influencerStates}
            onToggle={handleToggleInfluencer}
            onSetDefault={handleSetDefault}
          />
        )}
        {activeTab === 'cards' && (
          <CardGallery
            cards={data.cards}
            influencers={data.influencers}
            personas={data.personas}
          />
        )}
        {activeTab === 'publish' && (
          <PublishTab
            cards={data.cards}
            cardStatuses={cardStatuses}
            selectedCards={selectedCards}
            onToggleSelection={handleToggleCardSelection}
            onPublish={handlePublishSelected}
          />
        )}
        {activeTab === 'images' && (
          <ImageGeneratorTab brandName={data.brand.name} />
        )}
        {activeTab === 'ai-content' && (
          <ContentGeneratorTab brandName={data.brand.name} />
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
            key={persona.personaId}
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
            key={env.environmentId}
            data-testid="environment-card"
            style={{
              padding: '1.5rem',
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <h3 style={{ marginBottom: '0.5rem', color: '#28a745' }}>{env.label}</h3>
            <p style={{ color: '#495057', fontSize: '0.95rem', marginTop: '0.75rem' }}>
              {env.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function InfluencersTab({
  influencers,
  influencerStates,
  onToggle,
  onSetDefault
}: {
  influencers: Influencer[];
  influencerStates: Record<string, { enabled: boolean; isDefault: boolean }>;
  onToggle: (id: string) => void;
  onSetDefault: (id: string) => void;
}) {
  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Influencer Profiles</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {influencers.map((influencer) => {
          const state = influencerStates[influencer.influencerId] || { enabled: false, isDefault: false };
          return (
            <div
              key={influencer.influencerId}
              data-testid="influencer-card"
              style={{
                padding: '1.5rem',
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                opacity: state.enabled ? 1 : 0.6
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <h3 style={{ margin: 0, color: '#6f42c1' }}>{influencer.name}</h3>
                {state.isDefault && (
                  <span
                    data-testid="default-indicator"
                    style={{
                      padding: '0.25rem 0.5rem',
                      background: '#ffc107',
                      color: '#000',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      fontWeight: 'bold'
                    }}
                  >
                    Default
                  </span>
                )}
              </div>
              <p style={{ marginBottom: '0.5rem', color: '#6c757d', fontSize: '0.9rem' }}>
                Domain: {influencer.domain}
              </p>
              <p style={{ marginBottom: '1rem', color: '#495057', fontSize: '0.95rem' }}>
                {influencer.bio}
              </p>

              {/* Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    data-testid="enable-toggle"
                    checked={state.enabled}
                    onChange={() => onToggle(influencer.influencerId)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.9rem', color: '#495057' }}>Enabled</span>
                </label>
                <button
                  data-testid="set-default-button"
                  onClick={() => onSetDefault(influencer.influencerId)}
                  disabled={state.isDefault}
                  style={{
                    padding: '0.5rem 1rem',
                    background: state.isDefault ? '#6c757d' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: state.isDefault ? 'not-allowed' : 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    opacity: state.isDefault ? 0.6 : 1
                  }}
                >
                  {state.isDefault ? 'Default' : 'Set Default'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PublishTab({
  cards,
  cardStatuses,
  selectedCards,
  onToggleSelection,
  onPublish
}: {
  cards: Card[];
  cardStatuses: Record<string, 'draft' | 'ready' | 'published'>;
  selectedCards: Set<string>;
  onToggleSelection: (id: string) => void;
  onPublish: () => void;
}) {
  const publishedCount = Object.values(cardStatuses).filter(status => status === 'published').length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Publish Cards</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#6c757d' }}>{publishedCount} published</span>
          <button
            data-testid="publish-button"
            onClick={onPublish}
            disabled={selectedCards.size === 0}
            style={{
              padding: '0.75rem 1.5rem',
              background: selectedCards.size > 0 ? '#28a745' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: selectedCards.size > 0 ? 'pointer' : 'not-allowed',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            Publish Selected ({selectedCards.size})
          </button>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
        {cards.map(card => {
          const status = cardStatuses[card.cardId] || 'draft';
          const isSelected = selectedCards.has(card.cardId);

          return (
            <div
              key={card.cardId}
              data-testid="publish-card-item"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '1rem',
                borderBottom: '1px solid #e9ecef',
                background: isSelected ? '#f0f8ff' : 'white'
              }}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelection(card.cardId)}
                style={{ marginRight: '1rem', cursor: 'pointer', width: '18px', height: '18px' }}
              />

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  {card.cardId}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#6c757d', marginBottom: '0.25rem' }}>
                  {card.query.substring(0, 80)}...
                </div>
              </div>

              <span
                data-testid="card-status"
                style={{
                  padding: '0.25rem 0.75rem',
                  background: status === 'published' ? '#d4edda' : status === 'ready' ? '#fff3cd' : '#f8d7da',
                  color: status === 'published' ? '#155724' : status === 'ready' ? '#856404' : '#721c24',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  textTransform: 'capitalize'
                }}
              >
                {status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
