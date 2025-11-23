import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Card, Influencer, Persona } from '../types';

interface CardGalleryProps {
  cards: Card[];
  influencers: Influencer[];
  personas: Persona[];
}

export default function CardGallery({ cards, influencers, personas }: CardGalleryProps) {
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
    return influencers.find(i => i.influencerId === influencerId)?.name || 'Unknown';
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

        <div style={{ marginLeft: 'auto', color: '#6c757d' }}>
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
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0.5rem', background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 100%)', color: 'white', fontSize: '0.85rem' }}>
                {card.imageBrief}
              </div>
            </div>

            <div style={{ padding: '1rem' }}>
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

              <div style={{
                marginTop: '0.75rem',
                padding: '0.25rem 0.75rem',
                background: card.status === 'published' ? '#d4edda' : '#f8d7da',
                color: card.status === 'published' ? '#155724' : '#721c24',
                borderRadius: '12px',
                fontSize: '0.75rem',
                display: 'inline-block'
              }}>
                {card.status}
              </div>
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
