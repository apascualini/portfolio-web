import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiFetch } from '../api/client';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Credenciales inválidas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      <div className="max-w-sm w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <div className="text-center mb-6">
          <span className="text-3xl">🔐</span>
          <h1 className="text-xl font-bold text-slate-900 mt-2">Acceso Administrador</h1>
          <p className="text-xs text-slate-500 mt-1">Ingresá para gestionar productos y pedidos</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
            <input
              type="email"
              required
              placeholder="admin@tutienda.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contraseña</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition cursor-pointer"
          >
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-slate-500 hover:text-indigo-600">
            ← Volver a la tienda pública
          </Link>
        </div>
      </div>
    </div>
  );
}
