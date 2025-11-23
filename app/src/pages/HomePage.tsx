import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Wisdom Pixels</h1>
      <p>Transform marketing content into influencer-backed AI training cards</p>
      <div style={{ marginTop: '2rem' }}>
        <Link to="/brand/flowform" style={{
          padding: '0.5rem 1rem',
          background: '#007bff',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '4px'
        }}>
          View FlowForm Brand
        </Link>
      </div>
    </div>
  );
}
