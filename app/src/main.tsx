import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import HomePage from './pages/HomePage'
import BrandDashboard from './pages/BrandDashboard'
import CardDetail from './pages/CardDetail'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/brand/flowform" element={<BrandDashboard />} />
        <Route path="/cards/:id" element={<CardDetail />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
