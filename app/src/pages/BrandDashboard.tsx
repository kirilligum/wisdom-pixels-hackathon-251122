import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { BrandData, Persona, Environment, Influencer, Card } from '../types';
import CardGallery from '../components/CardGallery';
import { apiClient } from '../lib/api-client';
import flowformSeed from '../data/flowform-seed.json';
import { useSelectionFilter } from '../hooks/useSelectionFilter';
import { SelectionFilterToolbar } from '../components/SelectionFilterToolbar';

type TabType = 'product' | 'influencers' | 'cards';

const MetricPill = ({ label, value }: { label: string; value: string }) => (
  <div style={{ padding: '0.35rem 0.75rem', background: '#e9ecef', borderRadius: '12px', fontSize: '0.85rem', color: '#495057', border: '1px solid #dee2e6' }}>
    <strong style={{ marginRight: '0.35rem' }}>{label}:</strong>{value}
  </div>
);

export default function BrandDashboard() {
  const { brandId, tab } = useParams<{ brandId: string; tab?: string }>();
  const navigate = useNavigate();
  const seedMode = import.meta.env.VITE_USE_SEED === '1';
  const initialTab: TabType =
    tab === 'influencers' || tab === 'cards' ? (tab as TabType) : 'product';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [data, setData] = useState<BrandData | null>(null);
  const [influencerStates, setInfluencerStates] = useState<Record<string, { enabled: boolean }>>({});
  const [cardStatuses, setCardStatuses] = useState<Record<string, 'draft' | 'ready' | 'published'>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);
  const [gallery, setGallery] = useState<{ headshot: string; actionImages: string[] } | null>(null);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [brandProductImages, setBrandProductImages] = useState<string[]>([]);
  const [isGeneratingDataset, setIsGeneratingDataset] = useState(false);
  const [datasetUrl, setDatasetUrl] = useState<string | null>(null);
  const [generationSummary, setGenerationSummary] = useState<{
    totalGenerated: number;
    totalSkipped: number;
    totalCards: number;
    totalWithImages: number;
    message?: string;
  } | null>(null);

  // Reusable selection + filter for influencers (by text)
  const {
    searchTerm: influencerSearch,
    setSearchTerm: setInfluencerSearch,
    filtered: filteredInfluencers,
    selectedKeys: selectedInfluencerIds,
    toggleSelection: toggleInfluencerSelection,
    selectAll: selectAllInfluencers,
    clearSelection: clearInfluencerSelection,
  } = useSelectionFilter<Influencer, string>(
    data?.influencers || [],
    (inf) => inf.influencerId,
    (inf, rawNeedle) => {
      const needle = rawNeedle.toLowerCase();
      return (
        inf.name.toLowerCase().includes(needle) ||
        inf.domain.toLowerCase().includes(needle) ||
        inf.bio.toLowerCase().includes(needle)
      );
    },
  );

  // Reusable selection + filter for cards in the Publish tab
  const {
    searchTerm: cardSearch,
    setSearchTerm: setCardSearch,
    filtered: filteredCards,
    selectedKeys: selectedCards,
    toggleSelection: toggleCardSelection,
    selectAll: selectAllCards,
    clearSelection: clearCardSelection,
  } = useSelectionFilter<Card, string>(
    data?.cards || [],
    (card) => card.cardId,
    (card, rawNeedle) => {
      const term = rawNeedle.trim();
      const haystacks = [
        card.query,
        card.response,
        card.cardId,
      ];

      // If term looks like a regex, try to use it
      try {
        const re = new RegExp(term, 'i');
        return haystacks.some((h) => re.test(h));
      } catch {
        const needle = term.toLowerCase();
        return haystacks.some((h) => h.toLowerCase().includes(needle));
      }
    },
  );

  // Cards used in the Publish tab – reuse the same filtered list but
  // sort so that drafts/ready cards appear before published ones.
  // (Publish tab removed; keep filteredCards as the single source of truth.)

  // Keep activeTab in sync with URL segment so that /brand/:brandId/:tab
  // is the source of truth for which section is active.
  useEffect(() => {
    const nextTab: TabType =
      tab === 'influencers' || tab === 'cards' ? (tab as TabType) : 'product';
    if (nextTab !== activeTab) {
      setActiveTab(nextTab);
    }
  }, [tab, activeTab]);

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

        // For the FlowForm demo brand, always fall back to local seed data
        if (brandId === 'flowform') {
          throw new Error('__FLOWFORM_SEED_ONLY__');
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

        const brandData: BrandData = {
          brand: brandRes.brand,
          personas: personasRes.personas,
          environments: environmentsRes.environments,
          influencers: influencersRes.influencers || [],
          cards: cardsRes.cards || [],
        };

        setData(brandData);
        setBrandProductImages(brandData.brand.productImages ?? []);

        const initialStates: Record<string, { enabled: boolean }> = {};
        brandData.influencers.forEach((inf) => {
          initialStates[inf.influencerId] = {
            enabled: inf.enabled,
          };
        });
        setInfluencerStates(initialStates);

        const initialCardStatuses: Record<string, 'draft' | 'ready' | 'published'> = {};
        brandData.cards.forEach((card) => {
          initialCardStatuses[card.cardId] = (card.status as 'draft' | 'ready' | 'published') ?? 'draft';
        });
        setCardStatuses(initialCardStatuses);
      } catch (e) {
        const shouldFallbackToSeed = !brandId || brandId === 'flowform';
        if (shouldFallbackToSeed) {
          try {
            const seed: any = flowformSeed;

            const brandData: BrandData = {
              brand: {
                brandId: seed.brand.id,
                name: seed.brand.name,
                domain: seed.brand.domain,
                description: seed.brand.description,
                productImages: seed.brand.productImages ?? [],
                contentSources: seed.brand.contentSources ?? [],
                urlSlug: 'flowform',
              },
              personas: (seed.personas || []).map((p: any) => ({
                personaId: p.id,
                brandId: p.brandId,
                label: p.label,
                description: p.description,
                tags: p.tags ?? [],
              })),
              environments: (seed.environments || []).map((env: any) => ({
                environmentId: env.id,
                brandId: env.brandId,
                label: env.label,
                description: env.description,
                tags: env.type ? [env.type] : [],
              })),
            influencers: (seed.influencers || []).slice(0, 5).map((inf: any) => ({
              influencerId: inf.id,
              name: inf.name,
              bio: `${inf.role}: ${inf.bioShort} (Age ${inf.ageRange})`,
              domain: inf.role,
              imageUrl: inf.imageUrl && inf.imageUrl.startsWith('http')
                ? inf.imageUrl
                : `https://placehold.co/400x200?text=${encodeURIComponent(inf.name)}`,
              actionImageUrls: [],
              enabled: inf.enabled ?? true,
            })),
            cards: (seed.cards || []).map((c: any) => ({
              cardId: c.id,
                brandId: c.brandId,
                personaId: c.personaId ?? null,
              influencerId: c.influencerId,
              environmentId: c.environmentId ?? null,
              query: c.query,
              response: c.response,
              imageUrl: c.imageUrl && c.imageUrl.startsWith('http')
                ? c.imageUrl
                : `https://placehold.co/800x600?text=${encodeURIComponent(c.query.substring(0, 30))}`,
              imageBrief: c.imageBrief ?? '',
              status: (c.status as 'draft' | 'published' | string) ?? 'draft',
              viewCount: c.viewCount ?? 0,
            })),
          };

            setData(brandData);
            setBrandProductImages(brandData.brand.productImages ?? []);

            const initialStates: Record<string, { enabled: boolean }> = {};
            brandData.influencers.forEach((inf) => {
              initialStates[inf.influencerId] = {
                enabled: inf.enabled,
              };
            });
            setInfluencerStates(initialStates);

            const initialCardStatuses: Record<string, 'draft' | 'ready' | 'published'> = {};
            brandData.cards.forEach((card) => {
              initialCardStatuses[card.cardId] = (card.status as 'draft' | 'ready' | 'published') ?? 'draft';
            });
            setCardStatuses(initialCardStatuses);
            setError(null);
          } catch (seedError) {
            setError(seedError instanceof Error ? seedError.message : 'Failed to load brand data');
          }
        } else {
          setError(e instanceof Error ? e.message : 'Failed to load brand data');
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [brandId]);

  const handleToggleInfluencer = async (influencerId: string, enabled: boolean) => {
    const applyLocal = () => {
      setInfluencerStates(prev => ({
        ...prev,
        [influencerId]: {
          ...prev[influencerId],
          enabled
        }
      }));
      setData(prev =>
        prev
          ? {
              ...prev,
              influencers: prev.influencers.map(inf =>
                inf.influencerId === influencerId ? { ...inf, enabled } : inf,
              ),
            }
          : prev,
      );
    };

    applyLocal();

    if (seedMode) return;

    try {
      await apiClient.updateInfluencerEnabled(influencerId, enabled);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update influencer');
    }
  };

  const handleMatchInfluencers = async () => {
    try {
      const { influencers } = await apiClient.findNewInfluencers();
      // rebuild influencer state
      const nextStates: Record<string, { enabled: boolean }> = {};
      influencers.forEach(inf => {
        nextStates[inf.influencerId] = { enabled: inf.enabled };
      });
      setInfluencerStates(nextStates);
      setData(prev => prev ? { ...prev, influencers } : prev);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to match influencers');
    }
  };

  const handleActivateSelectedInfluencers = async () => {
    if (!data) return;
    const ids = Array.from(selectedInfluencerIds);
    if (ids.length === 0) return;
    try {
      await Promise.all(ids.map(id => apiClient.updateInfluencerEnabled(id, true)));
      setInfluencerStates(prev => {
        const next: Record<string, { enabled: boolean }> = { ...prev };
        ids.forEach(id => {
          next[id] = {
            ...(next[id] || { enabled: true }),
            enabled: true,
          };
        });
        return next;
      });
      setData(prev =>
        prev
          ? {
              ...prev,
              influencers: prev.influencers.map(inf =>
                ids.includes(inf.influencerId) ? { ...inf, enabled: true } : inf,
              ),
            }
          : prev,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to activate influencers');
    }
  };

  const handleDeactivateSelectedInfluencers = async () => {
    if (!data) return;
    const ids = Array.from(selectedInfluencerIds);
    if (ids.length === 0) return;
    try {
      await Promise.all(ids.map(id => apiClient.updateInfluencerEnabled(id, false)));
      setInfluencerStates(prev => {
        const next: Record<string, { enabled: boolean }> = { ...prev };
        ids.forEach(id => {
          next[id] = {
            ...(next[id] || { enabled: false }),
            enabled: false,
          };
        });
        return next;
      });
      setData(prev =>
        prev
          ? {
              ...prev,
              influencers: prev.influencers.map(inf =>
                ids.includes(inf.influencerId) ? { ...inf, enabled: false } : inf,
              ),
            }
          : prev,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to deactivate influencers');
    }
  };

  const handleDeleteSelectedInfluencers = async () => {
    if (!data) return;
    const ids = Array.from(selectedInfluencerIds);
    if (ids.length === 0) return;
    try {
      await Promise.all(ids.map(id => apiClient.deleteInfluencer(id)));
      setData(prev =>
        prev
          ? {
              ...prev,
              influencers: prev.influencers.filter(inf => !ids.includes(inf.influencerId)),
            }
          : prev,
      );
      setInfluencerStates(prev => {
        const next = { ...prev };
        ids.forEach(id => {
          delete next[id];
        });
        return next;
      });
      if (selectedInfluencer && ids.includes(selectedInfluencer.influencerId)) {
        setSelectedInfluencer(null);
        setGallery(null);
      }
      clearInfluencerSelection();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete influencers');
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

  const handlePublishSelected = async () => {
    if (selectedCards.size === 0) return;
    const ids = Array.from(selectedCards);
    // Optimistically update local state so offline/seed mode still works
    const applyLocal = () => {
      const newStatuses = { ...cardStatuses };
      ids.forEach(cardId => {
        newStatuses[cardId] = 'published';
      });
      setCardStatuses(newStatuses);
      setData(prev =>
        prev
          ? {
              ...prev,
              cards: prev.cards.map(card =>
                ids.includes(card.cardId) ? { ...card, status: 'published' } : card,
              ),
            }
          : prev,
      );
      clearCardSelection();
    };

    try {
      applyLocal();
      if (!seedMode) {
        await apiClient.publishCards(ids);
      }
    } catch (e) {
      // keep local optimistic state even if API fails in demo mode
      setError(e instanceof Error ? e.message : 'Failed to publish cards (using offline state)');
    }
  };

  const handleMoveSelectedToDraft = async () => {
    if (selectedCards.size === 0) return;
    try {
      const ids = Array.from(selectedCards);
      await apiClient.unpublishCards(ids);

      const newStatuses = { ...cardStatuses };
      ids.forEach(cardId => {
        newStatuses[cardId] = 'draft';
      });
      setCardStatuses(newStatuses);

      setData(prev =>
        prev
          ? {
              ...prev,
              cards: prev.cards.map(card =>
                ids.includes(card.cardId) ? { ...card, status: 'draft' } : card,
              ),
            }
          : prev,
      );

      clearCardSelection();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to move cards back to draft');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedCards.size === 0) return;
    try {
      const ids = Array.from(selectedCards);
      await apiClient.deleteCards(ids);

      setData(prev =>
        prev
          ? {
              ...prev,
              cards: prev.cards.filter((c) => !selectedCards.has(c.cardId)),
            }
          : prev,
      );

      setCardStatuses((prev) => {
        const next = { ...prev };
        ids.forEach((id) => {
          delete next[id];
        });
        return next;
      });

      clearCardSelection();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete cards');
    }
  };

  const handleGenerateDataset = async () => {
    if (!data) return;

    setIsGeneratingDataset(true);
    setError(null);
    setGenerationSummary(null);

    try {
      // If specific influencers are selected, ensure they are marked as enabled
      // so the card generation workflow can find "enabled" influencers.
      if (selectedInfluencerIds.size > 0) {
        await handleActivateSelectedInfluencers();
      }

      // Trigger card generation workflow for this brand
      const workflowResult = await apiClient.generateCards(data.brand.brandId);

      // Refresh cards from API so the gallery shows newly generated cards
      const refreshed = await apiClient.getCards(data.brand.brandId);

      setData(prev =>
        prev
          ? {
              ...prev,
              cards: refreshed.cards,
            }
          : prev,
      );

      const updatedStatuses: Record<string, 'draft' | 'ready' | 'published'> = {};
      refreshed.cards.forEach(card => {
        updatedStatuses[card.cardId] = (card.status as 'draft' | 'ready' | 'published') ?? 'draft';
      });
      setCardStatuses(updatedStatuses);

      const totalCards = refreshed.cards.length;
      const totalWithImages = refreshed.cards.filter(card => !!card.imageUrl).length;

      setGenerationSummary({
        totalGenerated: workflowResult.totalGenerated ?? 0,
        totalSkipped: workflowResult.totalSkipped ?? 0,
        totalCards,
        totalWithImages,
        message: workflowResult.message,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate cards');
    } finally {
      setIsGeneratingDataset(false);
    }
  };

  const handlePublishDataset = () => {
    if (!data) return;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const url = `${baseUrl}/dataset/${data.brand.brandId}`;
    setDatasetUrl(url);
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
          onClick={() => navigate(`/brand/${brandId ?? data.brand.brandId}/product`)}
          style={tabStyle(activeTab === 'product')}
        >
          Product
        </button>
        <button
          onClick={() => navigate(`/brand/${brandId ?? data.brand.brandId}/influencers`)}
          style={tabStyle(activeTab === 'influencers')}
        >
          Influencers
        </button>
        <button
          onClick={() => navigate(`/brand/${brandId ?? data.brand.brandId}/cards`)}
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
            <SelectionFilterToolbar
              title="Influencer Profiles"
              selectedCount={selectedInfluencerIds.size}
              visibleCount={filteredInfluencers.length}
              totalCount={data.influencers.length}
              searchPlaceholder="Search influencers..."
              searchTerm={influencerSearch}
              onSearchChange={setInfluencerSearch}
              onSelectAll={selectAllInfluencers}
              onClearSelection={clearInfluencerSelection}
              actions={[
                {
                  label: 'Find New',
                  onClick: handleMatchInfluencers,
                  disabled: false,
                  variant: 'primary',
                },
                {
                  label: 'Use Selected in Generation',
                  onClick: handleActivateSelectedInfluencers,
                  disabled: selectedInfluencerIds.size === 0,
                  variant: 'success',
                },
                {
                  label: 'Skip Selected',
                  onClick: handleDeactivateSelectedInfluencers,
                  disabled: selectedInfluencerIds.size === 0,
                  variant: 'default',
                },
                {
                  label: 'Delete Selected',
                  onClick: handleDeleteSelectedInfluencers,
                  disabled: selectedInfluencerIds.size === 0,
                  variant: 'danger',
                },
              ]}
            />
            <InfluencersTab
              influencers={filteredInfluencers}
              influencerStates={influencerStates}
              selectedIds={selectedInfluencerIds}
              onToggleSelected={toggleInfluencerSelection}
              onToggleEnabled={handleToggleInfluencer}
              onSelectOne={(inf) => handleSelectInfluencer(inf)}
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
          <>
            <SelectionFilterToolbar
              title="Wisdom Cards"
              selectedCount={selectedCards.size}
              visibleCount={filteredCards.length}
              totalCount={data.cards.length}
              searchPlaceholder="Search cards (text or regex)..."
              searchTerm={cardSearch}
              onSearchChange={setCardSearch}
              onSelectAll={selectAllCards}
              onClearSelection={clearCardSelection}
              actions={[
                {
                  label: 'Publish Selected',
                  onClick: handlePublishSelected,
                  disabled: selectedCards.size === 0,
                  variant: 'success',
                },
                {
                  label: 'Move to Draft',
                  onClick: handleMoveSelectedToDraft,
                  disabled: selectedCards.size === 0,
                  variant: 'default',
                },
                {
                  label: 'Delete Selected',
                  onClick: handleDeleteSelected,
                  disabled: selectedCards.size === 0,
                  variant: 'danger',
                },
              ]}
            />
            {generationSummary && (
              <div
                style={{
                  marginBottom: '0.75rem',
                  fontSize: '0.85rem',
                  color: '#6c757d',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.15rem',
                }}
              >
                <span>
                  {generationSummary.message ??
                    `Generated ${generationSummary.totalGenerated} cards (${generationSummary.totalSkipped} skipped).`}
                </span>
                <span>
                  Current brand has {generationSummary.totalCards} cards,{' '}
                  {generationSummary.totalWithImages} with images and{' '}
                  {generationSummary.totalCards - generationSummary.totalWithImages} without images.
                </span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', marginBottom: '1rem' }}>
              {isGeneratingDataset && (
                <span style={{ color: '#6c757d', fontStyle: 'italic', fontSize: '0.95rem' }}>
                  Thinking …
                </span>
              )}
              <button
                type="button"
                onClick={handleGenerateDataset}
                disabled={isGeneratingDataset}
                style={{
                  padding: '0.6rem 1.25rem',
                  background: isGeneratingDataset ? '#6c757d' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isGeneratingDataset ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.95rem',
                }}
                title="Placeholder: trigger AI dataset generation for these cards"
              >
                {isGeneratingDataset ? 'Generating…' : 'Generate Dataset'}
              </button>

              {datasetUrl ? (
                <a
                  href={datasetUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    padding: '0.6rem 1.25rem',
                    background: '#28a745',
                    color: 'white',
                    borderRadius: '4px',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    fontSize: '0.95rem',
                  }}
                  title="Open published dataset page in a new tab"
                >
                  Open Dataset Page
                </a>
              ) : (
                <button
                  type="button"
                  onClick={handlePublishDataset}
                  style={{
                    padding: '0.6rem 1.25rem',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '0.95rem',
                  }}
                  title="Publish this brand's cards as a crawlable dataset page"
                >
                  Publish
                </button>
              )}
            </div>

            <CardGallery
              cards={filteredCards}
              influencers={data.influencers}
              personas={data.personas}
              onImageClick={(url) => setLightboxUrl(url)}
              selectedIds={selectedCards}
              onToggleSelected={toggleCardSelection}
            />
          </>
        )}
        {activeTab === 'publish' && (
          <PublishTab
            cards={data.cards}
            cardStatuses={cardStatuses}
            selectedCards={selectedCards}
            onToggleSelection={toggleCardSelection}
            onPublish={handlePublishSelected}
            onDeleteSelected={handleDeleteSelected}
            onSelectAll={selectAllCards}
            onClearSelection={clearCardSelection}
            searchTerm={cardSearch}
            onSearchChange={setCardSearch}
          />
        )}
        {activeTab === 'ai' && (
          <AIContentTab />
        )}
      </div>

      <div style={{ marginTop: '2rem' }}>
        <button
          type="button"
          onClick={() => navigate('/')}
          style={{
            padding: '0.5rem 1rem',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Back to Home
        </button>
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

  const isFlowForm = brand.urlSlug === 'flowform';

  const displayPersonas: Persona[] = isFlowForm
    ? [
        {
          personaId: 'demo_wfh_yoga_creative',
          brandId: brand.brandId,
          label: 'WFH Yoga Creative',
          description:
            'Remote creative professional who practices yoga daily in their small apartment to counteract desk work. Values mindful movement and form awareness.',
          tags: ['yoga', 'WFH', 'creative', 'desk-body'],
        },
        {
          personaId: 'demo_midcareer_knowledge_worker',
          brandId: brand.brandId,
          label: 'Mid-Career Knowledge Worker',
          description:
            '40-something desk worker experiencing back stiffness and poor posture. Looking for gentle, sustainable movement practices.',
          tags: ['desk-body', 'posture', 'back-pain', 'beginner'],
        },
        {
          personaId: 'demo_beginner_runner_yoga',
          brandId: brand.brandId,
          label: 'Beginner Runner Who Loves Yoga',
          description:
            'Weekend runner who cross-trains with yoga. Wants to improve running form and prevent injuries through better movement awareness.',
          tags: ['running', 'yoga', 'form-feedback', 'injury-prevention'],
        },
        {
          personaId: 'demo_young_parent_balancing_life',
          brandId: brand.brandId,
          label: 'Young Parent Balancing Life',
          description:
            'Early-30s parent working from home, squeezing in quick workouts between responsibilities. Needs efficient, space-friendly fitness solutions.',
          tags: ['WFH', 'parent', 'time-constrained', 'yoga', 'strength'],
        },
      ]
    : personas;

  const displayEnvironments: Environment[] = isFlowForm
    ? [
        {
          environmentId: 'demo_nyc_apartment_yoga_corner',
          brandId: brand.brandId,
          label: 'NYC Apartment Yoga Corner',
          description:
            'A small New York City apartment living room with a yoga mat between the couch and coffee table, plants by the window, and just enough space to flow.',
          tags: ['nyc-apartment', 'small-space', 'yoga', 'indoor'],
        },
        {
          environmentId: 'demo_city_track_park_loop',
          brandId: brand.brandId,
          label: 'City Track and Park Loop',
          description:
            'An urban running track and nearby park loop in the city, with skyline views and mixed pavement and path surfaces for easy runs and form drills.',
          tags: ['city-track', 'park-loop', 'running', 'outdoor'],
        },
        {
          environmentId: 'demo_clinic_research_office',
          brandId: brand.brandId,
          label: 'Clinic or Research Office with Standing Desk',
          description:
            'A bright clinic or research office where a movement specialist uses a standing desk, screens with simple joint diagrams, and a mat for demonstrations.',
          tags: ['clinic', 'research', 'standing-desk', 'demo-space'],
        },
        {
          environmentId: 'demo_compact_home_strength_corner',
          brandId: brand.brandId,
          label: 'Compact Home Strength Corner',
          description:
            'A corner of a living room or garage with a mat, a few dumbbells, and a small rack—just enough space for squats, hinges, and simple strength circuits.',
          tags: ['home-gym', 'strength-corner', 'compact', 'indoor'],
        },
      ]
    : environments;

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

      {/* Show both Personas and Environments together so product view gives full context */}
      <h3 style={{ margin: '0 0 0.75rem 0' }}>Personas</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {displayPersonas.map((persona) => (
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

      <h3 style={{ margin: '0 0 0.75rem 0' }}>Environments</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
        {displayEnvironments.map(env => (
          <div
            key={env.environmentId}
            data-testid="environment-card"
            style={{ padding: '1rem', background: 'white', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
          >
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
  selectedIds,
  onToggleSelected,
  onToggleEnabled,
  onSelectOne,
}: {
  influencers: Influencer[];
  influencerStates: Record<string, { enabled: boolean }>;
  selectedIds: Set<string>;
  onToggleSelected: (id: string) => void;
  onToggleEnabled: (id: string, enabled: boolean) => void;
  onSelectOne: (inf: Influencer) => void;
}) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {influencers.map((influencer) => {
          const state = influencerStates[influencer.influencerId] || { enabled: false };
          const isSelected = selectedIds.has(influencer.influencerId);
          return (
            <div
              key={influencer.influencerId}
              data-testid="influencer-card"
              onClick={() => onSelectOne(influencer)}
              style={{
                padding: '1.5rem',
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                opacity: state.enabled ? 1 : 0.6,
                cursor: 'pointer'
              }}
            >
              <img
                src={influencer.imageUrl || `https://placehold.co/400x200?text=${encodeURIComponent(influencer.name)}`}
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
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      e.stopPropagation();
                      onToggleSelected(influencer.influencerId);
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.85rem', color: '#495057' }}>Select</span>
                </label>
              </div>
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
              <button
                type="button"
                data-testid="enable-toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleEnabled(influencer.influencerId, !state.enabled);
                }}
                style={{
                  padding: '0.5rem 1rem',
                  background: state.enabled ? '#28a745' : '#e9ecef',
                  color: state.enabled ? 'white' : '#495057',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                }}
              >
                {state.enabled ? 'In generation' : 'Use in generation'}
              </button>
            </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PublishTab({
  cards,
  cardStatuses,
  selectedCards,
  onToggleSelection,
  onPublish,
  onDeleteSelected,
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
  onDeleteSelected: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  searchTerm: string;
  onSearchChange: (v: string) => void;
}) {
  const publishedCount = Object.values(cardStatuses).filter(status => status === 'published').length;

  return (
    <div>
      <SelectionFilterToolbar
        title="Publish Cards"
        subtitle={<span style={{ color: '#6c757d' }}>{publishedCount} published</span>}
        selectedCount={selectedCards.size}
        visibleCount={cards.length}
        totalCount={cards.length}
        searchPlaceholder="Search cards..."
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        onSelectAll={onSelectAll}
        onClearSelection={onClearSelection}
        actions={[
          {
            label: `Publish Selected (${selectedCards.size})`,
            testId: 'publish-button',
            onClick: onPublish,
            disabled: selectedCards.size === 0,
            variant: 'success',
          },
          {
            label: 'Delete Selected',
            onClick: onDeleteSelected,
            disabled: selectedCards.size === 0,
            variant: 'danger',
          },
        ]}
      />

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
                <div data-testid="card-url" style={{ fontSize: '0.85rem', color: '#007bff' }}>
                  <a href={`/cards/${card.cardId}`}>{`/cards/${card.cardId}`}</a>
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

function AIContentTab() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const examplePrompts = [
    'Write a customer persona for a busy parent who uses FlowForm for 10-minute workouts.',
    'Describe a training environment for yoga in a small apartment with FlowForm.',
    'Draft a training card about improving running form with FlowForm Motion Suit.',
    'Explain how professional athletes can use FlowForm for recovery sessions.',
  ];

  const handleExample = (text: string) => {
    setPrompt(text);
  };

  const handleGenerate = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
      <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e9ecef' }}>
        <div style={{ marginBottom: '0.5rem', fontWeight: 'bold' }}>Example Prompts</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {examplePrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleExample(p)}
              style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #ced4da', cursor: 'pointer' }}
            >
              {p.includes('persona') ? 'customer persona' :
               p.includes('environment') ? 'training environment' :
               p.includes('athletes') ? 'professional athletes' : 'training card'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e9ecef', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <textarea
          placeholder="Enter a prompt to generate content..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={5}
          style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #ced4da', fontSize: '1rem', fontFamily: 'inherit' }}
        />
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!prompt || loading}
            style={{
              padding: '0.7rem 1.5rem',
              borderRadius: '6px',
              border: 'none',
              background: loading ? '#6c757d' : '#007bff',
              color: 'white',
              cursor: (!prompt || loading) ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Generating...' : 'Generate Content'}
          </button>
          <span style={{ color: '#6c757d' }}>Mastra Backend Required — run <code>npm run dev:mastra</code></span>
        </div>
      </div>
    </div>
  );
}
