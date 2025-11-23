import { useParams, Link } from 'react-router-dom';

export default function CardDetail() {
  const { id } = useParams<{ id: string }>();

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Card Detail</h1>
      <p>Card ID: {id}</p>
      <p>Placeholder for card detail view</p>
      <div style={{ marginTop: '2rem' }}>
        <Link to="/brand/flowform" style={{
          padding: '0.5rem 1rem',
          background: '#6c757d',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '4px'
        }}>
          Back to Brand
        </Link>
      </div>
    </div>
  );
}
