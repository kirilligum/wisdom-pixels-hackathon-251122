import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { BrandData, Card } from '../types';
import { apiClient } from '../lib/api-client';

export default function CardDetail() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<BrandData | null>(null);
  const [card, setCard] = useState<Card | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuery, setEditedQuery] = useState('');
  const [editedResponse, setEditedResponse] = useState('');
  const [viewCount, setViewCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);

        const { card } = await apiClient.getCard(id);
        const [personasRes, envRes, influencersRes] = await Promise.all([
          apiClient.getPersonas(card.brandId),
          apiClient.getEnvironments(card.brandId),
          apiClient.getInfluencers(),
        ]);
        const brandRes = await apiClient.getBrand(card.brandId);

        const brandData: BrandData = {
          brand: brandRes.brand,
          personas: personasRes.personas,
          environments: envRes.environments,
          influencers: influencersRes.influencers,
          cards: [card],
        };

        setCard(card);
        setData(brandData);
        setEditedQuery(card.query);
        setEditedResponse(card.response);

        const viewKey = `card_views_${id}`;
        const currentViews = parseInt(localStorage.getItem(viewKey) || '0', 10);
        const newViews = currentViews + 1;
        localStorage.setItem(viewKey, newViews.toString());
        setViewCount(newViews);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load card');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    if (card) {
      // Update the card with edited values
      const updatedCard = {
        ...card,
        query: editedQuery,
        response: editedResponse
      };
      setCard(updatedCard);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    if (card) {
      setEditedQuery(card.query);
      setEditedResponse(card.response);
      setIsEditing(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading card...</div>;
  }

  if (error || !data || !card) {
    return (
      <div style={{ padding: '2rem' }}>
        <p style={{ color: '#c0392b' }}>{error || 'Card not found'}</p>
        <Link to="/">Back to Home</Link>
      </div>
    );
  }

  const influencer = data.influencers.find(i => i.influencerId === card.influencerId);
  const persona = data.personas.find(p => p.personaId === card.personaId);
  const brandProductImage = data.brand.productImages?.[0];

  const cardNumberLabel = (() => {
    const parts = card.cardId.split('_');
    const last = parts[parts.length - 1];
    const n = parseInt(last, 10);
    if (Number.isFinite(n)) {
      return `Card ${n}`;
    }
    return 'Card';
  })();

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Card Details</h1>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div data-testid="card-id" style={{ color: '#6c757d', fontSize: '0.95rem' }}>
            Card ID: {card.cardId}
          </div>
          <div
            data-testid="view-count"
            style={{
              color: '#6c757d',
              fontSize: '0.9rem',
              padding: '0.25rem 0.75rem',
              background: '#e9ecef',
              borderRadius: '12px'
            }}
          >
            {viewCount} {viewCount === 1 ? 'view' : 'views'}
          </div>
        </div>
      </div>

      {/* Generated Card Image + Creation Context */}
      <div style={{ marginBottom: '2rem' }}>
        <div
          style={{
            width: '100%',
            height: '320px',
            borderRadius: '8px',
            overflow: 'hidden',
            position: 'relative',
            background: '#f1f3f5',
          }}
        >
          {card.imageUrl ? (
            <img
              src={card.imageUrl}
              alt={card.imageBrief || card.query}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '3rem',
                fontWeight: 'bold',
              }}
            >
              {cardNumberLabel}
            </div>
          )}
        </div>

        <div style={{ marginTop: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#343a40' }}>
            How this card image was created
          </h2>
          <p style={{ margin: '0.5rem 0 1rem', fontSize: '0.9rem', color: '#6c757d' }}>
            This image was generated by Nano Banana Pro using the influencer&rsquo;s reference photo
            {brandProductImage ? ' and the brand product image below' : ''} plus the prompt:
          </p>
          <div
            style={{
              fontSize: '0.9rem',
              color: '#495057',
              background: '#f8f9fa',
              borderRadius: '6px',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              whiteSpace: 'pre-wrap',
            }}
          >
            {card.imageBrief}
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {influencer?.imageUrl && (
              <figure style={{ margin: 0, maxWidth: '220px' }}>
                <div
                  style={{
                    borderRadius: '6px',
                    overflow: 'hidden',
                    border: '1px solid #dee2e6',
                    marginBottom: '0.5rem',
                  }}
                >
                  <img
                    src={influencer.imageUrl}
                    alt={`${influencer.name} reference`}
                    style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                  />
                </div>
                <figcaption style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                  Influencer reference image ({influencer.name})
                </figcaption>
              </figure>
            )}

            {brandProductImage && (
              <figure style={{ margin: 0, maxWidth: '220px' }}>
                <div
                  style={{
                    borderRadius: '6px',
                    overflow: 'hidden',
                    border: '1px solid #dee2e6',
                    marginBottom: '0.5rem',
                  }}
                >
                  <img
                    src={brandProductImage}
                    alt={`${data.brand.name} product reference`}
                    style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                  />
                </div>
                <figcaption style={{ fontSize: '0.8rem', color: '#6c757d' }}>
                  Brand product reference image ({data.brand.name})
                </figcaption>
              </figure>
            )}
          </div>
        </div>
      </div>

      {/* Card Info */}
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        {/* Influencer */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '0.25rem' }}>
            Influencer
          </div>
          <div
            data-testid="card-influencer-name"
            style={{ fontSize: '1.25rem', color: '#6f42c1', fontWeight: 'bold' }}
          >
            {influencer?.name}
          </div>
        </div>

        {/* Persona */}
        {persona && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '0.25rem' }}>
              Persona
            </div>
            <div style={{ fontSize: '1rem', color: '#495057' }}>
              {persona.label}
            </div>
          </div>
        )}

        {/* Query */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '0.5rem' }}>
            Query
          </div>
          {isEditing ? (
            <textarea
              name="query"
              value={editedQuery}
              onChange={(e) => setEditedQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                minHeight: '80px',
                fontFamily: 'inherit'
              }}
            />
          ) : (
            <div
              data-testid="card-query-display"
              style={{ fontSize: '1rem', color: '#495057', lineHeight: '1.5' }}
            >
              {card.query}
            </div>
          )}
        </div>

        {/* Response */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '0.5rem' }}>
            Response
          </div>
          {isEditing ? (
            <textarea
              name="response"
              value={editedResponse}
              onChange={(e) => setEditedResponse(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1rem',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                minHeight: '150px',
                fontFamily: 'inherit'
              }}
            />
          ) : (
            <div
              data-testid="card-response-display"
              style={{ fontSize: '1rem', color: '#495057', lineHeight: '1.6' }}
            >
              {card.response}
            </div>
          )}
        </div>

        {/* Status - show Draft or Published */}
        {(() => {
          const isPublished = String(card.status).toLowerCase() === 'published';
          const label = isPublished ? 'Published' : 'Draft';
          const background = isPublished ? '#d4edda' : '#f8d7da';
          const color = isPublished ? '#155724' : '#721c24';
          return (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '0.5rem' }}>
                Status
              </div>
              <span
                style={{
                  padding: '0.25rem 0.75rem',
                  background,
                  color,
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  display: 'inline-block',
                }}
              >
                {label}
              </span>
            </div>
          );
        })()}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          {!isEditing ? (
            <button
              data-testid="edit-button"
              onClick={handleEdit}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            >
              Edit
            </button>
          ) : (
            <>
              <button
                data-testid="save-button"
                onClick={handleSave}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Back Link */}
      <div>
        <Link
          to={`/brand/${data.brand.brandId}/cards`}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#6c757d',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            display: 'inline-block'
          }}
        >
          Back to Gallery
        </Link>
      </div>
    </div>
  );
}
