import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Card, Influencer, Persona } from '../types';

interface CardGalleryProps {
  cards: Card[];
  influencers: Influencer[];
  personas: Persona[];
  onImageClick?: (url: string) => void;
  selectedIds?: Set<string>;
  onToggleSelected?: (cardId: string) => void;
}

export default function CardGallery({
  cards,
  influencers,
  personas,
  onImageClick,
  selectedIds,
  onToggleSelected,
}: CardGalleryProps) {
  const navigate = useNavigate();
  const [influencerFilter, setInfluencerFilter] = useState('all');
  const [personaFilter, setPersonaFilter] = useState('all');

  // Filter cards
  const filteredCards = cards.filter(card => {
    if (influencerFilter !== 'all' && card.influencerId !== influencerFilter) {
      return false;
    }
    if (personaFilter !== 'all' && card.personaId !== personaFilter) {
      return false;
    }
    return true;
  });

  const getInfluencerName = (influencerId: string) => {
    return influencers.find((i) => i.influencerId === influencerId)?.name || '';
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <label htmlFor="influencerFilter" style={{ marginRight: '0.5rem', fontWeight: 'bold' }}>
            Influencer:
          </label>
          <select
            id="influencerFilter"
            name="influencerFilter"
            value={influencerFilter}
            onChange={(e) => setInfluencerFilter(e.target.value)}
            style={{
              padding: '0.5rem',
              fontSize: '1rem',
              border: '1px solid #ced4da',
              borderRadius: '4px'
            }}
          >
            <option value="all">All Influencers</option>
            {influencers.map(inf => (
              <option key={inf.influencerId} value={inf.influencerId}>{inf.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="personaFilter" style={{ marginRight: '0.5rem', fontWeight: 'bold' }}>
            Persona:
          </label>
          <select
            id="personaFilter"
            name="personaFilter"
            value={personaFilter}
            onChange={(e) => setPersonaFilter(e.target.value)}
            style={{
              padding: '0.5rem',
              fontSize: '1rem',
              border: '1px solid #ced4da',
              borderRadius: '4px'
            }}
          >
            <option value="all">All Personas</option>
            {personas.map(persona => (
              <option key={persona.personaId} value={persona.personaId}>{persona.label}</option>
            ))}
          </select>
        </div>

        <div style={{ marginLeft: 'auto', color: '#6c757d', textAlign: 'right' }}>
          Showing {filteredCards.length} of {cards.length} cards
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1.5rem'
      }}>
        {filteredCards.map(card => (
          <div
            key={card.cardId}
            data-testid="card-item"
            onClick={() => navigate(`/cards/${card.cardId}`)}
            style={{
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            }}
          >
            <div data-testid="card-image" style={{ width: '100%', height: '200px', position: 'relative', background: '#f1f3f5' }}>
              <img
                src={card.imageUrl}
                alt={card.imageBrief || card.query}
                onError={(e) => { e.currentTarget.src = `https://placehold.co/400x250?text=${encodeURIComponent(card.query)}`; }}
                style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onImageClick?.(card.imageUrl);
                }}
              />
            </div>

            <div style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}
                  onClick={(e) => {
                    // Prevent clicking the "Select" label from opening the card
                    e.stopPropagation();
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds?.has(card.cardId) ?? false}
                    onChange={(e) => {
                      e.stopPropagation();
                      onToggleSelected?.(card.cardId);
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.8rem', color: '#495057' }}>Select</span>
                </label>
              </div>

              <div
                data-testid="card-influencer"
                style={{
                  fontSize: '0.85rem',
                  color: '#6f42c1',
                  fontWeight: 'bold',
                  marginBottom: '0.5rem'
                }}
              >
                {getInfluencerName(card.influencerId)}
              </div>

              <div style={{ fontSize: '0.8rem', color: '#6c757d', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Query
              </div>
              <div
                data-testid="card-query"
                style={{
                  fontSize: '0.95rem',
                  color: '#495057',
                  lineHeight: '1.4',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {card.query}
              </div>

              <div style={{ fontSize: '0.8rem', color: '#6c757d', marginTop: '0.75rem', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Response
              </div>
              <div
                data-testid="card-response"
                style={{
                  fontSize: '0.9rem',
                  color: '#6c757d',
                  lineHeight: '1.4',
                  display: '-webkit-box',
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {card.response}
              </div>

              {(() => {
                const isPublished = String(card.status).toLowerCase() === 'published';
                const label = isPublished ? 'Published' : 'Draft';
                const background = isPublished ? '#d4edda' : '#f8d7da';
                const color = isPublished ? '#155724' : '#721c24';
                return (
                  <div
                    data-testid="card-status"
                    style={{
                      marginTop: '0.75rem',
                      padding: '0.25rem 0.75rem',
                      background,
                      color,
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      display: 'inline-block',
                      textTransform: 'capitalize',
                    }}
                  >
                    {label}
                  </div>
                );
              })()}
            </div>
          </div>
        ))}
      </div>

      {filteredCards.length === 0 && (
        <div style={{
          padding: '3rem',
          textAlign: 'center',
          color: '#6c757d'
        }}>
          No cards match the current filters.
        </div>
      )}
    </div>
  );
}
