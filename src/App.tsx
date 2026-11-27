import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { CartProvider } from './context/CartContext';
import { CustomerAuthProvider } from './context/CustomerAuthContext';
import { CatalogPage } from './pages/CatalogPage';
import { CustomerLoginPage } from './pages/CustomerLoginPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { CheckoutResult } from './pages/CheckoutResult';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export function App() {
  useEffect(() => {
    const prodApi = ['https://', 'portfolioapi-z9oj', '.onrender.com'].join('');
    const apiUrl = import.meta.env.VITE_API_URL || prodApi;
    fetch(`${apiUrl}/health`).catch(() => {});
  }, []);

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <CustomerAuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<CatalogPage />} />
              <Route path="/login" element={<CustomerLoginPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/checkout/success" element={<CheckoutResult outcome="success" />} />
              <Route path="/checkout/pending" element={<CheckoutResult outcome="pending" />} />
              <Route path="/checkout/failure" element={<CheckoutResult outcome="failure" />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin" element={<AdminDashboardPage />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </CustomerAuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;