import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useCart } from '../context/CartContext';
import { formatARS } from '../utils/formatters';

interface PublicOrder {
  id: number;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: {
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
}

export function CheckoutResult({ outcome }: { outcome: 'success' | 'failure' | 'pending' }) {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const { clearCart } = useCart();
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (outcome === 'success') {
      clearCart();
    }

    const email = sessionStorage.getItem('last_checkout_email');
    if (orderId && email) {
      apiFetch<PublicOrder>(`/api/orders/${orderId}/public?email=${encodeURIComponent(email)}`)
        .then(setOrder)
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [orderId, outcome]);

  const config = {
    success: {
      icon: '✅',
      badge: 'bg-emerald-100 text-emerald-800',
      title: '¡Gracias por tu compra!',
      subtitle: 'Tu pago fue acreditado y ya estamos preparando tu pedido.',
    },
    pending: {
      icon: '⏳',
      badge: 'bg-amber-100 text-amber-800',
      title: 'Pago pendiente de acreditación',
      subtitle: 'Apenas Mercado Pago confirme el pago, actualizaremos tu pedido.',
    },
    failure: {
      icon: '❌',
      badge: 'bg-rose-100 text-rose-800',
      title: 'No se pudo procesar el pago',
      subtitle: 'Podés volver a intentarlo con otro medio de pago desde la tienda.',
    },
  }[outcome];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
        <div className="text-5xl mb-4">{config.icon}</div>
        <h1 className="text-2xl font-bold text-slate-900">{config.title}</h1>
        <p className="text-sm text-slate-500 mt-2">{config.subtitle}</p>

        {loading && (
          <p className="mt-6 text-sm text-slate-400 animate-pulse">Verificando estado del pedido...</p>
        )}

        {!loading && order && (
          <div className="mt-6 text-left bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <span className="text-sm font-semibold text-slate-700">Pedido #{order.id}</span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${config.badge}`}>
                {order.status}
              </span>
            </div>

            <ul className="divide-y divide-slate-200/70 text-sm">
              {order.items.map((item) => (
                <li key={item.productId} className="py-2 flex justify-between">
                  <span className="text-slate-600">
                    {item.quantity}x {item.productName}
                  </span>
                  <span className="font-medium text-slate-900">{formatARS(item.subtotal)}</span>
                </li>
              ))}
            </ul>

            <div className="flex justify-between items-center border-t border-slate-200 pt-2.5">
              <span className="text-sm font-medium text-slate-600">Total abonado</span>
              <span className="text-lg font-bold text-slate-900">{formatARS(order.totalAmount)}</span>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition"
          >
            Volver a la tienda
          </Link>
          {outcome === 'failure' && (
            <Link
              to="/checkout"
              className="w-full sm:w-auto px-6 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition"
            >
              Reintentar pago
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
