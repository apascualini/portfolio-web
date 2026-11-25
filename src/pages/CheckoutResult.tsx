import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { useCart } from '../context/CartContext';
import { formatARS } from '../utils/formatters';

export function CheckoutResult({ outcome }: { outcome: 'success' | 'failure' | 'pending' }) {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const { clearCart } = useCart();
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    if (outcome === 'success') {
      clearCart();
    }

    const email = sessionStorage.getItem('last_checkout_email');
    if (orderId && email) {
      apiFetch(`/api/orders/${orderId}/public?email=${encodeURIComponent(email)}`)
        .then(setOrder)
        .catch(() => {});
    }
  }, [orderId, outcome]);

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', textAlign: 'center' }}>
      {outcome === 'success' && <h2>¡Gracias por tu compra!</h2>}
      {outcome === 'pending' && <h2>Tu pago está pendiente de acreditación</h2>}
      {outcome === 'failure' && <h2>No se pudo procesar el pago</h2>}

      {order && (
        <div>
          <p>Pedido #{order.id} — Estado: <strong>{order.status}</strong></p>
          <p>Total: {formatARS(order.totalAmount)}</p>
        </div>
      )}

      <Link to="/">Volver a la tienda</Link>
    </div>
  );
}
