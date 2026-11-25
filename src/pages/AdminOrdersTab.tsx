import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import type { OrderDetail, OrderSummary, PagedResult } from '../types/store';
import { formatARS } from '../utils/formatters';

export function AdminOrdersTab() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [statusFilter, setStatusFilter] = useState('Approved');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const loadOrders = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: '1', pageSize: '50' });
    if (statusFilter) params.append('status', statusFilter);
    if (search.trim()) params.append('search', search.trim());

    apiFetch<PagedResult<OrderSummary>>(`/api/orders?${params.toString()}`)
      .then((res) => setOrders(res.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const openDetail = async (id: number) => {
    const detail = await apiFetch<OrderDetail>(`/api/orders/${id}`);
    setSelectedOrder(detail);
  };

  const changeStatus = async (id: number, newStatus: string) => {
    await apiFetch(`/api/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
    loadOrders();
    if (selectedOrder?.id === id) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
  };

  return (
    <div>
      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="Approved">Pagados (Listos para preparar)</option>
          <option value="Preparing">En preparación</option>
          <option value="Shipped">Despachados</option>
          <option value="Delivered">Entregados</option>
          <option value="Pending">Pendientes de pago</option>
          <option value="Cancelled">Cancelados</option>
        </select>

        <input
          placeholder="Buscar por #ID, nombre o DNI..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={loadOrders}>Buscar</button>
      </div>

      {loading ? (
        <p>Cargando pedidos...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd' }}>
              <th>#</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>DNI/CUIT</th>
              <th>Destino</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} style={{ borderBottom: '1px solid #eee' }}>
                <td>#{o.id}</td>
                <td>{new Date(o.createdAt).toLocaleDateString('es-AR')}</td>
                <td>{o.customerFullName}</td>
                <td>{o.dniOrCuit}</td>
                <td>{o.city}, {o.province}</td>
                <td><strong>{formatARS(o.totalAmount)}</strong></td>
                <td>{o.status}</td>
                <td style={{ display: 'flex', gap: 6, padding: '8px 0' }}>
                  <button onClick={() => openDetail(o.id)}>Ver Etiqueta / Detalle</button>
                  {o.status === 'Approved' && (
                    <button onClick={() => changeStatus(o.id, 'Shipped')}>
                      Marcar Despachado
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal de Detalle para Etiqueta y Facturación */}
      {selectedOrder && (
        <div
          onClick={() => setSelectedOrder(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', padding: 24, borderRadius: 8, maxWidth: 540, width: '100%' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ marginTop: 0 }}>Pedido #{selectedOrder.id} ({selectedOrder.status})</h3>
              <button onClick={() => setSelectedOrder(null)}>✕</button>
            </div>

            <p><strong>Cliente:</strong> {selectedOrder.customerFullName}</p>
            <p><strong>DNI / CUIT:</strong> {selectedOrder.dniOrCuit} ({selectedOrder.taxCondition})</p>
            <p><strong>Teléfono:</strong> {selectedOrder.customerPhone} | <strong>Email:</strong> {selectedOrder.customerEmail}</p>
            <p>
              <strong>Dirección de envío:</strong> {selectedOrder.street} {selectedOrder.streetNumber}{' '}
              {selectedOrder.floorApartment && `(${selectedOrder.floorApartment})`}, CP {selectedOrder.postalCode},{' '}
              {selectedOrder.city}, {selectedOrder.province}
            </p>

            <h4>Productos a empaquetar:</h4>
            <ul>
              {selectedOrder.items.map((item) => (
                <li key={item.productId}>
                  {item.quantity}x {item.productName} — {formatARS(item.subtotal)}
                </li>
              ))}
            </ul>
            <p>Envío: {formatARS(selectedOrder.shippingCost)} | <strong>Total: {formatARS(selectedOrder.totalAmount)}</strong></p>

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={() => changeStatus(selectedOrder.id, 'Preparing')}>En preparación</button>
              <button onClick={() => changeStatus(selectedOrder.id, 'Shipped')}>Despachado</button>
              <button onClick={() => changeStatus(selectedOrder.id, 'Delivered')}>Entregado</button>
              <button onClick={() => changeStatus(selectedOrder.id, 'Cancelled')} style={{ color: 'crimson' }}>
                Cancelar (devuelve stock)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
