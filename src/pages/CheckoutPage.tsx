import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { apiFetch } from '../api/client';
import type { CheckoutResponse, CreateCheckoutRequest } from '../types/store';
import {
  ARGENTINA_PROVINCES,
  formatARS,
  isValidDniOrCuit,
  isValidPostalCodeAR,
} from '../utils/formatters';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerAuth } from '../context/CustomerAuthContext';

export function CheckoutPage() {
  const { items, subtotal } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    customerFullName: '',
    customerEmail: '',
    customerPhone: '',
    dniOrCuit: '',
    taxCondition: 'Consumidor Final',
    street: '',
    streetNumber: '',
    floorApartment: '',
    postalCode: '',
    city: '',
    province: 'Ciudad Autónoma de Buenos Aires',
  });

  const navigate = useNavigate();
  const { customer, loading: authLoading } = useCustomerAuth();

  useEffect(() => {
    if (!authLoading && !customer) {
      navigate('/login?redirect=/checkout', { replace: true });
    } else if (customer) {
      setForm((prev) => ({
        ...prev,
        customerFullName: prev.customerFullName || customer.fullName,
        customerEmail: customer.email,
      }));
    }
  }, [customer, authLoading, navigate]);

  if (authLoading || !customer) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Verificando cuenta...</div>;
  }


  const shippingCost =
    form.province === 'Ciudad Autónoma de Buenos Aires' ? 4500 : 8500;

  const inputClass =
    'w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (items.length === 0) {
      setError('Tu carrito está vacío.');
      return;
    }

    if (!isValidDniOrCuit(form.dniOrCuit)) {
      setError('Ingresá un DNI (7-8 dígitos) o CUIT/CUIL (11 dígitos) válido.');
      return;
    }

    if (!isValidPostalCodeAR(form.postalCode)) {
      setError('Ingresá un Código Postal argentino válido (ej: 1417 o C1417ABC).');
      return;
    }

    setLoading(true);
    try {
      const payload: CreateCheckoutRequest = {
        ...form,
        shippingCost,
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
      };

      sessionStorage.setItem('last_checkout_email', form.customerEmail);

      const res = await apiFetch<CheckoutResponse>('/api/checkout', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      window.location.href = res.checkoutUrl;
    } catch (err: any) {
      setError(err.message || 'No se pudo iniciar el pago con Mercado Pago.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            ← Volver a la tienda
          </Link>
          <span className="text-xs font-medium text-slate-500">🔒 Pago seguro con Mercado Pago</span>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Columna Izquierda: Formularios */}
          <div className="lg:col-span-7 space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-slate-900">1. Datos de Facturación y Contacto</h2>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre y Apellido</label>
                <input
                  required
                  className={inputClass}
                  placeholder="Ej: Juan Pérez"
                  value={form.customerFullName}
                  onChange={(e) => setForm({ ...form, customerFullName: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    required
                    type="email"
                    className={inputClass}
                    placeholder="tu@email.com"
                    value={form.customerEmail}
                    readOnly={true}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono / WhatsApp</label>
                  <input
                    required
                    className={inputClass}
                    placeholder="11 5555-4444"
                    value={form.customerPhone}
                    onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">DNI o CUIT/CUIL</label>
                  <input
                    required
                    className={inputClass}
                    placeholder="Sin puntos ni guiones"
                    value={form.dniOrCuit}
                    onChange={(e) => setForm({ ...form, dniOrCuit: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Condición frente al IVA</label>
                  <select
                    className={inputClass}
                    value={form.taxCondition}
                    onChange={(e) => setForm({ ...form, taxCondition: e.target.value })}
                  >
                    <option value="Consumidor Final">Consumidor Final</option>
                    <option value="Monotributista">Monotributista</option>
                    <option value="Responsable Inscripto">Responsable Inscripto</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-lg font-bold text-slate-900">2. Dirección de Envío</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Provincia</label>
                  <select
                    className={inputClass}
                    value={form.province}
                    onChange={(e) => setForm({ ...form, province: e.target.value })}
                  >
                    {ARGENTINA_PROVINCES.map((prov) => (
                      <option key={prov} value={prov}>
                        {prov}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Localidad / Barrio</label>
                  <input
                    required
                    className={inputClass}
                    placeholder="Ej: Villa del Parque"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Calle</label>
                  <input
                    required
                    className={inputClass}
                    placeholder="Nombre de la calle"
                    value={form.street}
                    onChange={(e) => setForm({ ...form, street: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Altura</label>
                  <input
                    required
                    className={inputClass}
                    placeholder="1234"
                    value={form.streetNumber}
                    onChange={(e) => setForm({ ...form, streetNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Piso / Depto</label>
                  <input
                    className={inputClass}
                    placeholder="Opcional"
                    value={form.floorApartment}
                    onChange={(e) => setForm({ ...form, floorApartment: e.target.value })}
                  />
                </div>
              </div>

              <div className="sm:w-1/2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Código Postal</label>
                <input
                  required
                  className={inputClass}
                  placeholder="Ej: 1417"
                  value={form.postalCode}
                  onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                />
              </div>
            </section>
          </div>

          {/* Columna Derecha: Resumen del Pedido */}
          <aside className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs sticky top-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Resumen de Compra</h3>
            <ul className="divide-y divide-slate-100 mb-4 max-h-64 overflow-y-auto">
              {items.map(({ product, quantity }) => (
                <li key={product.id} className="py-2.5 flex justify-between text-sm">
                  <span className="text-slate-700">
                    {quantity}x {product.name}
                  </span>
                  <span className="font-semibold text-slate-900">
                    {formatARS(product.price * quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="border-t border-slate-200 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{formatARS(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Envío ({form.province})</span>
                <span>{formatARS(shippingCost)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-100">
                <span>Total</span>
                <span>{formatARS(subtotal + shippingCost)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || items.length === 0}
              className="mt-6 w-full py-3.5 px-4 bg-[#009ee3] hover:bg-[#008ed0] disabled:opacity-50 text-white font-bold rounded-xl shadow-sm transition cursor-pointer"
            >
              {loading ? 'Redirigiendo a Mercado Pago...' : 'Pagar con Mercado Pago'}
            </button>
          </aside>
        </form>
      </div>
    </div>
  );
}