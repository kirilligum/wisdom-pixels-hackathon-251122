import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import HomePage from './pages/HomePage';
import BrandSetup from './pages/BrandSetup';
import BrandDashboard from './pages/BrandDashboard';
import CardDetail from './pages/CardDetail';
import { AuthContext } from './auth-context';

const STORAGE_KEY = 'wp-simple-auth';

function App() {
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const skipAuto = sessionStorage.getItem('wp-skip-auto-login') === '1';
    if (saved === 'true') {
      setLoggedIn(true);
      return;
    }
    if (import.meta.env.VITE_AUTO_LOGIN === '1' && !skipAuto) {
      setLoggedIn(true);
      localStorage.setItem(STORAGE_KEY, 'true');
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'guest' && password === 'gguestt') {
      setLoggedIn(true);
      localStorage.setItem(STORAGE_KEY, 'true');
      sessionStorage.removeItem('wp-skip-auto-login');
      setError('');
    } else {
      setError('Invalid credentials.');
    }
  };

  const handleLogout = () => {
    setLoggedIn(false);
    localStorage.setItem(STORAGE_KEY, 'false');
    sessionStorage.setItem('wp-skip-auto-login', '1');
  };

  if (!loggedIn) {
    return (
      <div className="app-container">
        <div className="main-card-wrapper">
          <h1 className="main-title">Wisdom Pixels</h1>
          <div className="action-card">
            <p className="action-text">Login to manage brands, influencers, and cards.</p>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                style={{ padding: '0.9rem 1rem', borderRadius: '10px', border: '1px solid #3a3f4b', background: '#1f232c', color: '#e2e8f0' }}
              />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="Password"
                style={{ padding: '0.9rem 1rem', borderRadius: '10px', border: '1px solid #3a3f4b', background: '#1f232c', color: '#e2e8f0' }}
              />
              {error && <div style={{ color: '#fc8181', fontWeight: 600 }}>{error}</div>}
              <button type="submit" className="button login">Login</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ loggedIn, logout: handleLogout }}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/setup" element={<BrandSetup />} />
            <Route path="/brand/:brandId/:tab?" element={<BrandDashboard />} />
            <Route path="/card/:id" element={<CardDetail />} />
            <Route path="/cards/:id" element={<CardDetail />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;
