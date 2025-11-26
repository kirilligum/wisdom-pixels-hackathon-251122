import { useContext, useState, type CSSProperties } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { AuthContext } from '../auth-context';

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/');
  };

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
            data-testid="account-menu-button"
            onClick={() => setMenuOpen(!menuOpen)}
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
              position: 'relative',
            }}
          >
            WP
            {menuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '40px',
                  right: 0,
                  background: 'white',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                  minWidth: '180px',
                  zIndex: 20,
                  padding: '0.35rem 0',
                }}
              >
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); navigate('/'); }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.6rem 1rem',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                  }}
                >
                  Home
                </button>
                <button
                  type="button"
                  data-testid="logout-button"
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.6rem 1rem',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: '0.95rem',
                    color: '#c0392b',
                  }}
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main style={{ padding: '1.5rem 2rem' }}>
        <Outlet />
      </main>
    </div>
  );
}
