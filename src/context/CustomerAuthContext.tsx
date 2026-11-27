import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { apiFetch } from '../api/client';

export interface CustomerUser {
  id: number | string;
  email: string;
  fullName: string;
}

interface CustomerAuthContextType {
  customer: CustomerUser | null;
  loading: boolean;
  setCustomer: (user: CustomerUser | null) => void;
  logout: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<CustomerUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<CustomerUser>('/api/customer-auth/me')
      .then(setCustomer)
      .catch(() => setCustomer(null))
      .finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    await apiFetch('/api/customer-auth/logout', { method: 'POST' }).catch(() => {});
    setCustomer(null);
  };

  return (
    <CustomerAuthContext.Provider value={{ customer, loading, setCustomer, logout }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export const useCustomerAuth = () => {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error('useCustomerAuth debe usarse dentro de CustomerAuthProvider');
  return ctx;
};
