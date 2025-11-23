import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { BrandData, Card } from '../types';
import flowformData from '../data/flowform-seed.json';

export default function CardDetail() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<BrandData | null>(null);
  const [card, setCard] = useState<Card | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuery, setEditedQuery] = useState('');
  const [editedResponse, setEditedResponse] = useState('');
  const [viewCount, setViewCount] = useState(0);

  useEffect(() => {
    // Load FlowForm data
    const brandData = flowformData as BrandData;
    setData(brandData);

    // Find the specific card
    const foundCard = brandData.cards.find(c => c.id === id);
    if (foundCard) {
      setCard(foundCard);
      setEditedQuery(foundCard.query);
      setEditedResponse(foundCard.response);

      // Increment view count (telemetry)
      const viewKey = `card_views_${id}`;
      const currentViews = parseInt(localStorage.getItem(viewKey) || '0', 10);
      const newViews = currentViews + 1;
      localStorage.setItem(viewKey, newViews.toString());
      setViewCount(newViews);
    }
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

  if (!data || !card) {
    return (
      <div style={{ padding: '2rem' }}>
        <p>Loading card...</p>
        <Link to="/brand/flowform">Back to Brand</Link>
      </div>
    );
  }

  const influencer = data.influencers.find(i => i.id === card.influencerId);
  const persona = data.personas.find(p => p.id === card.personaId);

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Card Details</h1>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div data-testid="card-id" style={{ color: '#6c757d', fontSize: '0.95rem' }}>
            Card ID: {card.id}
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

      {/* Card Image Placeholder */}
      <div style={{
        width: '100%',
        height: '300px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '8px',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '4rem',
        fontWeight: 'bold'
      }}>
        {card.id.split('_')[1]}
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

        {/* Status */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '0.5rem' }}>
            Status
          </div>
          <span style={{
            padding: '0.25rem 0.75rem',
            background: card.status === 'published' ? '#d4edda' : '#f8d7da',
            color: card.status === 'published' ? '#155724' : '#721c24',
            borderRadius: '12px',
            fontSize: '0.85rem',
            display: 'inline-block'
          }}>
            {card.status}
          </span>
        </div>

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
          to="/brand/flowform"
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
