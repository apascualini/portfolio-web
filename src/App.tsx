import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { CheckoutPage } from './pages/CheckoutPage';
import { CheckoutResult } from './pages/CheckoutResult';
import { CatalogPage } from './pages/CatalogPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

export function App() {
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    fetch(`${apiUrl}/health`).catch(() => {});
  }, []);

  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CatalogPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/checkout/success" element={<CheckoutResult outcome="success" />} />
          <Route path="/checkout/pending" element={<CheckoutResult outcome="pending" />} />
          <Route path="/checkout/failure" element={<CheckoutResult outcome="failure" />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
