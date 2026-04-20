import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext.jsx'
import { ShopProvider } from './context/ShopContext.jsx'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import ChatPage from './pages/ChatPage.jsx'
import InventoryPage from './pages/InventoryPage.jsx'
import HindsightPage from './pages/HindsightPage.jsx'
import BillingPage from './pages/BillingPage.jsx'
import AnalyticsPage from './pages/AnalyticsPage.jsx'

// Login page removed — app opens directly to dashboard
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ShopProvider>
          <Toaster position="top-right" toastOptions={{ style: { fontFamily: 'DM Sans, sans-serif', fontSize: '14px' } }} />
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="hindsight" element={<HindsightPage />} />
              <Route path="billing" element={<BillingPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
            </Route>
            {/* Redirect any old /login links straight to dashboard */}
            <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ShopProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
