import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import HomePage from './pages/HomePage';
import BrandSetup from './pages/BrandSetup';
import BrandDashboard from './pages/BrandDashboard';
import CardDetail from './pages/CardDetail';
import AppLayout from './components/AppLayout';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/setup" element={<BrandSetup />} />
          {/* Brand dashboard routes: base + tab-specific */}
          <Route path="/brand/:brandId" element={<BrandDashboard />} />
          <Route path="/brand/:brandId/:tab" element={<BrandDashboard />} />
          {/* Card detail remains top-level for stable PRD tests */}
          <Route path="/cards/:id" element={<CardDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
