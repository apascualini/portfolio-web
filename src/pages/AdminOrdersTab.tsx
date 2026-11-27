import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import type { OrderDetail, OrderSummary, PagedResult } from '../types/store';
import { formatARS } from '../utils/formatters';

const STATUS_BADGES: Record<string, string> = {
  Approved: 'bg-emerald-100 text-emerald-800',
  Preparing: 'bg-amber-100 text-amber-800',
  Shipped: 'bg-sky-100 text-sky-800',
  Delivered: 'bg-slate-200 text-slate-800',
  Pending: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  Rejected: 'bg-rose-100 text-rose-800',
  Cancelled: 'bg-rose-100 text-rose-800',
};

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
    <div className="space-y-4">
      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Todos los estados</option>
          <option value="Approved">Pagados (Listos para preparar)</option>
          <option value="Preparing">En preparación</option>
          <option value="Shipped">Despachados</option>
          <option value="Delivered">Entregados</option>
          <option value="Pending">Pendientes de pago</option>
          <option value="Cancelled">Cancelados</option>
        </select>

        <div className="flex-1 flex gap-2">
          <input
            placeholder="Buscar por #ID, nombre o DNI..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadOrders()}
            className="flex-1 px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={loadOrders}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl cursor-pointer"
          >
            Buscar
          </button>
        </div>
      </div>

      {/* Tabla de Pedidos */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        {loading ? (
          <p className="p-8 text-center text-sm text-slate-500">Cargando pedidos...</p>
        ) : orders.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">No hay pedidos en este estado.</p>
        ) : (
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 uppercase">
                <th className="py-3.5 px-4">#Pedido</th>
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4">Cliente</th>
                <th className="py-3.5 px-4">DNI / CUIT</th>
                <th className="py-3.5 px-4">Destino</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900">#{o.id}</td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {new Date(o.createdAt).toLocaleDateString('es-AR')}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-900">{o.customerFullName}</td>
                  <td className="py-3.5 px-4 text-slate-600">{o.dniOrCuit}</td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {o.city}, {o.province}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{formatARS(o.totalAmount)}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${
                        STATUS_BADGES[o.status] || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => openDetail(o.id)}
                      className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
                    >
                      Ver Etiqueta
                    </button>
                    {o.status === 'Approved' && (
                      <button
                        onClick={() => changeStatus(o.id, 'Shipped')}
                        className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg cursor-pointer"
                      >
                        Despachar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Etiqueta y Detalle */}
      {selectedOrder && (
        <div
          onClick={() => setSelectedOrder(null)}
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-bold text-slate-900">Pedido #{selectedOrder.id}</h3>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    STATUS_BADGES[selectedOrder.status] || 'bg-slate-100'
                  }`}
                >
                  {selectedOrder.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm space-y-1.5">
              <p>
                <span className="font-semibold text-slate-700">Destinatario:</span>{' '}
                {selectedOrder.customerFullName}
              </p>
              <p>
                <span className="font-semibold text-slate-700">DNI / CUIT:</span>{' '}
                {selectedOrder.dniOrCuit} ({selectedOrder.taxCondition})
              </p>
              <p>
                <span className="font-semibold text-slate-700">Contacto:</span>{' '}
                {selectedOrder.customerPhone} — {selectedOrder.customerEmail}
              </p>
              <p>
                <span className="font-semibold text-slate-700">Domicilio:</span>{' '}
                {selectedOrder.street} {selectedOrder.streetNumber}{' '}
                {selectedOrder.floorApartment && `(${selectedOrder.floorApartment})`}, CP{' '}
                {selectedOrder.postalCode}, {selectedOrder.city}, {selectedOrder.province}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">
                Productos a empaquetar
              </h4>
              <ul className="divide-y divide-slate-100 text-sm border border-slate-200 rounded-xl px-3">
                {selectedOrder.items.map((item) => (
                  <li key={item.productId} className="py-2 flex justify-between">
                    <span>
                      <strong>{item.quantity}x</strong> {item.productName}
                    </span>
                    <span className="font-medium">{formatARS(item.subtotal)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between text-sm mt-3 px-1">
                <span className="text-slate-500">Envío: {formatARS(selectedOrder.shippingCost)}</span>
                <span className="font-bold text-slate-900">
                  Total: {formatARS(selectedOrder.totalAmount)}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2">
              <button
                onClick={() => changeStatus(selectedOrder.id, 'Preparing')}
                className="px-3 py-2 text-xs font-semibold bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl cursor-pointer"
              >
                En preparación
              </button>
              <button
                onClick={() => changeStatus(selectedOrder.id, 'Shipped')}
                className="px-3 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-xl cursor-pointer"
              >
                Marcar Despachado
              </button>
              <button
                onClick={() => changeStatus(selectedOrder.id, 'Delivered')}
                className="px-3 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer"
              >
                Entregado
              </button>
              <button
                onClick={() => changeStatus(selectedOrder.id, 'Cancelled')}
                className="px-3 py-2 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl ml-auto cursor-pointer"
              >
                Cancelar (devuelve stock)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}