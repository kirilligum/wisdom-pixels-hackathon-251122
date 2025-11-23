import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { BrandData, Persona, Environment, Influencer, Card } from '../types';
import CardGallery from '../components/CardGallery';
import { apiClient } from '../lib/api-client';

type TabType = 'product' | 'influencers' | 'cards';

const MetricPill = ({ label, value }: { label: string; value: string }) => (
  <div style={{ padding: '0.35rem 0.75rem', background: '#e9ecef', borderRadius: '12px', fontSize: '0.85rem', color: '#495057', border: '1px solid #dee2e6' }}>
    <strong style={{ marginRight: '0.35rem' }}>{label}:</strong>{value}
  </div>
);

export default function BrandDashboard() {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('product');
  const [data, setData] = useState<BrandData | null>(null);
  const [influencerStates, setInfluencerStates] = useState<Record<string, { enabled: boolean; isDefault: boolean }>>({});
  const [cardStatuses, setCardStatuses] = useState<Record<string, 'draft' | 'ready' | 'published'>>({});
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [influencerSearch, setInfluencerSearch] = useState('');
  const [cardSearch, setCardSearch] = useState('');
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);
  const [gallery, setGallery] = useState<{ headshot: string; actionImages: string[] } | null>(null);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [brandProductImages, setBrandProductImages] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        // Resolve brandId by slug if not provided
        let resolvedId = brandId;
        const trySlug = async () => {
          try {
            const { brand } = await apiClient.getBrandBySlug('flowform');
            return brand.brandId;
          } catch {
            const list = await apiClient.listBrands();
            const flow = list.brands?.find((b) => b.urlSlug === 'flowform');
            return flow?.brandId;
          }
        };

        if (!resolvedId) {
          resolvedId = await trySlug();
        }

        if (!resolvedId) {
          setError('Brand not found');
          setLoading(false);
          return;
        }

        let brandRes;
        try {
          brandRes = await apiClient.getBrand(resolvedId);
        } catch (e) {
          const msg = e instanceof Error ? e.message : '';
          if (msg.includes('404')) {
            const fallbackId = await trySlug();
            if (fallbackId && fallbackId !== resolvedId) {
              navigate(`/brand/${fallbackId}`, { replace: true });
              resolvedId = fallbackId;
              brandRes = await apiClient.getBrand(resolvedId);
            }
          }
          if (!brandRes) throw e;
        }

        const [personasRes, environmentsRes, cardsRes, influencersRes] = await Promise.all([
          apiClient.getPersonas(resolvedId),
          apiClient.getEnvironments(resolvedId),
          apiClient.getCards(resolvedId),
          apiClient.getInfluencers(),
        ]);

        let influencers = influencersRes.influencers || [];
        let cards = cardsRes.cards || [];

        // For the FlowForm demo, if there are no influencers/cards, fall back to Jordan Lee placeholders
        const isFlowForm = brandRes.brand.urlSlug === 'flowform';
        if (isFlowForm && influencers.length === 0) {
          try {
            const resp = await fetch('/json/jordan_lee.json');
            if (resp.ok) {
              const j = await resp.json() as any;
              const placeholderInfluencer: Influencer = {
                influencerId: 'placeholder-jordan-lee',
                name: j.name || 'Jordan Lee',
                bio: j.bio || 'Strength & conditioning coach focused on wearable-driven training plans.',
                domain: j.domain || 'Strength & Conditioning',
                imageUrl: '/images/jordan_lee/influencers/influencer_jordan_lee_protrait.png',
                actionImageUrls: [
                  '/images/jordan_lee/influencers/influencer_jordan_lee_1.png',
                  '/images/jordan_lee/influencers/influencer_jordan_lee_2.png',
                ],
                enabled: true,
              };
              influencers = [placeholderInfluencer];
            }
          } catch {
            // ignore placeholder failure
          }
        }

        if (isFlowForm && cards.length === 0) {
          try {
            const resp = await fetch('/json/jordan_lee_cards.json');
            if (resp.ok) {
              const json = await resp.json() as any[];
              cards = json.map((c) => ({
                cardId: c.id,
                brandId: brandRes.brand.brandId,
                influencerId: 'placeholder-jordan-lee',
                personaId: null,
                environmentId: null,
                query: c.query,
                response: c.response,
                imageUrl: c.imageUrl,
                imageBrief: c.imageBrief,
                status: 'draft',
              } as Card));
            }
          } catch {
            // ignore placeholder failure
          }
        }

        const brandData: BrandData = {
          brand: brandRes.brand,
          personas: personasRes.personas,
          environments: environmentsRes.environments,
          influencers,
          cards,
        };

        setData(brandData);
        setBrandProductImages(brandData.brand.productImages ?? []);

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

  const handleToggleInfluencer = async (influencerId: string, enabled: boolean) => {
    try {
      await apiClient.updateInfluencerEnabled(influencerId, enabled);
      setInfluencerStates(prev => ({
        ...prev,
        [influencerId]: {
          ...prev[influencerId],
          enabled
        }
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update influencer');
    }
  };

  const handleMatchInfluencers = async () => {
    try {
      const { influencers } = await apiClient.findNewInfluencers();
      // rebuild influencer state
      const nextStates: Record<string, { enabled: boolean; isDefault: boolean }> = {};
      influencers.forEach(inf => {
        nextStates[inf.influencerId] = { enabled: inf.enabled, isDefault: false };
      });
      setInfluencerStates(nextStates);
      setData(prev => prev ? { ...prev, influencers } : prev);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to match influencers');
    }
  };

  const handleEnableAllInfluencers = async () => {
    try {
      if (!data) return;
      await Promise.all(data.influencers.map(inf => apiClient.updateInfluencerEnabled(inf.influencerId, true)));
      const nextStates: Record<string, { enabled: boolean; isDefault: boolean }> = {};
      data.influencers.forEach(inf => {
        nextStates[inf.influencerId] = { enabled: true, isDefault: false };
      });
      setInfluencerStates(nextStates);
      setData({ ...data, influencers: data.influencers.map(inf => ({ ...inf, enabled: true })) });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to enable all influencers');
    }
  };

  const handleDisableAllInfluencers = async () => {
    try {
      if (!data) return;
      await Promise.all(data.influencers.map(inf => apiClient.updateInfluencerEnabled(inf.influencerId, false)));
      const nextStates: Record<string, { enabled: boolean; isDefault: boolean }> = {};
      data.influencers.forEach(inf => {
        nextStates[inf.influencerId] = { enabled: false, isDefault: false };
      });
      setInfluencerStates(nextStates);
      setData({ ...data, influencers: data.influencers.map(inf => ({ ...inf, enabled: false })) });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to disable all influencers');
    }
  };

  const handleDeleteInfluencer = async (influencerId: string) => {
    try {
      await apiClient.deleteInfluencer(influencerId);
      setData(prev => prev ? { ...prev, influencers: prev.influencers.filter(i => i.influencerId !== influencerId) } : prev);
      setInfluencerStates(prev => {
        const next = { ...prev };
        delete next[influencerId];
        return next;
      });
      if (selectedInfluencer?.influencerId === influencerId) {
        setSelectedInfluencer(null);
        setGallery(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete influencer');
    }
  };

  const handleSelectInfluencer = async (inf: Influencer) => {
    setSelectedInfluencer(inf);
    setGalleryError(null);
    const cachedGallery = { headshot: inf.imageUrl, actionImages: inf.actionImageUrls || [] };
    setGallery(cachedGallery);

    if (cachedGallery.actionImages.length >= 2) {
      setGalleryLoading(false);
      return;
    }

    setGalleryLoading(true);
    try {
      const galleryRes = await apiClient.getInfluencerGallery(inf.influencerId);
      setGallery(galleryRes);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load gallery';
      setGalleryError(msg);
      setError(msg);
      setGallery(null);
    } finally {
      setGalleryLoading(false);
    }
  };

  const handleUploadProductImage = async (dataUrl: string) => {
    try {
      if (!data) return;
      console.log('[upload] starting upload for brand', data.brand.brandId);
      await apiClient.addProductImage(data.brand.brandId, dataUrl);
      console.log('[upload] saved to DB, fetching fresh brand');
      const fresh = await apiClient.getBrand(data.brand.brandId);
      const freshImages = fresh.brand.productImages || [];
      console.log('[upload] fetched brand with productImages count', freshImages.length);
      setBrandProductImages(freshImages);
      setData(prev => prev ? { ...prev, brand: { ...fresh.brand } } : prev);
      console.log('[upload] state updated with DB images');
    } catch (e) {
      console.error('Upload failed', e);
      setError(e instanceof Error ? e.message : 'Failed to upload product image');
    }
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

  const handleSelectAllCards = () => {
    const ids = data?.cards.map(c => c.cardId) ?? [];
    setSelectedCards(new Set(ids));
  };

  const handleClearSelection = () => {
    setSelectedCards(new Set());
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
          onClick={() => setActiveTab('product')}
          style={tabStyle(activeTab === 'product')}
        >
          Product
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
        {activeTab === 'product' && (
          <BrandTab
            brand={data.brand}
            personas={data.personas}
            environments={data.environments}
            cards={data.cards}
            onImageClick={(url) => setLightboxUrl(url)}
            onUploadProductImage={handleUploadProductImage}
            productImages={brandProductImages}
          />
        )}
        {activeTab === 'influencers' && (
          <>
            <InfluencersTab
              influencers={data.influencers}
              influencerStates={influencerStates}
              onToggle={handleToggleInfluencer}
              onMatch={handleMatchInfluencers}
              searchTerm={influencerSearch}
              onSearchChange={setInfluencerSearch}
              onEnableAll={handleEnableAllInfluencers}
              onDisableAll={handleDisableAllInfluencers}
              onDelete={handleDeleteInfluencer}
              onSelect={(inf) => handleSelectInfluencer(inf)}
            />
            {selectedInfluencer && (
              <div style={{ marginTop: '1.5rem', background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: '1.25rem', border: '1px solid #e9ecef' }} aria-label="Influencer Details">
                <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <img
                    src={gallery?.headshot || selectedInfluencer.imageUrl || `https://placehold.co/400x200?text=${encodeURIComponent(selectedInfluencer.name)}`}
                    alt={selectedInfluencer.name}
                    style={{ width: '240px', height: '240px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e9ecef', cursor: 'zoom-in' }}
                    onError={(e) => { e.currentTarget.src = `https://placehold.co/400x200?text=${encodeURIComponent(selectedInfluencer.name)}`; }}
                    onClick={() => setLightboxUrl(gallery?.headshot || selectedInfluencer.imageUrl)}
                  />
                  <div style={{ flex: 1, minWidth: '260px' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0' }}>{selectedInfluencer.name}</h3>
                    <p style={{ margin: '0 0 0.5rem 0', color: '#6c757d' }}>{selectedInfluencer.domain}</p>
                    <p style={{ margin: '0 0 0.75rem 0', color: '#495057' }}>{selectedInfluencer.bio}</p>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <MetricPill label="Followers" value="120k" />
                      <MetricPill label="Engagement" value="4.8%" />
                      <MetricPill label="Avg Views" value="85k" />
                      <MetricPill label="Platforms" value="IG / YT / TikTok" />
                      <MetricPill label="Semantic Fit" value="92 / 100" />
                      <MetricPill label="Dataset Diversity" value="88 / 100" />
                      <MetricPill label="Partners" value="Lululemon, Whoop" />
                      <MetricPill label="Competitors" value="Nike, Garmin" />
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0' }}>Gallery</h4>
                  {galleryLoading && <p style={{ color: '#6c757d' }}>Loading gallery...</p>}
                  {galleryError && <p style={{ color: '#c0392b' }}>{galleryError}</p>}
                  {!galleryLoading && !galleryError && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                      {(gallery?.actionImages || []).map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt={`${selectedInfluencer.name} action ${idx + 1}`}
                          style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e9ecef', cursor: 'zoom-in' }}
                          onError={(e) => { e.currentTarget.src = `https://placehold.co/400x200?text=${encodeURIComponent(selectedInfluencer.name)}`; }}
                          onClick={() => setLightboxUrl(url)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
        {activeTab === 'cards' && (
          <CardGallery
            cards={data.cards}
            influencers={data.influencers}
            personas={data.personas}
            onImageClick={(url) => setLightboxUrl(url)}
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

      {lightboxUrl && (
        <div
          role="presentation"
          onClick={() => setLightboxUrl(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
        >
          <img
            src={lightboxUrl}
            alt="Full size"
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px', background: '#000' }}
            onClick={(e) => e.stopPropagation()}
            onError={(e) => { e.currentTarget.src = `https://placehold.co/800x800?text=Image`; }}
          />
        </div>
      )}
    </div>
  );
}

function BrandTab({ brand, personas, environments, cards, onImageClick, onUploadProductImage, productImages }: { brand: BrandData['brand']; personas: Persona[]; environments: Environment[]; cards: Card[]; onImageClick: (url: string) => void; onUploadProductImage: (url: string) => void; productImages: string[] }) {
  const fallbackImages = cards.slice(0, 3).map(c => c.imageUrl || `https://placehold.co/400x250?text=${encodeURIComponent(brand.name)}`);
  const imagesToShow = productImages.length > 0 ? productImages : fallbackImages;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUploadProductImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };
  return (
    <div>
      <h2 style={{ marginBottom: '1rem' }}>{brand.name}</h2>
      <p style={{ margin: '0 0 0.5rem 0', color: '#495057' }}>{brand.description || `${brand.name} in ${brand.domain}`}</p>
      <p style={{ margin: '0 0 1rem 0', color: '#6c757d' }}><strong>Domain:</strong> {brand.domain}</p>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {brand.contentSources?.map((src) => (
          <a key={src} href={src} target="_blank" rel="noreferrer" style={{ padding: '0.35rem 0.75rem', background: '#e9ecef', borderRadius: '12px', textDecoration: 'none', color: '#007bff' }}>
            {src}
          </a>
        ))}
      </div>
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={{ display: 'inline-block', padding: '0.5rem 1rem', background: '#e9ecef', borderRadius: '6px', border: '1px solid #ced4da', cursor: 'pointer', fontWeight: 'bold' }}>
          Upload product image
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
        </label>
        <span style={{ marginLeft: '0.75rem', color: '#6c757d', fontSize: '0.95rem' }}>Images appear in the product gallery below.</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {imagesToShow.map((url, idx) => (
          <img
            key={idx}
            src={url}
            alt={`Product ${idx + 1}`}
            style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e9ecef', cursor: 'zoom-in' }}
            onClick={() => onImageClick(url)}
          />
        ))}
      </div>

      <h3 style={{ margin: '1rem 0 0.75rem 0' }}>Personas</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {personas.map((persona) => (
          <div key={persona.personaId} style={{ padding: '1rem', background: 'white', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#007bff' }}>{persona.label}</h4>
            <p style={{ margin: '0 0 0.5rem 0', color: '#495057', fontSize: '0.95rem' }}>{persona.description}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {persona.tags.map(tag => (
                <span key={tag} style={{ padding: '0.25rem 0.6rem', background: '#e7f3ff', color: '#004085', borderRadius: '12px', fontSize: '0.8rem' }}>{tag}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <h3 style={{ margin: '1rem 0 0.75rem 0' }}>Environments</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
        {environments.map(env => (
          <div key={env.environmentId} style={{ padding: '1rem', background: 'white', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <h4 style={{ margin: '0 0 0.35rem 0', color: '#28a745' }}>{env.label}</h4>
            <p style={{ margin: 0, color: '#495057', fontSize: '0.95rem' }}>{env.description}</p>
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
  onMatch,
  searchTerm,
  onSearchChange,
  onEnableAll,
  onDisableAll,
  onDelete,
  onSelect,
}: {
  influencers: Influencer[];
  influencerStates: Record<string, { enabled: boolean; isDefault: boolean }>;
  onToggle: (id: string, enabled: boolean) => void;
  onMatch: () => void;
  searchTerm: string;
  onSearchChange: (v: string) => void;
  onEnableAll: () => void;
  onDisableAll: () => void;
  onDelete: (id: string) => void;
  onSelect: (inf: Influencer) => void;
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Influencer Profiles</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            data-testid="match-influencers"
            onClick={onMatch}
            title="Find new influencers aligned to the brand content; adds one per click and enables the core set"
            style={{
              padding: '0.5rem 1rem',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Find New
          </button>
          <button
            data-testid="enable-all-influencers"
            onClick={onEnableAll}
            title="Enable all influencers"
            style={{
              padding: '0.5rem 1rem',
              background: '#e9ecef',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Select All
          </button>
          <button
            data-testid="disable-all-influencers"
            onClick={onDisableAll}
            title="Disable all influencers"
            style={{
              padding: '0.5rem 1rem',
              background: '#e9ecef',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Unselect All
          </button>
        </div>
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Search influencers..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: '100%',
            padding: '0.6rem 0.75rem',
            border: '1px solid #ced4da',
            borderRadius: '6px',
            fontSize: '1rem'
          }}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {influencers
          .filter((inf) => inf.enabled)
          .filter((inf) => {
            if (!searchTerm.trim()) return true;
            const needle = searchTerm.toLowerCase();
            return (
              inf.name.toLowerCase().includes(needle) ||
              inf.domain.toLowerCase().includes(needle) ||
              inf.bio.toLowerCase().includes(needle)
            );
          })
          .map((influencer) => {
          const state = influencerStates[influencer.influencerId] || { enabled: false, isDefault: false };
          return (
            <div
              key={influencer.influencerId}
              data-testid="influencer-card"
              onClick={() => onSelect(influencer)}
              style={{
                padding: '1.5rem',
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                opacity: state.enabled ? 1 : 0.6,
                cursor: 'pointer'
              }}
            >
              {influencer.imageUrl && (
                <img
                  src={influencer.imageUrl}
                  alt={influencer.name}
                  style={{
                    width: '100%',
                    height: '180px',
                    objectFit: 'cover',
                    borderRadius: '6px',
                    marginBottom: '0.75rem',
                    border: '1px solid #e9ecef',
                    cursor: 'zoom-in'
                  }}
                  onError={(e) => {
                    e.currentTarget.src = `https://placehold.co/400x200?text=${encodeURIComponent(influencer.name)}`;
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxUrl(influencer.imageUrl);
                  }}
                />
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <h3 style={{ margin: 0, color: '#6f42c1' }}>{influencer.name}</h3>
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
                  onChange={() => onToggle(influencer.influencerId, !state.enabled)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.9rem', color: '#495057' }}>Enabled</span>
              </label>
              <button
                data-testid="delete-influencer"
                onClick={() => onDelete(influencer.influencerId)}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 'bold'
                }}
              >
                Delete
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
  onPublish,
  onSelectAll,
  onClearSelection,
  searchTerm,
  onSearchChange,
}: {
  cards: Card[];
  cardStatuses: Record<string, 'draft' | 'ready' | 'published'>;
  selectedCards: Set<string>;
  onToggleSelection: (id: string) => void;
  onPublish: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  searchTerm: string;
  onSearchChange: (v: string) => void;
}) {
  const publishedCount = Object.values(cardStatuses).filter(status => status === 'published').length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Publish Cards</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            data-testid="select-all"
            onClick={onSelectAll}
            style={{
              padding: '0.5rem 1rem',
              background: '#e9ecef',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Select All
          </button>
          <button
            data-testid="clear-selection"
            onClick={onClearSelection}
            style={{
              padding: '0.5rem 1rem',
              background: '#e9ecef',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Unselect All
          </button>
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

      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Search cards..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: '100%',
            padding: '0.6rem 0.75rem',
            border: '1px solid #ced4da',
            borderRadius: '6px',
            fontSize: '1rem'
          }}
        />
      </div>

      <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
        {cards
          .filter(card => {
            if (!searchTerm.trim()) return true;
            const needle = searchTerm.toLowerCase();
            return (
              card.query.toLowerCase().includes(needle) ||
              card.response.toLowerCase().includes(needle) ||
              card.cardId.toLowerCase().includes(needle)
            );
          })
          .map(card => {
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
