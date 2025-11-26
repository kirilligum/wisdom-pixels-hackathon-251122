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
  const [showHint, setShowHint] = useState(false);

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
      setShowHint(true);
    }
  };

  const handleLogout = () => {
    setLoggedIn(false);
    localStorage.setItem(STORAGE_KEY, 'false');
    sessionStorage.setItem('wp-skip-auto-login', '1');
  };

  if (!loggedIn) {
    return (
      <div className="login-shell">
        <div className="login-panel">
          <div className="login-brand">
            <div className="login-mark" />
            <div>
              <div className="login-title">Wisdom Pixels</div>
              <div className="login-subtitle">Multi-modal influencer training cards</div>
            </div>
          </div>
          <div className="login-card">
            <h1>Sign in</h1>
            <p>Sign in to review brands, influencers, and cards.</p>
            <form onSubmit={handleLogin} className="login-form">
              <label className="login-label">
                Username
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="guest"
                  className="login-input"
                />
              </label>
              <label className="login-label">
                Password
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="••••••••"
                  className="login-input"
                />
              </label>
              {error && (
                <div className="login-error">
                  {error}
                  {showHint ? ' Hint: check your team credentials.' : ''}
                </div>
              )}
              <button type="submit" className="login-button">Continue</button>
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
