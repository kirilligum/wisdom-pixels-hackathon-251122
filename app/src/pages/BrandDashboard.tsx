import { Link } from 'react-router-dom';

export default function BrandDashboard() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>FlowForm Brand Dashboard</h1>
      <p>Placeholder for brand dashboard</p>
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
