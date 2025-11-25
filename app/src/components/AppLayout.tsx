import type { CSSProperties } from 'react';
import { Link, Outlet } from 'react-router-dom';

export default function AppLayout() {
  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1.5rem',
    borderBottom: '1px solid #dee2e6',
    background: '#ffffff',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  };

  const iconButtonStyle: CSSProperties = {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '1px solid #dee2e6',
    background: '#f8f9fa',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '0.9rem',
    color: '#495057',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f4f5f7' }}>
      <header style={headerStyle}>
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            textDecoration: 'none',
            color: '#212529',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background:
                'linear-gradient(135deg, #6366f1 0%, #ec4899 50%, #f97316 100%)',
            }}
          />
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Wisdom Pixels</div>
            <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>
              Multi-modal influencer training cards
            </div>
          </div>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button type="button" title="Sidebar" style={iconButtonStyle}>
            ☰
          </button>
          <button type="button" title="Notifications" style={iconButtonStyle}>
            🔔
          </button>
          <button type="button" title="Settings" style={iconButtonStyle}>
            ⚙️
          </button>
          <div
            title="Account"
            style={{
              ...iconButtonStyle,
              borderRadius: '999px',
              padding: 0,
              width: '36px',
              height: '36px',
              background:
                'linear-gradient(135deg, #0ea5e9 0%, #6366f1 50%, #8b5cf6 100%)',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.85rem',
            }}
          >
            JL
          </div>
        </div>
      </header>

      <main style={{ padding: '1.5rem 2rem' }}>
        <Outlet />
      </main>
    </div>
  );
}
